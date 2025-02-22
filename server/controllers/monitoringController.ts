import { NextFunction, Request, Response } from "express";
import pkg from "pg";
const { Pool } = pkg;
import promClient from "prom-client";

const register = new promClient.Registry();

// Basic connection metrics
const dbConnectionGauge = new promClient.Gauge({
    name: "atabase_connection_status",
    help: "Current database connection status (1 for connected, 0 for disconnected)",
    labelNames: ["datname"],  // Changed to match postgres_exporter
  });
  
  const dbConnectionCounter = new promClient.Counter({
    name: "database_connection_attempts_total",
    help: "Total number of database connection attempts",
    labelNames: ["status"],  // This one is fine as is - it's not a postgres metric
  });
  
  // Database performance metrics
  const dbTransactionRate = new promClient.Gauge({
    name: "pg_stat_database_xact_commit",
    help: "Number of transactions per second",
    labelNames: ["datname"],  // Changed to match postgres_exporter
  });
  
  const dbCacheHitRatio = new promClient.Gauge({
    name: "pg_stat_database_blks_hit",
    help: "Number of blocks hit in cache",
    labelNames: ["datname"],  // Already correct
  });
  
  const dbActiveConnections = new promClient.Gauge({
    name: "database_active_connections",
    help: "Number of active database connections",
    labelNames: ["datname"],  // Changed to match postgres_exporter
  });
  
  const dbBlocksRead = new promClient.Gauge({
    name: "pg_stat_database_blks_read",
    help: "Number of blocks read from disk",
    labelNames: ["datname"],
  });

// Register all metrics
register.registerMetric(dbConnectionGauge);
register.registerMetric(dbConnectionCounter);
register.registerMetric(dbTransactionRate);
register.registerMetric(dbCacheHitRatio);
register.registerMetric(dbActiveConnections);
register.registerMetric(dbBlocksRead);

let currentDatabaseUrl: string = "";
let pool: pkg.Pool | null = null;
let metricsInterval: NodeJS.Timeout | null = null;

async function collectMetrics(pool: pkg.Pool, databaseUrl: string) {
  try {
    const client = await pool.connect();
    try {
      // Get current database name
      const dbNameResult = await client.query('SELECT current_database() as dbname');
      const dbName = dbNameResult.rows[0]?.dbname || 'postgres';

      // Get transaction rate
      const txnResult = await client.query(`
        SELECT xact_commit + xact_rollback AS total_transactions
        FROM pg_stat_database
        WHERE datname = current_database();
      `);
      const transactionCount = parseFloat(txnResult.rows[0]?.total_transactions);
      if (!isNaN(transactionCount)) {
        dbTransactionRate.set({ datname: dbName }, transactionCount);
      }

      // Get cache hit ratio
      const cacheResult = await client.query(`
        SELECT 
          sum(heap_blks_hit) as blocks_hit,
          sum(heap_blks_read) as blocks_read
        FROM pg_statio_user_tables;
      `);
      const blocksHit = parseFloat(cacheResult.rows[0]?.blocks_hit);
      const blocksRead = parseFloat(cacheResult.rows[0]?.blocks_read);
      
      if (!isNaN(blocksHit)) {
        dbCacheHitRatio.set({ datname: dbName }, blocksHit);
      }
      if (!isNaN(blocksRead)) {
        dbBlocksRead.set({ datname: dbName }, blocksRead);
      }

      // Get active connections
      const connectionsResult = await client.query(`
        SELECT count(*)::integer as count
        FROM pg_stat_activity
        WHERE state = 'active';
      `);
      const activeConnections = parseInt(connectionsResult.rows[0]?.count);
      if (!isNaN(activeConnections)) {
        dbActiveConnections.set({ datname: dbName }, activeConnections);
      }
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error collecting metrics:", err);
    dbConnectionGauge.set({ datname: 'postgres' }, 0);
  }
}

async function cleanup() {
    if (metricsInterval) {
      clearInterval(metricsInterval);
      metricsInterval = null;
    }
    if (pool) {
      await pool.end();
      dbConnectionGauge.set({ datname: 'postgres' }, 0);
    }
  }

function setupMetricsCollection(databaseUrl: string) {
  metricsInterval = setInterval(() => {
    if (pool) {
      collectMetrics(pool, databaseUrl).catch((err) => {
        console.error("Error in metrics collection interval:", err);
      });
    }
  }, 15000);
}

function getErrorMessage(err: Error): string {
  if (err.message.includes("SASL")) {
    return "Authentication failed. Please check your credentials.";
  }
  if (err.message.includes("self-signed certificate")) {
    return "SSL certificate validation failed. Try adding ?sslmode=require to your connection string.";
  }
  if (err.message.includes("connect ECONNREFUSED")) {
    return "Could not connect to database. Please check if the database is running and accessible.";
  }
  if (err.message.includes("Connection timeout")) {
    return "Connection timed out. Please check your database URL and network connection.";
  }
  return err.message;
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
      dbConnectionCounter.inc({ status: "failed_missing_url" });
      res.status(400).json({ message: "Database URI string is required." });
      return;
    }

    // Validate URL format
    try {
      new URL(databaseUrl);
    } catch (err) {
      dbConnectionCounter.inc({ status: "failed_invalid_url" });
      res.status(400).json({ message: "Invalid database URL format." });
      return;
    }

    try {
      // Clean up existing resources
      await cleanup();

      // Create connection configuration
      const config = {
        connectionString: databaseUrl,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        ssl: { rejectUnauthorized: false },
      };

      console.log("Connecting with config:", {
        ...config,
        connectionString: config.connectionString.replace(/:[^:@]+@/, ":****@"),
      });

      // Create new connection pool
      pool = new Pool(config);

      // Test connection with timeout
      const connectionTest = await Promise.race([
        pool.connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Connection timeout")), 10000)
        ),
      ]);

      const client = connectionTest as pkg.PoolClient;

      try {
        const result = await client.query("SELECT version()");
        console.log("Database version:", result.rows[0].version);
        currentDatabaseUrl = databaseUrl;

        // Update metrics
        dbConnectionCounter.inc({ status: "success" });
        dbConnectionGauge.set({ datname: 'postgres' }, 1);

        // Setup metrics collection
        setupMetricsCollection(databaseUrl);

        // Collect metrics immediately
        await collectMetrics(pool, databaseUrl);

        res.status(200).json({
          success: true,
          message: "Database monitoring connection established successfully",
          url: databaseUrl.replace(/:[^:@]+@/, ":****@"),
        });
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("Detailed connection error:", err);
      dbConnectionCounter.inc({ status: "failed" });
      if (databaseUrl) {
        dbConnectionGauge.set({ datname: 'postgres' }, 0);
      }

      let errorMessage = "Failed to set up database monitoring.";
      if (err instanceof Error) {
        errorMessage = getErrorMessage(err);
      }

      return next({
        log: "Error in setupMonitoring middleware",
        status: 500,
        message: { err: errorMessage },
      });
    }
  },

  // Modified getMetrics endpoint
  getMetrics: async (_req: Request, res: Response): Promise<void> => {
    try {
      // Set correct content type for Prometheus
      res.set("Content-Type", "text/plain; version=0.0.4");

      const metrics = await register.metrics(); // Get metrics from the registry
      res.end(metrics);
    } catch (err) {
      console.error("Error collecting metrics:", err);
      res.status(500).send("Error collecting metrics");
    }
  },
};

export { register };
export default monitoringController;