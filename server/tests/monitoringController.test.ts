import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response } from 'express';

const poolInstances: Array<{
  query: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
}> = [];
type PoolBehavior =
  | { type: 'resolve'; value?: { rows?: unknown[] } | unknown }
  | { type: 'reject'; value?: unknown };

const poolBehaviorQueue: PoolBehavior[] = [];

vi.mock('pg', () => {
  class Pool {
    query = vi.fn();
    end = vi.fn();

    constructor() {
      const behavior = poolBehaviorQueue.shift();
      if (behavior?.type === 'reject') {
        this.query.mockRejectedValue(behavior.value ?? new Error('db error'));
      } else if (behavior?.type === 'resolve') {
        this.query.mockResolvedValue(behavior.value ?? { rows: [] });
      }
      poolInstances.push(this);
    }
  }

  return { default: { Pool }, Pool, __poolInstances: poolInstances };
});

vi.mock('prom-client', () => {
  class Counter {
    inc = vi.fn();
    constructor() {}
  }
  class Gauge {
    set = vi.fn();
    constructor() {}
  }
  const register = {
    contentType: 'text/plain',
    metrics: vi.fn().mockResolvedValue('metrics'),
  };

  return { Counter, Gauge, register };
});

const createRes = (): Response => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
  } as unknown as Response;

  return res;
};

describe('monitoringController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    poolInstances.length = 0;
    poolBehaviorQueue.length = 0;
    process.env.DATABASE_URL = 'postgres://test';
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('returns 400 when required fields are missing', async () => {
    const { setupMonitoring } =
      await import('../controllers/monitoringController');
    const req = { body: {} } as Request;
    const res = createRes();

    await setupMonitoring(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'userId and databaseUrl are required',
        message: 'userId and databaseUrl are required',
      }),
    );
  });

  it('returns 500 when database connection test fails', async () => {
    poolBehaviorQueue.push({ type: 'resolve', value: { rows: [] } });
    poolBehaviorQueue.push({ type: 'reject', value: new Error('db down') });

    const { setupMonitoring } =
      await import('../controllers/monitoringController');
    const req = {
      body: { userId: '42', databaseUrl: 'postgres://user:pass@host/db' },
    } as Request;
    const res = createRes();

    await setupMonitoring(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Failed to connect to database',
        message: 'Failed to connect to database',
      }),
    );
  });

  it('returns 500 when metrics collection fails', async () => {
    const { getMetrics } = await import('../controllers/monitoringController');
    const { register } = await import('prom-client');
    (register.metrics as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('metrics failure'),
    );

    const req = {} as Request;
    const res = createRes();

    await getMetrics(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Failed to get metrics',
        message: 'Failed to get metrics',
      }),
    );
  });
});
