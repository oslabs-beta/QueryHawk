import { NextFunction, Request, RequestHandler, Response } from 'express';
import pg from 'pg';

// Creating a pool for our app database to save metrics.
const appDbPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

type userDatabaseController = {
  fetchUserMetrics: RequestHandler;
  saveMetricsToDB: RequestHandler;
};

const userDatabaseController: userDatabaseController = {
  fetchUserMetrics: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { uri_string, query } = req.body;

    if (!uri_string || !query) {
      console.log('Missing uri string or query.');
      res.status(400).json({ message: 'uri string and query is required.' });
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

      // console.log('Query Metrics:', metrics);
      res.locals.queryMetrics = metrics;
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

  // This method will save the metrics into the user's metrics table
  saveMetricsToDB: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    console.log('res.locals before check: ', res.locals);
    const { queryMetrics, originalQuery } = res.locals; // Get metrics from previous middleware
    const userId = res.locals.userId;

    if (!queryMetrics || !userId || !originalQuery) {
      res
        .status(400)
        .json({ message: 'Metrics, userId, or query text are missing.' });
      return;
    }

    try {
      const queryResult = await appDbPool.query(
        'INSERT INTO queries (query_text, user_id, created_at) VALUES ($1, $2, NOW()) RETURNING id',
        [originalQuery, userId]
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
};

export default userDatabaseController;
