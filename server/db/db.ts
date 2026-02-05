import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Shared pool for all internal queries to avoid connection storms under load.
// Defaults are conservative for development and can be tuned via env vars.
const shouldUseSsl =
  process.env.DATABASE_SSL === 'true' || process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX || 10),
  idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_MS || 10000),
  connectionTimeoutMillis: Number(process.env.DB_POOL_CONN_TIMEOUT_MS || 2000),
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (error) => {
  console.error('Unexpected idle client error', error);
});

const query = (text: string, params?: unknown[]) => pool.query(text, params);

const closePool = () => pool.end();

export { pool, query, closePool };
