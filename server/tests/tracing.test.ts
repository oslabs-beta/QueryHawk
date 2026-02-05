import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

const sdkStart = vi.fn();
const sdkShutdown = vi.fn().mockResolvedValue(undefined);

const nodeSdkCtor = vi
  .fn()
  .mockImplementation((config: Record<string, unknown>) => ({
    config,
    start: sdkStart,
    shutdown: sdkShutdown,
  }));

const otlpCtor = vi
  .fn()
  .mockImplementation((opts: Record<string, unknown>) => ({
    opts,
  }));

const spanProcessorCtor = vi.fn().mockImplementation((exporter: unknown) => ({
  exporter,
}));

const getAutoInstrumentations = vi.fn().mockReturnValue(['auto']);

vi.mock('@opentelemetry/sdk-node', () => ({
  NodeSDK: nodeSdkCtor,
}));

vi.mock('@opentelemetry/exporter-trace-otlp-http', () => ({
  OTLPTraceExporter: otlpCtor,
}));

vi.mock('@opentelemetry/sdk-trace-base', () => ({
  SimpleSpanProcessor: spanProcessorCtor,
}));

vi.mock('@opentelemetry/auto-instrumentations-node', () => ({
  getNodeAutoInstrumentations: getAutoInstrumentations,
}));

describe('tracing bootstrap', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env.OTEL_SERVICE_NAME = 'queryhawk-test';
    process.env.OTEL_SERVICE_VERSION = '9.9.9';
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://collector:4318/v1/traces';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('SIGINT');
  });

  it('builds SDK with env-driven metadata and exporter', async () => {
    await import('../tracing');

    expect(nodeSdkCtor).toHaveBeenCalledTimes(1);
    const config = nodeSdkCtor.mock.calls[0]?.[0] as {
      resource?: { attributes?: Record<string, string> };
      instrumentations?: unknown[];
    };

    expect(config.resource?.attributes?.[ATTR_SERVICE_NAME]).toBe(
      'queryhawk-test',
    );
    expect(config.resource?.attributes?.[ATTR_SERVICE_VERSION]).toBe('9.9.9');

    expect(getAutoInstrumentations).toHaveBeenCalledWith(
      expect.objectContaining({
        '@opentelemetry/instrumentation-express': { enabled: true },
        '@opentelemetry/instrumentation-http': { enabled: true },
        '@opentelemetry/instrumentation-pg': { enabled: true },
      }),
    );

    expect(otlpCtor).toHaveBeenCalledWith({
      url: 'http://collector:4318/v1/traces',
    });

    expect(sdkStart).toHaveBeenCalled();
  });
});
