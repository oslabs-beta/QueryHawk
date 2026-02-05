import { Request, Response } from 'express';
import pg from 'pg';
import { register, Gauge, Counter } from 'prom-client';

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

const dbConnectionCounter = new Counter({
  name: 'pg_stat_database_xact_commit_total',
  help: 'Total number of transactions committed',
  labelNames: ['datname', 'user_id', 'instance'],
});

const dbTransactionRollback = new Counter({
  name: 'pg_stat_database_xact_rollback_total',
  help: 'Total number of transactions rolled back',
  labelNames: ['datname', 'user_id', 'instance'],
});

const dbBlocksHit = new Counter({
  name: 'pg_stat_database_blks_hit_total',
  help: 'Total number of disk blocks found in buffer cache',
  labelNames: ['datname', 'user_id', 'instance'],
});

const dbBlocksRead = new Counter({
  name: 'pg_stat_database_blks_read_total',
  help: 'Total number of disk blocks read',
  labelNames: ['datname', 'user_id', 'instance'],
});

const dbTupReturned = new Counter({
  name: 'pg_stat_database_tup_returned_total',
  help: 'Total number of rows returned by queries',
  labelNames: ['datname', 'user_id', 'instance'],
});

const dbTupFetched = new Counter({
  name: 'pg_stat_database_tup_fetched_total',
  help: 'Total number of rows fetched by queries',
  labelNames: ['datname', 'user_id', 'instance'],
});

const dbTupInserted = new Counter({
  name: 'pg_stat_database_tup_inserted_total',
  help: 'Total number of rows inserted by queries',
  labelNames: ['datname', 'user_id', 'instance'],
});

const dbTupUpdated = new Counter({
  name: 'pg_stat_database_tup_updated_total',
  help: 'Total number of rows updated by queries',
  labelNames: ['datname', 'user_id', 'instance'],
});

const dbTupDeleted = new Counter({
  name: 'pg_stat_database_tup_deleted_total',
  help: 'Total number of rows deleted by queries',
  labelNames: ['datname', 'user_id', 'instance'],
});

const dbCacheHitRatio = new Gauge({
  name: 'pg_stat_database_cache_hit_ratio',
  help: 'Cache hit ratio for the database',
  labelNames: ['datname', 'user_id', 'instance'],
});

// User connection pools management (per-user pools for metrics collection)
const userConnectionPools: Map<string, pg.Pool> = new Map();
let appDbPool: pg.Pool | null = null;
let multiUserCollectionInterval: NodeJS.Timeout | null = null;

// Initialize QueryHawk's internal database pool
const initializeAppDbPool = () => {
  if (!appDbPool) {
    appDbPool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }
};

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

      // Set metrics with user-specific labels
      dbConnectionGauge.set(
        { datname, user_id: userId, instance },
        stats.numbackends,
      );
      dbConnectionCounter.inc(
        { datname, user_id: userId, instance },
        stats.xact_commit,
      );
      dbTransactionRollback.inc(
        { datname, user_id: userId, instance },
        stats.xact_rollback,
      );
      dbBlocksHit.inc({ datname, user_id: userId, instance }, stats.blks_hit);
      dbBlocksRead.inc({ datname, user_id: userId, instance }, stats.blks_read);
      dbTupReturned.inc(
        { datname, user_id: userId, instance },
        stats.tup_returned,
      );
      dbTupFetched.inc(
        { datname, user_id: userId, instance },
        stats.tup_fetched,
      );
      dbTupInserted.inc(
        { datname, user_id: userId, instance },
        stats.tup_inserted,
      );
      dbTupUpdated.inc(
        { datname, user_id: userId, instance },
        stats.tup_updated,
      );
      dbTupDeleted.inc(
        { datname, user_id: userId, instance },
        stats.tup_deleted,
      );

      // Calculate cache hit ratio
      const totalBlocks = stats.blks_hit + stats.blks_read;
      const cacheHitRatio =
        totalBlocks > 0 ? (stats.blks_hit / totalBlocks) * 100 : 0;
      dbCacheHitRatio.set(
        { datname, user_id: userId, instance },
        cacheHitRatio,
      );
    }

    // Set connection status to 1 (successful)
    dbConnectionGauge.set({ datname, user_id: userId, instance }, 1);
  } catch (error) {
    console.error(`Error collecting metrics for user ${userId}:`, error);
    setUserMetricsToError(userId, uriString);
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
  if (!appDbPool) {
    console.log('App database pool not initialized');
    return;
  }

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
  if (appDbPool) {
    try {
      await appDbPool.end();
      console.log('Closed app database pool');
    } catch (error) {
      console.error('Error closing app database pool:', error);
    }
    appDbPool = null;
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

    // Initialize app database pool if not already done
    initializeAppDbPool();

    if (!appDbPool) {
      sendErrorResponse(
        res,
        500,
        'Failed to initialize app database connection',
      );
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
  initializeAppDbPool();
  startMultiUserMetricsCollection();
};

// Initialize on load
initialize();

export { setupMonitoring, getMetrics, cleanup };
