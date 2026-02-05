import { describe, expect, it } from 'vitest';
import { readFile } from 'fs/promises';
import { parse } from 'yaml';
import path from 'path';

const composePath = path.resolve(process.cwd(), 'docker-compose.yml');

describe('docker-compose.yml', () => {
  it('declares version, services, and shared network', async () => {
    const raw = await readFile(composePath, 'utf-8');
    const doc = parse(raw) as {
      version?: string;
      services?: Record<string, unknown>;
      networks?: Record<string, unknown>;
    };

    expect(doc.version).toBe('3.8');
    expect(doc.services).toBeDefined();
    expect(doc.services?.backend).toBeDefined();
    expect(doc.services?.grafana).toBeDefined();
    expect(doc.services?.['grafana-alloy']).toBeDefined();
    expect(doc.networks?.queryhawk_monitoring_network).toBeDefined();
  });

  it('configures backend OTLP endpoint and resource limits', async () => {
    const raw = await readFile(composePath, 'utf-8');
    const doc = parse(raw) as {
      services?: Record<string, { environment?: string[]; deploy?: any }>;
    };

    const backend = doc.services?.backend;
    expect(backend).toBeDefined();

    const env = backend?.environment ?? [];
    expect(env).toEqual(
      expect.arrayContaining([
        'OTEL_EXPORTER_OTLP_ENDPOINT=http://grafana-alloy:14318/v1/traces',
        'OTEL_SERVICE_NAME=queryhawk-backend',
      ]),
    );

    expect(backend?.deploy?.resources?.limits?.memory).toBe('768M');
  });
});
