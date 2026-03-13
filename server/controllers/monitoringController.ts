import { Request, Response } from 'express';
import pg from 'pg';
import { register, Gauge, Counter } from 'prom-client';
import { pool as appDbPool, closePool } from '../db/db';

// Consistent HTTP error responses for this controller
const sendErrorResponse = (
  res: Response,
  status: number,
  message: string,
  details?: string,
): void => {
  res.status(status).json({ error: message, message, details });
};

// Prometheus metrics
const dbConnectionGauge = new Gauge({
  name: 'pg_stat_database_numbackends',
  help: 'Number of active connections',
  labelNames: ['datname', 'user_id', 'instance'],
});

// Changed from Counter to Gauge since pg_stat_database values are absolute, not deltas
const dbConnectionCounter = new Gauge({
  name: 'pg_stat_database_xact_commit',
  help: 'Total number of transactions committed',
  labelNames: ['datname', 'user_id', 'instance'],
});

const dbTransactionRollback = new Gauge({
  name: 'pg_stat_database_xact_rollback',
  help: 'Total number of transactions rolled back',
  labelNames: ['datname', 'user_id', 'instance'],
});

const dbBlocksHit = new Gauge({
  name: 'pg_stat_database_blks_hit',
  help: 'Total number of disk blocks found in buffer cache',
  labelNames: ['datname', 'user_id', 'instance'],
});

const dbBlocksRead = new Gauge({
  name: 'pg_stat_database_blks_read',
  help: 'Total number of disk blocks read',
  labelNames: ['datname', 'user_id', 'instance'],
});

const dbTupReturned = new Gauge({
  name: 'pg_stat_database_tup_returned',
  help: 'Total number of rows returned by queries',
  labelNames: ['datname', 'user_id', 'instance'],
});

const dbTupFetched = new Gauge({
  name: 'pg_stat_database_tup_fetched',
  help: 'Total number of rows fetched by queries',
  labelNames: ['datname', 'user_id', 'instance'],
});

const dbTupInserted = new Gauge({
  name: 'pg_stat_database_tup_inserted',
  help: 'Total number of rows inserted by queries',
  labelNames: ['datname', 'user_id', 'instance'],
});

const dbTupUpdated = new Gauge({
  name: 'pg_stat_database_tup_updated',
  help: 'Total number of rows updated by queries',
  labelNames: ['datname', 'user_id', 'instance'],
});

const dbTupDeleted = new Gauge({
  name: 'pg_stat_database_tup_deleted',
  help: 'Total number of rows deleted by queries',
  labelNames: ['datname', 'user_id', 'instance'],
});

const dbCacheHitRatio = new Gauge({
  name: 'pg_stat_database_cache_hit_ratio',
  help: 'Cache hit ratio for the database',
  labelNames: ['datname', 'user_id', 'instance'],
});

// Lock metrics
const pgLocksCount = new Gauge({
  name: 'pg_locks_count',
  help: 'Number of locks by mode',
  labelNames: ['datname', 'user_id', 'instance', 'mode'],
});

// Index usage metrics
const pgStatUserTablesIdxScan = new Gauge({
  name: 'pg_stat_user_tables_idx_scan',
  help: 'Number of index scans on user tables',
  labelNames: ['datname', 'user_id', 'instance', 'relname'],
});

const pgStatUserTablesSeqScan = new Gauge({
  name: 'pg_stat_user_tables_seq_scan',
  help: 'Number of sequential scans on user tables',
  labelNames: ['datname', 'user_id', 'instance', 'relname'],
});

// Activity metrics
const pgStatActivityCount = new Gauge({
  name: 'pg_stat_activity_count',
  help: 'Count of connections by state',
  labelNames: ['datname', 'user_id', 'instance', 'state'],
});

// Query execution time metrics (histogram simulation using gauges for percentiles)
const pgStatStatementsExecTimeP95 = new Gauge({
  name: 'pg_stat_statements_exec_time_p95',
  help: '95th percentile of query execution time in seconds',
  labelNames: ['datname', 'user_id', 'instance'],
});

const pgStatStatementsExecTimeP50 = new Gauge({
  name: 'pg_stat_statements_exec_time_p50',
  help: '50th percentile of query execution time in seconds',
  labelNames: ['datname', 'user_id', 'instance'],
});

// User connection pools management (per-user pools for metrics collection)
const userConnectionPools: Map<string, pg.Pool> = new Map();
let multiUserCollectionInterval: NodeJS.Timeout | null = null;

