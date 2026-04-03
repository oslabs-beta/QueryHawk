import { NextFunction, Request, RequestHandler, Response } from 'express';
import { Client } from 'pg';
import Redis from 'ioredis';

type RedisController = {
  runRedisTest: RequestHandler;
};

const redisController: RedisController = {
  runRedisTest: async (req: Request, res: Response, next: NextFunction) => {
    const { uri_string, queryId } = req.body;
    const queryText = res.locals.originalQuery;

    // users database
    const client = new Client({
      connectionString: uri_string,
      ssl: {
        rejectUnauthorized: false, // Required for Supabase connections
      },
    });

    const redisClient = new Redis(`redis://redis:6379`);

    try {
      await client.connect();
      const result = await client.query(queryText);

      await client.end();

      // create key for cache
      const key = `query:${queryId}`;
      // use stringify since redis doesnt take objects
      await redisClient.set(key, JSON.stringify(result.rows));

      // measure retrieval time using performance.now()
      const start = performance.now();

      // retrieve value
      const value = await redisClient.get(key);

      const end = performance.now();

      const duration = end - start;

      if (value == null) {
        return next({
          log: `redisControler: runRedisTest: Value is null`,
          status: 500,
          message: {
            err: `Value from redisClient.get() is null`,
          },
        });
      }
      res.json({
        pgExecutionTime: res.locals.queryMetrics,
        redisRetrievalTime: duration,
      });
    } catch (err) {
      return next({
        log: `redisControler: runRedisTest: Unexpected error ${err instanceof Error ? err.message : 'Unknown error'} `,
        status: 500,
        message: {
          err: `Error has occured while executing stored query.`,
        },
      });
    } finally {
      redisClient.disconnect();
    }
  },
};

export default redisController;
