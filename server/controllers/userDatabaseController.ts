import { NextFunction, Request, RequestHandler, Response } from 'express';
import pg from 'pg';
import monitoringController from './monitoringController';
import { trace, context, SpanStatusCode, SpanKind } from '@opentelemetry/api';

// Creating a pool for our app database to save metrics.
const appDbPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get tracer for query analysis
const tracer = trace.getTracer('queryhawk-query-analyzer', '1.0.0');

// Enhanced interfaces for query analysis
interface QueryAnalysis {
  executionTime: number;
  planningTime: number;
  totalCost: number;
  bufferHits: number;
  bufferReads: number;
  cacheHitRatio: number;
  insights: QueryInsights;
}

interface QueryInsights {
  isSlowQuery: boolean;
  isBadCache: boolean;
  isExpensive: boolean;
  recommendations: string[];
}

type userDatabaseController = {
  fetchUserMetrics: RequestHandler;
  saveMetricsToDB: RequestHandler;
  getSavedQueries: RequestHandler;
  analyzeQuery: RequestHandler;
  compareQueries: RequestHandler;
  getQueryHistory: RequestHandler;
  parseExplainResult: (explainResult: any) => QueryAnalysis;
  generateInsights: (analysis: Partial<QueryAnalysis>) => QueryInsights;
  storeQueryAnalysis: (
    userId: number,
    sqlQuery: string,
    analysis: QueryAnalysis
  ) => Promise<void>;
  analyzeQueryInternal: (
    sqlQuery: string,
    userId: number
  ) => Promise<QueryAnalysis>;
};

