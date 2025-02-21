import { NextFunction, Request, Response } from "express";
import pkg from 'pg';
const { Pool } = pkg;
import promClient from 'prom-client';

const register = new promClient.Registry();

// Basic connection metrics
const dbConnectionGauge = new promClient.Gauge({
  name: 'database_connection_status',
  help: 'Current database connection status (1 for connected, 0 for disconnected)',
  labelNames: ['database_name']
});

const dbConnectionCounter = new promClient.Counter({
  name: 'database_connection_attempts_total',
  help: 'Total number of database connection attempts',
  labelNames: ['status']
});

// Database performance metrics
const dbTransactionRate = new promClient.Gauge({
  name: 'database_transaction_rate',
  help: 'Number of transactions per second',
  labelNames: ['database_name']
});

const dbCacheHitRatio = new promClient.Gauge({
  name: 'database_cache_hit_ratio',
  help: 'Cache hit ratio percentage',
  labelNames: ['database_name']
});

const dbActiveConnections = new promClient.Gauge({
  name: 'database_active_connections',
  help: 'Number of active database connections',
  labelNames: ['database_name']
});

register.registerMetric(dbConnectionGauge);
register.registerMetric(dbConnectionCounter);
register.registerMetric(dbTransactionRate);
register.registerMetric(dbCacheHitRatio);
register.registerMetric(dbActiveConnections);

let currentDatabaseUrl: string = "";
let pool: pkg.Pool | null = null;
let metricsInterval: NodeJS.Timeout | null = null;

async function collectMetrics(pool: pkg.Pool, databaseUrl: string) {
  try {
    const client = await pool.connect();
    try {
      // Get transaction rate
      const txnResult = await client.query(`
        SELECT xact_commit + xact_rollback AS total_transactions
        FROM pg_stat_database
        WHERE datname = current_database();
      `);
      dbTransactionRate.set({ database_name: databaseUrl }, 
        txnResult.rows[0].total_transactions);

      // Get cache hit ratio
      const cacheResult = await client.query(`
        SELECT 
          CASE WHEN sum(heap_blks_hit) + sum(heap_blks_read) = 0 
            THEN 0 
            ELSE sum(heap_blks_hit) * 100.0 / (sum(heap_blks_hit) + sum(heap_blks_read)) 
          END as ratio
        FROM pg_statio_user_tables;
      `);
      dbCacheHitRatio.set({ database_name: databaseUrl }, 
        cacheResult.rows[0].ratio || 0);

      // Get active connections
      const connectionsResult = await client.query(`
        SELECT count(*) as count
        FROM pg_stat_activity
        WHERE state = 'active';
      `);
      dbActiveConnections.set({ database_name: databaseUrl }, 
        connectionsResult.rows[0].count);

    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error collecting metrics:', err);
  }
}

const monitoringController = {
  setupMonitoring: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { databaseUrl } = req.body;
    console.log("Attempting to connect to database...");

    if (!databaseUrl) {
      dbConnectionCounter.inc({ status: 'failed_missing_url' });
      res.status(400).json({ message: "Database URI string is required." });
      return;
    }

    try {
      // Clean up existing connection and metrics collection
      if (metricsInterval) {
        clearInterval(metricsInterval);
        metricsInterval = null;
      }
      if (pool) {
        await pool.end();
        dbConnectionGauge.set({ database_name: currentDatabaseUrl }, 0);
      }

      // Create connection configuration
      const config = {
        connectionString: databaseUrl,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        ssl: {
          rejectUnauthorized: false
        }
      };

      console.log("Connecting with config:", {
        ...config,
        connectionString: config.connectionString.replace(/:[^:@]+@/, ':****@')
      });

      // Create new connection pool
      pool = new Pool(config);

      // Test connection
      console.log("Testing connection...");
      const client = await pool.connect();
      
      try {
        // Test with a simple query
        const result = await client.query('SELECT version()');
        console.log("Database version:", result.rows[0].version);
        currentDatabaseUrl = databaseUrl;
        
        // Update metrics
        dbConnectionCounter.inc({ status: 'success' });
        dbConnectionGauge.set({ database_name: databaseUrl }, 1);
        
        // Start collecting metrics periodically
        metricsInterval = setInterval(() => {
          if (pool) {
            collectMetrics(pool, databaseUrl).catch(err => {
              console.error('Error in metrics collection interval:', err);
            });
          }
        }, 15000); // Collect metrics every 15 seconds

        // Collect metrics immediately
        await collectMetrics(pool, databaseUrl);
        
        console.log("Connection successful");
        res.status(200).json({ 
          success: true, 
          message: 'Database monitoring connection updated successfully',
          url: currentDatabaseUrl 
        });
      } finally {
        client.release();
      }

    } catch (err) {
      console.error('Detailed connection error:', err);
      
      dbConnectionCounter.inc({ status: 'failed' });
      if (databaseUrl) {
        dbConnectionGauge.set({ database_name: databaseUrl }, 0);
      }

      let errorMessage = 'Failed to set up database monitoring.';
      if (err instanceof Error) {
        console.log('Error type:', err.constructor.name);
        console.log('Full error:', err);
        
        if (err.message.includes('SASL')) {
          errorMessage = 'Authentication failed. Please ensure the connection string is in the format: postgresql://user:password@host:5432/database';
        } else if (err.message.includes('self-signed certificate')) {
          errorMessage = 'SSL certificate validation failed.';
        } else if (err.message.includes('connect ECONNREFUSED')) {
          errorMessage = 'Could not connect to database. Please check if the database is running and accessible.';
        }
      }

      return next({
        log: 'Error in setupMonitoring middleware',
        status: 500,
        message: { err: errorMessage },
      });
    }
  },

  getMetrics: async (
    _req: Request,
    res: Response
  ): Promise<void> => {
    try {
      res.set('Content-Type', register.contentType);
      const metrics = await register.metrics();
      res.send(metrics);
    } catch (err) {
      console.error('Error collecting metrics:', err);
      res.status(500).send('Error collecting metrics');
    }
  }
};

export { register };
export default monitoringController;