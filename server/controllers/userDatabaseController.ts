import { NextFunction, Request, RequestHandler, Response } from 'express';
import pg from 'pg';
import {
  analyzeQueryWithTracing,
  compareQueries,
  ServiceError,
} from '../services/queryAnalysisService';

// Creating a pool for our app database to save metrics.
const appDbPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Consistent HTTP error responses for this controller
const sendErrorResponse = (
  res: Response,
  status: number,
  message: string,
  details?: string,
): void => {
  res.status(status).json({ error: message, message, details });
};

const sendBadRequest = (res: Response, message: string): void => {
  sendErrorResponse(res, 400, message);
};

const sendServerError = (
  res: Response,
  message: string,
  details?: string,
): void => {
  sendErrorResponse(res, 500, message, details);
};

type UserDatabaseController = {
  fetchUserMetrics: RequestHandler;
  saveMetricsToDB: RequestHandler;
  getSavedQueries: RequestHandler;
  analyzeQuery: RequestHandler;
  compareQueries: RequestHandler;
  getQueryHistory: RequestHandler;
};

// Consistent EXPLAIN wrapper for query analysis
const buildExplainAnalyzeQuery = (sqlQuery: string): string =>
  `EXPLAIN (ANALYZE true, COSTS true, SETTINGS true, BUFFERS true, WAL true, SUMMARY true, FORMAT JSON) ${sqlQuery}`;

