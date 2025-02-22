import { NextFunction, Request, RequestHandler, Response } from 'express';
// import { ServerError } from '../../types/types.ts';
import pg from 'pg';
// need to import exporter
import { setDatabaseUriToPostgresExporter } from '../utils/dockerPostgresExporter';
type userDatabaseController = {
  getQueryMetrics: RequestHandler; // gets metrics for users query from their database.
  connectToPostgresExporter: RequestHandler;
  // disconnectFromPostgresExporter: RequestHandler;
};

const userDatabaseController: userDatabaseController = {
  getQueryMetrics: async (
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
      const pool = new Pool({
        connectionString: uri_string,
      });

      // const result = await pool.query(`EXPLAIN ANALYZE ${query}`);
      // formatted
      const result = await pool.query(
        'EXPLAIN (ANALYZE true, COSTS true, SETTINGS true, BUFFERS true, WAL true, SUMMARY true, FORMAT JSON)' +
          `${query}`
      );

      // used to see full result of JSON
      console.log(
        'EXPLAIN ANALYZE Result:',
        JSON.stringify(result.rows, null, 2)
      );

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
        // nodeType: queryPlan['Plan']?.['Node Type'],
        executionTime: queryPlan['Execution Time'], // This is the execution time in milliseconds
        planningTime: queryPlan['Planning Time'], // This is the planning time in milliseconds
        rowsReturned: queryPlan['Plan']?.['Actual Rows'], // Rows actually returned
        actualLoops: queryPlan['Plan']?.['Actual Loops'], // # of loops in the plan
        // actualTotalTime: queryPlan['Plan']?.['Actual Total Time'], // Time to actually execute
        sharedHitBlocks: queryPlan['Planning']?.['Shared Hit Blocks'],
        sharedReadBlocks: queryPlan['Planning']?.['Shared Read Blocks'],
        workMem: queryPlan['Settings']?.['work_mem'],
        cacheHitRatio: cacheHitRatio,
        startupCost: queryPlan['Plan']?.['Startup Cost'],
        totalCost: queryPlan['Plan']?.['Total Cost'],
      };

      console.log('Query Metrics:', metrics);
      res.locals.queryMetrics = metrics;
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

  // making a connection to postgres exporter with users URI
  connectToPostgresExporter: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId, uri_string } = req.body;

    if (!uri_string) {
      console.log('Missing uri string.');
      res.status(400).json({ message: 'uri string is required.' });
      return;
    }

    try {
      console.log('Setting URI for Postgres Exporter...');

      await setDatabaseUriToPostgresExporter({ userId, uri_string });
      // const exporterStatus = await setDatabaseUriToPostgresExporter(uri_string);

      // if (!exporterStatus) {
      //   res.status(500).json({ message: 'Failed to start Postgres Exporter' });
      //   return;
      // }
      // else connection to postgres exporter was sucessful
      console.log('Postgres Exporter started successfully!');
      res
        .status(200)
        .json({ message: 'Database URI set sucessfully in Postgres Exporter' });

      // return next();
    } catch (err) {
      console.error('Error setting URI to Postgres Exporter', err);
      res
        .status(500)
        .json({ message: 'Failed to set database URI to Postgres Exporter' });
    }
  },
};

export default userDatabaseController;