const userDatabaseController: userDatabaseController = {
  fetchUserMetrics: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { queryName, uri_string, query } = req.body;

    if (!queryName || !uri_string || !query) {
      console.log('Missing query name, uri string, or query.');
      res
        .status(400)
        .json({ message: 'query name, uri string and query is required.' });
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

      // formatted
      const result = await userDBPool.query(
        'EXPLAIN (ANALYZE true, COSTS true, SETTINGS true, BUFFERS true, WAL true, SUMMARY true, FORMAT JSON)' +
          `${query}`
      );

      // once done with pool we close connection to save resources.
      await userDBPool.end();

      // used to see full result of JSON
      // console.log(
      //   'EXPLAIN ANALYZE Result:',
      //   JSON.stringify(result.rows, null, 2)
      // );

      const queryPlan = result.rows[0]['QUERY PLAN'][0];

      if (!queryPlan) {
        monitoringController.recordQueryMetrics({
          error: 'No query plan retrieved',
        });
        res.status(500).json({ message: 'Could not retrieve plan data' });
        return;
      }

      // // Log the full result for inspection (debugging purposes)
      // console.log(
      //   'Settings Field:',
      //   JSON.stringify(queryPlan['Settings'], null, 2)
      // );

      // debugging
      // console.log('Query Plan:', JSON.stringify(queryPlan, null, 2));

      const sharedHitBlocks = queryPlan['Planning']?.['Shared Hit Blocks'] || 0;
      const sharedReadBlocks =
        queryPlan['Planning']?.['Shared Read Blocks'] || 0;
      const cacheHitRatio =
        sharedHitBlocks + sharedReadBlocks > 0
          ? (sharedHitBlocks / (sharedHitBlocks + sharedReadBlocks)) * 100
          : 0;

      const metrics = {
        executionTime: queryPlan['Execution Time'], // This is the execution time in milliseconds
        planningTime: queryPlan['Planning Time'], // This is the planning time in milliseconds
        rowsReturned: queryPlan['Plan']?.['Actual Rows'], // Rows actually returned
        actualLoops: queryPlan['Plan']?.['Actual Loops'], // # of loops in the plan
        sharedHitBlocks: queryPlan['Planning']?.['Shared Hit Blocks'],
        sharedReadBlocks: queryPlan['Planning']?.['Shared Read Blocks'],
        workMem: queryPlan['Settings']?.['work_mem'],
        cacheHitRatio: cacheHitRatio,
        startupCost: queryPlan['Plan']?.['Startup Cost'],
        totalCost: queryPlan['Plan']?.['Total Cost'],
      };

      //Record metrics with prometheus
      monitoringController.recordQueryMetrics({
        executionTime: metrics.executionTime,
        cacheHitRatio: metrics.cacheHitRatio,
      });

      // console.log('Query Metrics:', metrics);
      res.locals.queryMetrics = metrics;
      res.locals.queryName = queryName;
      res.locals.originalQuery = query;
      return next();
    } catch (err) {
      monitoringController.recordQueryMetrics({
        error: err instanceof Error ? err.message : 'Unknown query error',
      });
      console.error('Error running query', err);
      return next({
        log: 'Error in connectDB middleware',
        status: 500,
        message: { err: 'Failed to get query metrics from database.' },
      });
    }
  },

  // This method will save the metrics into the user's metrics table
  saveMetricsToDB: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { queryName, originalQuery, queryMetrics } = res.locals; // Get metrics from previous middleware
    const userId = res.locals.userId;

    if (!queryName || !queryMetrics || !userId || !originalQuery) {
      res.status(400).json({
        message: 'Query name, Metrics, userId, or query text are missing.',
      });
      return;
    }

    try {
      const queryResult = await appDbPool.query(
        'INSERT INTO queries (query_name, query_text, user_id, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id',
        [queryName, originalQuery, userId]
      );

      const queryId = queryResult.rows[0].id;
      // Save the metrics into the database
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
        ]
      );
      // returning queryMetrics to front end
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
  // create getSavedQueries method
  getSavedQueries: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = res.locals.userId;

      if (!userId) {
        res.status(400).json({ message: 'User ID is required' });
        return;
      }

      // Query to get all saved queries with their metrics for this user
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
        [userId]
      );

      // Transform results to match frontend expected format
      const savedQueries = queryResult.rows.map((row) => ({
        id: row.id,
        queryName: row.queryName,
        queryText: row.queryText,
        createdAt: row.createdAt,
        metrics: {
          executionTime: parseFloat(row.executionTime),
          planningTime: parseFloat(row.planningTime),
          rowsReturned: parseInt(row.rowsReturned),
          actualLoops: parseInt(row.actualLoops),
          sharedHitBlocks: parseInt(row.sharedHitBlocks),
          sharedReadBlocks: parseInt(row.sharedReadBlocks),
          workMem: parseInt(row.workMem) || 0,
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

  // Enhanced query analysis method with tracing
  analyzeQuery: async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    const { sqlQuery } = req.body;
    const userId = res.locals.userId;

    // Create main analysis span
    return tracer.startActiveSpan(
      'query.analyze',
      {
        kind: SpanKind.SERVER,
        attributes: {
          'user.id': userId,
          'query.length': sqlQuery?.length || 0,
          'query.hash': Buffer.from(sqlQuery || '').toString('base64').slice(0, 16),
          'service.name': 'queryhawk-query-analyzer',
        },
      },
      async (span) => {
        try {
          if (!sqlQuery) {
            span.setStatus({ code: SpanStatusCode.ERROR, message: 'Missing SQL query' });
            span.setAttribute('error.type', 'validation_error');
            res.status(400).json({ message: 'SQL query is required.' });
            return;
          }

          span.addEvent('query.analysis.started', {
            'query.type': sqlQuery.trim().split(' ')[0].toUpperCase(),
          });

          console.log('Analyzing query for user:', userId);

          // Get database connection with tracing
          const connectionSpan = tracer.startSpan('database.connection.resolve', {
            attributes: { 'user.id': userId },
          });

          try {
            const userQueryResult = await appDbPool.query(
              'SELECT uri_string FROM user_connections WHERE user_id = $1 LIMIT 1',
              [userId]
            );

            let uri_string = process.env.DEFAULT_DATABASE_URL;
            if (userQueryResult.rows.length > 0) {
              uri_string = userQueryResult.rows[0].uri_string;
            }

            connectionSpan.setAttributes({
              'database.connection.found': !!uri_string,
              'database.connection.source': userQueryResult.rows.length > 0 ? 'user' : 'default',
            });

            if (!uri_string) {
              connectionSpan.setStatus({ code: SpanStatusCode.ERROR, message: 'No database connection' });
              span.setStatus({ code: SpanStatusCode.ERROR, message: 'No database connection found' });
              res.status(400).json({ message: 'No database connection found for user.' });
              return;
            }

            connectionSpan.setStatus({ code: SpanStatusCode.OK });
          } finally {
            connectionSpan.end();
          }

          // Execute EXPLAIN ANALYZE with tracing
          const explainSpan = tracer.startSpan('query.explain.execute', {
            kind: SpanKind.CLIENT,
            attributes: {
              'db.system': 'postgresql',
              'db.operation': 'EXPLAIN ANALYZE',
              'db.statement': `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sqlQuery.slice(0, 100)}...`,
            },
          });

          const { Pool } = pg;
          const userDBPool = new Pool({
            connectionString: uri_string,
            ssl: { rejectUnauthorized: false },
          });

          const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sqlQuery}`;
          const startTime = Date.now();
          
          const result = await userDBPool.query(explainQuery);
          const explainDuration = Date.now() - startTime;

          await userDBPool.end();

          explainSpan.setAttributes({
            'db.explain.duration_ms': explainDuration,
            'db.explain.rows_returned': result.rows.length,
          });

          const queryPlan = result.rows[0]['QUERY PLAN'][0];
          if (!queryPlan) {
            explainSpan.setStatus({ code: SpanStatusCode.ERROR, message: 'No query plan retrieved' });
            span.setStatus({ code: SpanStatusCode.ERROR, message: 'Could not retrieve plan data' });
            res.status(500).json({ message: 'Could not retrieve plan data' });
            return;
          }

          explainSpan.addEvent('query.plan.retrieved', {
            'plan.execution_time': queryPlan['Execution Time'],
            'plan.planning_time': queryPlan['Planning Time'],
            'plan.total_cost': queryPlan['Plan']?.['Total Cost'],
          });

          explainSpan.setStatus({ code: SpanStatusCode.OK });
          explainSpan.end();

          // Parse and analyze results with tracing
          const analysisSpan = tracer.startSpan('query.analysis.parse', {
            attributes: { 'user.id': userId },
          });

          let analysis: QueryAnalysis;
          let insights: QueryInsights;

          try {
            analysis = userDatabaseController.parseExplainResult(queryPlan);
            insights = userDatabaseController.generateInsights(analysis);

            analysisSpan.setAttributes({
              'analysis.execution_time': analysis.executionTime,
              'analysis.cache_hit_ratio': analysis.cacheHitRatio,
              'analysis.total_cost': analysis.totalCost,
              'insights.is_slow': insights.isSlowQuery,
              'insights.is_bad_cache': insights.isBadCache,
              'insights.is_expensive': insights.isExpensive,
              'insights.recommendations_count': insights.recommendations.length,
            });

            analysisSpan.addEvent('analysis.completed', {
              'performance.rating': insights.isSlowQuery || insights.isBadCache || insights.isExpensive 
                ? 'needs_optimization' : 'good',
            });

            analysisSpan.setStatus({ code: SpanStatusCode.OK });
          } finally {
            analysisSpan.end();
          }

          // Store results with tracing
          const storageSpan = tracer.startSpan('query.analysis.store', {
            attributes: { 'user.id': userId },
          });

          try {
            await userDatabaseController.storeQueryAnalysis(userId, sqlQuery, analysis);
            storageSpan.setStatus({ code: SpanStatusCode.OK });
          } catch (error) {
            storageSpan.setStatus({ 
              code: SpanStatusCode.ERROR, 
              message: error instanceof Error ? error.message : 'Storage failed' 
            });
            // Don't fail the entire operation if storage fails
            console.warn('Failed to store query analysis:', error);
          } finally {
            storageSpan.end();
          }

          // Set overall span attributes based on analysis
          span.setAttributes({
            'query.analysis.execution_time': analysis.executionTime,
            'query.analysis.planning_time': analysis.planningTime,
            'query.analysis.cache_hit_ratio': analysis.cacheHitRatio,
            'query.analysis.total_cost': analysis.totalCost,
            'query.performance.is_slow': insights.isSlowQuery,
            'query.performance.is_bad_cache': insights.isBadCache,
            'query.performance.is_expensive': insights.isExpensive,
          });

          span.addEvent('query.analysis.completed', {
            'recommendations.count': insights.recommendations.length,
            'status': 'success',
          });

          span.setStatus({ code: SpanStatusCode.OK });
          res.json({ analysis, insights });

        } catch (error) {
          span.recordException(error as Error);
          span.setStatus({ 
            code: SpanStatusCode.ERROR, 
            message: error instanceof Error ? error.message : 'Unknown error' 
          });
          
          console.error('Query analysis failed:', error);
          res.status(500).json({
            error: error instanceof Error ? error.message : 'Query analysis failed',
          });
        } finally {
          span.end();
        }
      }
    );
  },

  // Enhanced parsing of EXPLAIN results
  parseExplainResult: (explainResult: any): QueryAnalysis => {
    const plan = explainResult['Plan'] || explainResult;
    const bufferHits = explainResult['Planning']?.['Shared Hit Blocks'] || 0;
    const bufferReads = explainResult['Planning']?.['Shared Read Blocks'] || 0;
    const cacheHitRatio =
      bufferHits + bufferReads > 0
        ? Math.round((bufferHits / (bufferHits + bufferReads)) * 100)
        : 0;

    return {
      executionTime: explainResult['Execution Time'] || 0,
      planningTime: explainResult['Planning Time'] || 0,
      totalCost: plan['Total Cost'] || 0,
      bufferHits,
      bufferReads,
      cacheHitRatio,
      insights: userDatabaseController.generateInsights({
        executionTime: explainResult['Execution Time'] || 0,
        totalCost: plan['Total Cost'] || 0,
        cacheHitRatio,
      }),
    };
  },

  // Generate performance insights
  generateInsights: (analysis: Partial<QueryAnalysis>): QueryInsights => {
    const isSlowQuery = (analysis.executionTime || 0) > 100;
    const isBadCache = (analysis.cacheHitRatio || 0) < 80;
    const isExpensive = (analysis.totalCost || 0) > 200;

    const recommendations: string[] = [];

    if (isSlowQuery) {
      recommendations.push(
        'Query execution time is slow - consider adding indexes'
      );
    }
    if (isBadCache) {
      recommendations.push('Low cache hit ratio indicates excessive disk I/O');
    }
    if (isExpensive) {
      recommendations.push(
        'High query cost suggests inefficient execution plan'
      );
    }
    if (!isSlowQuery && !isBadCache && !isExpensive) {
      recommendations.push('Query performance looks good!');
    }

    return {
      isSlowQuery,
      isBadCache,
      isExpensive,
      recommendations,
    };
  },

  // Store query analysis for comparison
  storeQueryAnalysis: async (
    userId: number,
    sqlQuery: string,
    analysis: QueryAnalysis
  ): Promise<void> => {
    try {
      const queryResult = await appDbPool.query(
        'INSERT INTO queries (query_name, query_text, user_id, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id',
        [`Analysis_${new Date().toISOString()}`, sqlQuery, userId]
      );

      const queryId = queryResult.rows[0].id;
      await appDbPool.query(
        `INSERT INTO metrics (
          execution_time, planning_time, total_cost, shared_hit_blocks, 
          shared_read_blocks, cache_hit_ratio, query_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          analysis.executionTime,
          analysis.planningTime,
          analysis.totalCost,
          analysis.bufferHits,
          analysis.bufferReads,
          analysis.cacheHitRatio,
          queryId,
        ]
      );
    } catch (error) {
      console.error('Failed to store query analysis:', error);
    }
  },

  // Compare two queries
  compareQueries: async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    const { query1, query2 } = req.body;
    const userId = res.locals.userId;

    if (!query1 || !query2) {
      res
        .status(400)
        .json({ message: 'Both queries are required for comparison.' });
      return;
    }

    try {
      // Analyze both queries
      const analysis1 = await userDatabaseController.analyzeQueryInternal(
        query1,
        userId
      );
      const analysis2 = await userDatabaseController.analyzeQueryInternal(
        query2,
        userId
      );

      const comparison = {
        before: analysis1,
        after: analysis2,
        improvements: {
          executionTime: (
            ((analysis1.executionTime - analysis2.executionTime) /
              analysis1.executionTime) *
            100
          ).toFixed(2),
          cacheHitRatio: (
            ((analysis2.cacheHitRatio - analysis1.cacheHitRatio) /
              analysis1.cacheHitRatio) *
            100
          ).toFixed(2),
          totalCost: (
            ((analysis1.totalCost - analysis2.totalCost) /
              analysis1.totalCost) *
            100
          ).toFixed(2),
        },
      };

      res.json(comparison);
    } catch (error) {
      console.error('Query comparison failed:', error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Query comparison failed',
      });
    }
  },

  // Internal method for query analysis
  analyzeQueryInternal: async (
    sqlQuery: string,
    userId: number
  ): Promise<QueryAnalysis> => {
    // Implementation similar to analyzeQuery but returns data instead of response
    // This is a simplified version for internal use
    const userQueryResult = await appDbPool.query(
      'SELECT uri_string FROM user_connections WHERE user_id = $1 LIMIT 1',
      [userId]
    );

    let uri_string = process.env.DEFAULT_DATABASE_URL;
    if (userQueryResult.rows.length > 0) {
      uri_string = userQueryResult.rows[0].uri_string;
    }

    const { Pool } = pg;
    const userDBPool = new Pool({
      connectionString: uri_string,
      ssl: { rejectUnauthorized: false },
    });

    const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sqlQuery}`;
    const result = await userDBPool.query(explainQuery);
    await userDBPool.end();

    const queryPlan = result.rows[0]['QUERY PLAN'][0];
    return userDatabaseController.parseExplainResult(queryPlan);
  },

  // Get query history for a specific query hash
  getQueryHistory: async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
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
        [userId, queryHash]
      );

      res.json(queryResult.rows);
    } catch (error) {
      console.error('Error fetching query history:', error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch query history',
      });
    }
  },
};

export default userDatabaseController;