// Collect metrics from a specific user's database
const collectUserDatabaseMetrics = async (
  pool: pg.Pool,
  userId: string,
  uriString: string,
) => {
  try {
    // Extract hostname and port from URI for instance label
    const url = new URL(uriString);
    const instance = `${url.hostname}:${url.port}`;

    // Get database name
    const dbNameResult = await pool.query(
      'SELECT current_database() as datname',
    );
    const datname = dbNameResult.rows[0]?.datname || 'unknown';

    // Helper to safely set/inc metrics
    const safeSet = (metric, labels, value) => {
      const numValue = Number(value);
      if (Number.isFinite(numValue)) {
        metric.labels(labels).set(numValue);
      } else {
        console.warn(`Skipping metric set: invalid value for`, labels, value);
      }
    };
    const safeInc = (metric, labels, value) => {
      // pg_stat_database values are absolute totals, use set() not inc()
      const numValue = Number(value);
      if (Number.isFinite(numValue)) {
        metric.labels(labels).set(numValue);
      }
    };

    // Get pg_stat_database stats
    const statsResult = await pool.query(
      `
      SELECT 
        numbackends,
        xact_commit,
        xact_rollback,
        blks_hit,
        blks_read,
        tup_returned,
        tup_fetched,
        tup_inserted,
        tup_updated,
        tup_deleted
      FROM pg_stat_database 
      WHERE datname = $1
    `,
      [datname],
    );

    if (statsResult.rows.length > 0) {
      const stats = statsResult.rows[0];

      safeSet(
        dbConnectionGauge,
        { datname, user_id: userId, instance },
        stats.numbackends,
      );
      safeInc(
        dbConnectionCounter,
        { datname, user_id: userId, instance },
        stats.xact_commit,
      );
      safeInc(
        dbTransactionRollback,
        { datname, user_id: userId, instance },
        stats.xact_rollback,
      );
      safeInc(
        dbBlocksHit,
        { datname, user_id: userId, instance },
        stats.blks_hit,
      );
      safeInc(
        dbBlocksRead,
        { datname, user_id: userId, instance },
        stats.blks_read,
      );
      safeInc(
        dbTupReturned,
        { datname, user_id: userId, instance },
        stats.tup_returned,
      );
      safeInc(
        dbTupFetched,
        { datname, user_id: userId, instance },
        stats.tup_fetched,
      );
      safeInc(
        dbTupInserted,
        { datname, user_id: userId, instance },
        stats.tup_inserted,
      );
      safeInc(
        dbTupUpdated,
        { datname, user_id: userId, instance },
        stats.tup_updated,
      );
      safeInc(
        dbTupDeleted,
        { datname, user_id: userId, instance },
        stats.tup_deleted,
      );

      // Calculate cache hit ratio
      const totalBlocks = stats.blks_hit + stats.blks_read;
      const cacheHitRatio =
        totalBlocks > 0 ? (stats.blks_hit / totalBlocks) * 100 : 0;
      safeSet(
        dbCacheHitRatio,
        { datname, user_id: userId, instance },
        cacheHitRatio,
      );
    }

    // Collect lock metrics
    try {
      const locksResult = await pool.query(
        `
        SELECT mode, count(*) as count
        FROM pg_locks
        GROUP BY mode
      `,
      );

      // Reset all lock metrics for this database
      for (const mode of [
        'accessexclusivelock',
        'exclusivelock',
        'sharelock',
        'accesssharelock',
      ]) {
        pgLocksCount.labels(datname, userId, instance, mode).set(0);
      }

      // Set lock counts
      for (const lock of locksResult.rows) {
        const mode = lock.mode.toLowerCase();
        safeSet(
          pgLocksCount,
          { datname, user_id: userId, instance, mode },
          lock.count,
        );
      }
    } catch (error) {
      console.warn(`Could not collect lock metrics for user ${userId}:`, error);
    }

    // Collect index usage metrics
    try {
      const indexResult = await pool.query(
        `
        SELECT 
          relname,
          idx_scan,
          seq_scan
        FROM pg_stat_user_tables
      `,
      );

      for (const table of indexResult.rows) {
        safeSet(
          pgStatUserTablesIdxScan,
          { datname, user_id: userId, instance, relname: table.relname },
          table.idx_scan,
        );
        safeSet(
          pgStatUserTablesSeqScan,
          { datname, user_id: userId, instance, relname: table.relname },
          table.seq_scan,
        );
      }
    } catch (error) {
      console.warn(
        `Could not collect index metrics for user ${userId}:`,
        error,
      );
    }

    // Collect activity metrics
    try {
      const activityResult = await pool.query(
        `
        SELECT state, count(*) as count
        FROM pg_stat_activity
        WHERE datname = $1
        GROUP BY state
      `,
        [datname],
      );

      // Reset activity metrics
      for (const state of [
        'active',
        'idle',
        'idle in transaction',
        'fastpath function call',
        'disabled',
      ]) {
        pgStatActivityCount.labels(datname, userId, instance, state).set(0);
      }

      // Set activity counts
      for (const activity of activityResult.rows) {
        const state = activity.state || 'idle';
        safeSet(
          pgStatActivityCount,
          { datname, user_id: userId, instance, state },
          activity.count,
        );
      }
    } catch (error) {
      console.warn(
        `Could not collect activity metrics for user ${userId}:`,
        error,
      );
    }
  } catch (error) {
    console.error(`Error collecting metrics for user ${userId}:`, error);
  }
};

