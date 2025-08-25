/**
 * Tests for Alloy PostgreSQL Exporter
 * 
 * Covers the main functionality and edge cases I've run into.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import {
  setDatabaseUriToPostgresExporter,
  cleanupExporter,
  listActiveTargets,
  getTargetInfo,
  ExporterConfig,
  AlloyTarget,
} from '../alloyPostgresExporter';

// Mock the file system
vi.mock('fs/promises');
const mockedFs = vi.mocked(fs);

describe('Alloy PostgreSQL Exporter', () => {
  const mockUserId = 'test-user-123';
  const mockHost = 'test-db.example.com';
  const mockPort = 5432;
  const mockDatabase = 'testdb';
  const mockUsername = 'testuser';

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setDatabaseUriToPostgresExporter', () => {
    const validConfig: ExporterConfig = {
      userId: mockUserId,
      uri_string: `postgresql://${mockUsername}:password@${mockHost}:${mockPort}/${mockDatabase}`,
    };

    it('creates a PostgreSQL monitoring target successfully', async () => {
      // Mock successful file operations
      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const result = await setDatabaseUriToPostgresExporter(validConfig);

      expect(result.success).toBe(true);
      expect(result.targetFile).toContain(mockUserId);
      expect(result.target.targets).toEqual([`${mockHost}:${mockPort}`]);
      expect(result.target.labels.user_id).toBe(mockUserId);
      expect(result.target.labels.database_name).toBe(mockDatabase);
      expect(result.target.labels.user).toBe(mockUsername);
      expect(result.message).toContain('created successfully');
    });

    it('handles postgres:// URI format', async () => {
      const postgresConfig: ExporterConfig = {
        userId: mockUserId,
        uri_string: `postgres://${mockUsername}:password@${mockHost}:${mockPort}/${mockDatabase}`,
      };

      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const result = await setDatabaseUriToPostgresExporter(postgresConfig);

      expect(result.success).toBe(true);
      expect(result.target.targets).toEqual([`${mockHost}:${mockPort}`]);
    });

    it('handles plain host:port format', async () => {
      const connectionStringConfig: ExporterConfig = {
        userId: mockUserId,
        uri_string: `${mockHost}:${mockPort}`,
      };

      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const result = await setDatabaseUriToPostgresExporter(connectionStringConfig);

      expect(result.success).toBe(true);
      expect(result.target.targets).toEqual([`${mockHost}:${mockPort}`]);
    });

    it('uses default port when not specified', async () => {
      const noPortConfig: ExporterConfig = {
        userId: mockUserId,
        uri_string: mockHost,
      };

      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const result = await setDatabaseUriToPostgresExporter(noPortConfig);

      expect(result.success).toBe(true);
      expect(result.target.targets).toEqual([`${mockHost}:5432`]);
    });

    it('overrides port when specified in config', async () => {
      const customPortConfig: ExporterConfig = {
        userId: mockUserId,
        uri_string: `postgresql://${mockUsername}:password@${mockHost}:5433/${mockDatabase}`,
        port: 5434,
      };

      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const result = await setDatabaseUriToPostgresExporter(customPortConfig);

      expect(result.success).toBe(true);
      expect(result.target.targets).toEqual([`${mockHost}:5434`]);
    });

    it('creates target directory if it does not exist', async () => {
      mockedFs.access.mockRejectedValue(new Error('Directory not found'));
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);

      await setDatabaseUriToPostgresExporter(validConfig);

      expect(mockedFs.mkdir).toHaveBeenCalledWith('./grafana-alloy/targets', { recursive: true });
    });

    it('validates userId is not empty', async () => {
      const invalidConfig: ExporterConfig = {
        userId: '',
        uri_string: validConfig.uri_string,
      };

      await expect(setDatabaseUriToPostgresExporter(invalidConfig))
        .rejects
        .toThrow('userId is required and cannot be empty');
    });

    it('validates uri_string is not empty', async () => {
      const invalidConfig: ExporterConfig = {
        userId: mockUserId,
        uri_string: '',
      };

      await expect(setDatabaseUriToPostgresExporter(invalidConfig))
        .rejects
        .toThrow('uri_string is required and cannot be empty');
    });

    it('handles invalid connection string format', async () => {
      const invalidConfig: ExporterConfig = {
        userId: mockUserId,
        uri_string: 'invalid:format:here',
      };

      await expect(setDatabaseUriToPostgresExporter(invalidConfig))
        .rejects
        .toThrow('Invalid connection string format');
    });

    it('handles invalid port numbers', async () => {
      const invalidConfig: ExporterConfig = {
        userId: mockUserId,
        uri_string: 'host:99999',
      };

      await expect(setDatabaseUriToPostgresExporter(invalidConfig))
        .rejects
        .toThrow('Invalid port number');
    });

    it('handles empty host', async () => {
      const invalidConfig: ExporterConfig = {
        userId: mockUserId,
        uri_string: ':5432',
      };

      await expect(setDatabaseUriToPostgresExporter(invalidConfig))
        .rejects
        .toThrow('Host cannot be empty');
    });

    it('handles directory not writable error', async () => {
      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.mkdir.mockResolvedValue(undefined);
      
      // Mock writeFile to fail
      mockedFs.writeFile.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      await expect(setDatabaseUriToPostgresExporter(validConfig))
        .rejects
        .toThrow('Failed to create PostgreSQL monitoring target');
    });

    it('sets environment from NODE_ENV', async () => {
      process.env.NODE_ENV = 'production';
      
      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const result = await setDatabaseUriToPostgresExporter(validConfig);

      expect(result.target.labels.environment).toBe('production');
    });

    it('defaults to development environment when NODE_ENV not set', async () => {
      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const result = await setDatabaseUriToPostgresExporter(validConfig);

      expect(result.success).toBe(true);
      expect(result.target.labels.environment).toBe('development');
    });
  });

  describe('cleanupExporter', () => {
    it('removes a monitoring target successfully', async () => {
      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.unlink.mockResolvedValue(undefined);

      const result = await cleanupExporter(mockUserId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('stopped successfully');
      expect(mockedFs.unlink).toHaveBeenCalled();
    });

    it('handles target file not found gracefully', async () => {
      mockedFs.access.mockRejectedValue(new Error('File not found'));

      const result = await cleanupExporter(mockUserId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('No monitoring target found');
      expect(mockedFs.unlink).not.toHaveBeenCalled();
    });

    it('validates userId is not empty', async () => {
      await expect(cleanupExporter(''))
        .rejects
        .toThrow('userId is required and cannot be empty');
    });

    it('handles file system errors during cleanup', async () => {
      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.unlink.mockRejectedValue(new Error('Permission denied'));

      await expect(cleanupExporter(mockUserId))
        .rejects
        .toThrow('Failed to cleanup monitoring target');
    });
  });

  describe('listActiveTargets', () => {
    const mockTargets: AlloyTarget[] = [
      {
        targets: [`${mockHost}:${mockPort}`],
        labels: {
          user_id: mockUserId,
          database: 'postgresql',
          service: 'queryhawk',
          environment: 'development',
          instance: `${mockHost}:${mockPort}`,
          database_name: mockDatabase,
          user: mockUsername,
        },
      },
    ];

    it('lists all active monitoring targets', async () => {
      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.readdir.mockResolvedValue(['user-123.json', 'user-456.json'] as any);
      mockedFs.readFile
        .mockResolvedValueOnce(JSON.stringify(mockTargets))
        .mockResolvedValueOnce(JSON.stringify(mockTargets));

      const result = await listActiveTargets();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockTargets[0]);
      expect(result[1]).toEqual(mockTargets[0]);
    });

    it('handles empty targets directory', async () => {
      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.readdir.mockResolvedValue([]);

      const result = await listActiveTargets();

      expect(result).toHaveLength(0);
    });

    it('skips non-JSON files', async () => {
      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.readdir.mockResolvedValue(['user-123.json', 'config.txt', 'user-456.json'] as any);
      mockedFs.readFile
        .mockResolvedValueOnce(JSON.stringify(mockTargets))
        .mockResolvedValueOnce(JSON.stringify(mockTargets));

      const result = await listActiveTargets();

      expect(result).toHaveLength(2);
      expect(mockedFs.readFile).toHaveBeenCalledTimes(2);
    });

    it('handles malformed JSON files gracefully', async () => {
      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.readdir.mockResolvedValue(['user-123.json', 'user-456.json'] as any);
      mockedFs.readFile
        .mockResolvedValueOnce(JSON.stringify(mockTargets))
        .mockResolvedValueOnce('invalid json content');

      const result = await listActiveTargets();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockTargets[0]);
    });

    it('creates target directory if it does not exist', async () => {
      mockedFs.access.mockRejectedValue(new Error('Directory not found'));
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.readdir.mockResolvedValue([]);

      await listActiveTargets();

      expect(mockedFs.mkdir).toHaveBeenCalledWith('./grafana-alloy/targets', { recursive: true });
    });
  });

  describe('getTargetInfo', () => {
    const mockTarget: AlloyTarget = {
      targets: [`${mockHost}:${mockPort}`],
      labels: {
        user_id: mockUserId,
        database: 'postgresql',
        service: 'queryhawk',
        environment: 'development',
        instance: `${mockHost}:${mockPort}`,
        database_name: mockDatabase,
        user: mockUsername,
      },
    };

    it('returns target information for existing user', async () => {
      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.readFile.mockResolvedValue(JSON.stringify([mockTarget]));

      const result = await getTargetInfo(mockUserId);

      expect(result).toEqual(mockTarget);
    });

    it('returns null for non-existent user', async () => {
      mockedFs.access.mockRejectedValue(new Error('File not found'));

      const result = await getTargetInfo(mockUserId);

      expect(result).toBeNull();
    });

    it('validates userId is not empty', async () => {
      await expect(getTargetInfo(''))
        .rejects
        .toThrow('userId is required and cannot be empty');
    });

    it('handles file read errors', async () => {
      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.readFile.mockRejectedValue(new Error('Permission denied'));

      await expect(getTargetInfo(mockUserId))
        .rejects
        .toThrow('Failed to get target info');
    });

    it('handles malformed JSON content', async () => {
      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.readFile.mockResolvedValue('invalid json');

      await expect(getTargetInfo(mockUserId))
        .rejects
        .toThrow('Failed to get target info');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles network errors gracefully', async () => {
      const networkError = new Error('Network timeout');
      mockedFs.access.mockRejectedValue(networkError);

      await expect(setDatabaseUriToPostgresExporter({
        userId: mockUserId,
        uri_string: `postgresql://${mockUsername}:password@${mockHost}:${mockPort}/${mockDatabase}`,
      })).rejects.toThrow('Failed to create PostgreSQL monitoring target');
    });

    it('handles concurrent access scenarios', async () => {
      // Simulate directory being created by another process
      mockedFs.access.mockRejectedValueOnce(new Error('Directory not found'));
      mockedFs.mkdir.mockRejectedValueOnce(new Error('Directory already exists'));
      mockedFs.access.mockResolvedValueOnce(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const result = await setDatabaseUriToPostgresExporter({
        userId: mockUserId,
        uri_string: `postgresql://${mockUsername}:password@${mockHost}:${mockPort}/${mockDatabase}`,
      });

      expect(result.success).toBe(true);
    });

    it('handles very long connection strings', async () => {
      const longPassword = 'a'.repeat(1000);
      const longConfig: ExporterConfig = {
        userId: mockUserId,
        uri_string: `postgresql://${mockUsername}:${longPassword}@${mockHost}:${mockPort}/${mockDatabase}`,
      };

      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const result = await setDatabaseUriToPostgresExporter(longConfig);

      expect(result.success).toBe(true);
      expect(result.target.labels.user).toBe(mockUsername);
    });
  });
});
