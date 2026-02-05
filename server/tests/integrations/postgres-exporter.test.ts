import { describe, it, expect } from 'vitest';
import {
  setDatabaseUriToPostgresExporter,
  cleanupExporter,
} from '../../../alloy-postgres-exporter/src/alloyPostgresExporter';

describe('postgres-exporter integration', () => {
  it('creates and cleans up a target', async () => {
    const userId = 'test-user-1';
    const result = await setDatabaseUriToPostgresExporter({
      userId,
      uri_string:
        'postgresql://testuser:testpass123@test_user_db:5432/testdb?sslmode=disable',
    });

    expect(result.success).toBe(true);

    await cleanupExporter(userId);
  });
});