// Set metrics to error state for failed user databases
const setUserMetricsToError = (userId: string, uriString: string) => {
  try {
    const url = new URL(uriString);
    const instance = `${url.hostname}:${url.port}`;
    const datname = 'unknown';

    // Set connection status to 0 (failed)
    dbConnectionGauge.set({ datname, user_id: userId, instance }, 0);
  } catch (error) {
    console.error(`Error setting error metrics for user ${userId}:`, error);
  }
};

// Collect metrics from all user databases
const collectAllUserMetrics = async () => {
  try {
    // Get all active user connections
    const result = await appDbPool.query(`
      SELECT user_id, uri_string 
      FROM user_connections 
      WHERE is_active = true
    `);

    // Create/update connection pools for each user
    for (const row of result.rows) {
      const { user_id, uri_string } = row;
      const userId = user_id.toString();

      // Create new pool if it doesn't exist
      if (!userConnectionPools.has(userId)) {
        try {
          const newPool = new pg.Pool({
            connectionString: uri_string,
            ssl: {
              rejectUnauthorized: false,
            },
          });
          userConnectionPools.set(userId, newPool);
        } catch (error) {
          console.error(`Error creating pool for user ${userId}:`, error);
          setUserMetricsToError(userId, uri_string);
          continue;
        }
      }

      const pool = userConnectionPools.get(userId);
      if (pool) {
        await collectUserDatabaseMetrics(pool, userId, uri_string);
      }
    }
  } catch (error) {
    console.error('Error collecting all user metrics:', error);
  }
};

// Start multi-user metrics collection on a fixed interval
const startMultiUserMetricsCollection = () => {
  if (multiUserCollectionInterval) {
    return; // Already running
  }

  multiUserCollectionInterval = setInterval(async () => {
    await collectAllUserMetrics();
  }, 15000); // 15 seconds interval

  console.log('Multi-user metrics collection started with 15s interval');
};

// Cleanup function
const cleanup = async () => {
  // Close all user connection pools
  for (const [userId, pool] of userConnectionPools) {
    try {
      await pool.end();
      console.log(`Closed connection pool for user ${userId}`);
    } catch (error) {
      console.error(`Error closing pool for user ${userId}:`, error);
    }
  }
  userConnectionPools.clear();

  // Close app database pool
  try {
    await closePool();
    console.log('Closed app database pool');
  } catch (error) {
    console.error('Error closing app database pool:', error);
  }

  // Clear interval
  if (multiUserCollectionInterval) {
    clearInterval(multiUserCollectionInterval);
    multiUserCollectionInterval = null;
  }
};

// Setup monitoring for a new user connection
const setupMonitoring = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, databaseUrl } = req.body;

    if (!userId || !databaseUrl) {
      sendErrorResponse(res, 400, 'userId and databaseUrl are required');
      return;
    }

    // Test the user's database connection
    let testPool: pg.Pool | null = null;
    try {
      testPool = new pg.Pool({
        connectionString: databaseUrl,
        ssl: {
          rejectUnauthorized: false,
        },
      });

      // Test connection
      await testPool.query('SELECT 1');
      await testPool.end();

      // Store/update user connection in database
      await appDbPool.query(
        `
        INSERT INTO user_connections (user_id, uri_string, is_active) 
        VALUES ($1, $2, true)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          uri_string = $2, 
          is_active = true, 
          updated_at = NOW()
      `,
        [userId, databaseUrl],
      );

      // Start multi-user collection if not already running
      startMultiUserMetricsCollection();

      // Collect metrics for this user immediately
      const userPool = new pg.Pool({
        connectionString: databaseUrl,
        ssl: {
          rejectUnauthorized: false,
        },
      });
      userConnectionPools.set(userId.toString(), userPool);
      await collectUserDatabaseMetrics(
        userPool,
        userId.toString(),
        databaseUrl,
      );

      res.json({
        success: true,
        message: 'Database connection established and monitoring started',
      });
    } catch (error) {
      if (testPool) {
        await testPool.end();
      }

      // Store failed connection attempt
      await appDbPool.query(
        `
        INSERT INTO user_connections (user_id, uri_string, is_active) 
        VALUES ($1, $2, false)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          uri_string = $2, 
          is_active = false, 
          updated_at = NOW()
      `,
        [userId, databaseUrl],
      );

      console.error('Database connection test failed:', error);
      sendErrorResponse(
        res,
        500,
        'Failed to connect to database',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  } catch (error) {
    console.error('Error in setupMonitoring:', error);
    sendErrorResponse(
      res,
      500,
      'Internal server error',
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
};

// Get metrics endpoint
const getMetrics = async (req: Request, res: Response) => {
  try {
    // Collect fresh metrics from all users before serving
    await collectAllUserMetrics();

    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    console.error('Error getting metrics:', error);
    sendErrorResponse(
      res,
      500,
      'Failed to get metrics',
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
};

// Initialize function
const initialize = () => {
  startMultiUserMetricsCollection();
};

// Initialize on load
initialize();

export { setupMonitoring, getMetrics, cleanup };
