import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const poolQuery = vi.fn();
const poolEnd = vi.fn();
const poolOn = vi.fn();

const poolCtor = vi.fn().mockImplementation(() => ({
  query: poolQuery,
  end: poolEnd,
  on: poolOn,
}));

vi.mock('pg', () => ({
  default: { Pool: poolCtor },
  Pool: poolCtor,
}));

describe('db pool', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    poolQuery.mockReset();
    poolEnd.mockReset();
    poolOn.mockReset();
    poolCtor.mockClear();
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
    delete process.env.DATABASE_SSL;
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('creates a shared pool with safe defaults', async () => {
    await import('../db/db');

    expect(poolCtor).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionString: 'postgres://user:pass@localhost:5432/db',
        max: 10,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 2000,
      }),
    );
    expect(poolOn).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('enables SSL in production or when DATABASE_SSL=true', async () => {
    process.env.NODE_ENV = 'production';
    await import('../db/db');

    expect(poolCtor).toHaveBeenCalledWith(
      expect.objectContaining({
        ssl: { rejectUnauthorized: false },
      }),
    );
  });

  it('query helper delegates to pool.query', async () => {
    const db = await import('../db/db');

    await db.query('SELECT 1', [1]);

    expect(poolQuery).toHaveBeenCalledWith('SELECT 1', [1]);
  });

  it('closePool delegates to pool.end', async () => {
    const db = await import('../db/db');

    await db.closePool();

    expect(poolEnd).toHaveBeenCalled();
  });
});