const userDatabaseController: UserDatabaseController = {
  fetchUserMetrics: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { queryName, uri_string, query } = req.body;

    if (!queryName || !uri_string || !query) {
      console.log('Missing query name, uri string, or query.');
      sendBadRequest(res, 'Query name, uri string and query are required.');
      return;
    }

    const { Pool } = pg;

    try {
      console.log('Connecting to users database...');
      const userDBPool = new Pool({
        connectionString: uri_string,
        ssl: {
          rejectUnauthorized: false, // Required for Supabase connections
        },
      });

      const result = await userDBPool.query(buildExplainAnalyzeQuery(query));

      // once done with pool we close connection to save resources.
      await userDBPool.end();

      const queryPlan = result.rows[0]['QUERY PLAN'][0];

      if (!queryPlan) {
        sendServerError(res, 'Could not retrieve plan data');
        return;
      }

      const sharedHitBlocks = queryPlan['Planning']?.['Shared Hit Blocks'] || 0;
      const sharedReadBlocks =
        queryPlan['Planning']?.['Shared Read Blocks'] || 0;
      const cacheHitRatio =
        sharedHitBlocks + sharedReadBlocks > 0
          ? (sharedHitBlocks / (sharedHitBlocks + sharedReadBlocks)) * 100
          : 0;

      const metrics = {
        executionTime: queryPlan['Execution Time'],
        planningTime: queryPlan['Planning Time'],
        rowsReturned: queryPlan['Plan']?.['Actual Rows'],
        actualLoops: queryPlan['Plan']?.['Actual Loops'],
        sharedHitBlocks: queryPlan['Planning']?.['Shared Hit Blocks'],
        sharedReadBlocks: queryPlan['Planning']?.['Shared Read Blocks'],
        workMem: queryPlan['Settings']?.['work_mem'],
        cacheHitRatio: cacheHitRatio,
        startupCost: queryPlan['Plan']?.['Startup Cost'],
        totalCost: queryPlan['Plan']?.['Total Cost'],
      };

      res.locals.queryMetrics = metrics;
      res.locals.queryName = queryName;
      res.locals.originalQuery = query;
      return next();
    } catch (err) {
      console.error('Error running query', err);
      return next({
        log: 'Error in connectDB middleware',
        status: 500,
        message: { err: 'Failed to get query metrics from database.' },
      });
    }
  },

  saveMetricsToDB: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { queryName, originalQuery, queryMetrics } = res.locals;
    const userId = res.locals.userId;

    if (!queryName || !queryMetrics || !userId || !originalQuery) {
      sendBadRequest(
        res,
        'Query name, metrics, userId, or query text are missing.',
      );
      return;
    }

    try {
      const queryResult = await appDbPool.query(
        'INSERT INTO queries (query_name, query_text, user_id, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id',
        [queryName, originalQuery, userId],
      );

      const queryId = queryResult.rows[0].id;
      await appDbPool.query(
        `INSERT INTO metrics (
          execution_time,
          planning_time,
          rows_returned,
          actual_loops,
          shared_hit_blocks,
          shared_read_blocks,
          work_mem,
          cache_hit_ratio,
          startup_cost,
          total_cost,
          query_id,
          created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
        )`,
        [
          parseFloat(queryMetrics.executionTime) || 0,
          parseFloat(queryMetrics.planningTime) || 0,
          parseInt(queryMetrics.rowsReturned, 10) || 0,
          parseInt(queryMetrics.actualLoops, 10) || 0,
          parseInt(queryMetrics.sharedHitBlocks, 10) || 0,
          parseInt(queryMetrics.sharedReadBlocks, 10) || 0,
          parseInt(queryMetrics.workMem, 10) || 0,
          parseFloat(queryMetrics.cacheHitRatio) || 0,
          parseFloat(queryMetrics.startupCost) || 0,
          parseFloat(queryMetrics.totalCost) || 0,
          queryId,
        ],
      );

      res.status(200).json(queryMetrics);
    } catch (err) {
      console.error('Error saving metrics', err);
      return next({
        log: 'Error in saveMetricsToDB middleware',
        status: 500,
        message: { err: 'Failed to save metrics to the database.' },
      });
    }
  },

  getSavedQueries: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = res.locals.userId;

      if (!userId) {
        sendBadRequest(res, 'User ID is required');
        return;
      }

      const queryResult = await appDbPool.query(
        `
        SELECT 
          q.id,
          q.query_name AS "queryName",
          q.query_text AS "queryText",
          q.created_at AS "createdAt",
          m.execution_time AS "executionTime",
          m.planning_time AS "planningTime",
          m.rows_returned AS "rowsReturned",
          m.actual_loops AS "actualLoops",
          m.shared_hit_blocks AS "sharedHitBlocks",
          m.shared_read_blocks AS "sharedReadBlocks",
          m.work_mem AS "workMem",
          m.cache_hit_ratio AS "cacheHitRatio",
          m.startup_cost AS "startupCost",
          m.total_cost AS "totalCost"
        FROM queries q
        JOIN metrics m ON q.id = m.query_id
        WHERE q.user_id = $1
        ORDER BY q.created_at DESC
      `,
        [userId],
      );

      const savedQueries = queryResult.rows.map((row) => ({
        id: row.id,
        queryName: row.queryName,
        queryText: row.queryText,
        createdAt: row.createdAt,
        metrics: {
          executionTime: parseFloat(row.executionTime),
          planningTime: parseFloat(row.planningTime),
          rowsReturned: parseInt(row.rowsReturned, 10),
          actualLoops: parseInt(row.actualLoops, 10),
          sharedHitBlocks: parseInt(row.sharedHitBlocks, 10),
          sharedReadBlocks: parseInt(row.sharedReadBlocks, 10),
          workMem: parseInt(row.workMem, 10) || 0,
          cacheHitRatio: parseFloat(row.cacheHitRatio),
          startupCost: parseFloat(row.startupCost),
          totalCost: parseFloat(row.totalCost),
        },
      }));

      res.status(200).json(savedQueries);
    } catch (err) {
      console.error('Error fetching saved queries', err);
      return next({
        log: 'Error in getSavedQueries middleware',
        status: 500,
        message: { err: 'Failed to fetch saved queries.' },
      });
    }
  },

  analyzeQuery: async (req: Request, res: Response): Promise<void> => {
    const { sqlQuery } = req.body;
    const userId = res.locals.userId;

    try {
      if (!sqlQuery) {
        sendBadRequest(res, 'SQL query is required.');
        return;
      }

      console.log('Analyzing query for user:', userId);

      const { analysis, insights } = await analyzeQueryWithTracing(
        appDbPool,
        userId,
        sqlQuery,
      );

      res.json({ analysis, insights });
    } catch (error) {
      console.error('Query analysis failed:', error);

      if (error instanceof ServiceError && error.statusCode === 400) {
        sendBadRequest(res, error.message);
        return;
      }

      sendServerError(
        res,
        'Query analysis failed',
        error instanceof Error ? error.message : undefined,
      );
    }
  },

  compareQueries: async (req: Request, res: Response): Promise<void> => {
    const { query1, query2 } = req.body;
    const userId = res.locals.userId;

    if (!query1 || !query2) {
      sendBadRequest(res, 'Both queries are required for comparison.');
      return;
    }

    try {
      const comparison = await compareQueries(
        appDbPool,
        userId,
        query1,
        query2,
      );

      res.json(comparison);
    } catch (error) {
      console.error('Query comparison failed:', error);
      sendServerError(
        res,
        'Query comparison failed',
        error instanceof Error ? error.message : undefined,
      );
    }
  },

  getQueryHistory: async (req: Request, res: Response): Promise<void> => {
    const { queryHash } = req.params;
    const userId = res.locals.userId;

    try {
      const queryResult = await appDbPool.query(
        `SELECT q.query_text, m.*, q.created_at
         FROM queries q
         JOIN metrics m ON q.id = m.query_id
         WHERE q.user_id = $1 AND q.query_text = $2
         ORDER BY q.created_at DESC
         LIMIT 10`,
        [userId, queryHash],
      );

      res.json(queryResult.rows);
    } catch (error) {
      console.error('Error fetching query history:', error);
      sendServerError(
        res,
        'Failed to fetch query history',
        error instanceof Error ? error.message : undefined,
      );
    }
  },
};

export default userDatabaseController;
