/**
 * Alloy PostgreSQL Exporter
 * 
 * Dynamically configures Grafana Alloy targets for PostgreSQL monitoring.
 * This solves the problem of having to restart monitoring services when
 * adding new databases.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// Config
const TARGET_DIR = './grafana-alloy/targets';
const DEFAULT_POSTGRES_PORT = 5432;
const WRITE_TEST_FILE = '.write-test';

export interface ExporterConfig {
  userId: string;
  uri_string: string;
  port?: number;
}

export interface AlloyTarget {
  targets: string[];
  labels: {
    user_id: string;
    database: string;
    service: string;
    environment: string;
    instance?: string;
    database_name: string;
    user: string;
    [key: string]: string;
  };
}

export interface ExporterResult {
  success: boolean;
  targetFile: string;
  target: AlloyTarget;
  message: string;
}

export interface CleanupResult {
  success: boolean;
  message: string;
}

/**
 * Parse PostgreSQL connection strings and URIs to get host and port
 * 
 * Handles:
 * - postgresql://user:pass@host:port/db
 * - postgres://user:pass@host:port/db  
 * - host:port (plain format)
 */
function parseConnectionString(uri_string: string): {
  host: string;
  port: number;
} {
  try {
    let host: string;
    let port: number = DEFAULT_POSTGRES_PORT;

    // Handle standard PostgreSQL URI formats
    if (
      uri_string.startsWith('postgresql://') ||
      uri_string.startsWith('postgres://')
    ) {
      const url = new URL(uri_string);
      host = url.hostname || '';
      port = url.port ? parseInt(url.port) : DEFAULT_POSTGRES_PORT;
    } else {
      // Handle plain host:port format
      const parts = uri_string.split(':');
      if (parts.length < 1 || parts.length > 2) {
        throw new Error(
          'Invalid connection string format. Expected "host" or "host:port"'
        );
      }

      host = parts[0];
      if (parts.length === 2) {
        const parsedPort = parseInt(parts[1]);
        if (isNaN(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
          throw new Error(`Invalid port number: ${parts[1]}. Must be 1-65535`);
        }
        port = parsedPort;
      }
    }

    // Make sure we have a valid host
    if (!host || host.trim() === '') {
      throw new Error('Host cannot be empty');
    }

    return { host, port };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Invalid PostgreSQL connection string: ${error.message}`);
    }
    throw new Error(`Invalid PostgreSQL connection string: ${uri_string}`);
  }
}

/**
 * Test if a directory is writable by trying to create/delete a test file
 */
async function isDirectoryWritable(dir: string): Promise<boolean> {
  try {
    const testFile = path.join(dir, WRITE_TEST_FILE);
    await fs.writeFile(testFile, '');
    await fs.unlink(testFile);
    return true;
  } catch {
    return false;
  }
}

/**
 * Make sure the target directory exists, create it it needed
 */
async function ensureTargetDirectory(): Promise<void> {
  try {
    await fs.access(TARGET_DIR);
  } catch {
    try {
      await fs.mkdir(TARGET_DIR, { recursive: true });
    } catch (error) {
      throw new Error(
        `Failed to create target directory ${TARGET_DIR}: ${error}`
      );
    }
  }
}

/**
 * Extract database name from connection string
 */
function extractDatabaseName(uri_string: string): string {
  try {
    if (
      uri_string.includes('postgresql://') ||
      uri_string.includes('postgres://')
    ) {
      const url = new URL(uri_string);
      const pathname = url.pathname || '';
      return pathname.slice(1) || 'unknown';
    }

    // For connection string format, try to extract database name
    const dbMatch = uri_string.match(/dbname=([^;]+)/);
    return dbMatch ? dbMatch[1] : 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Extract username from connection string
 */
function extractUsername(uri_string: string): string {
  try {
    if (
      uri_string.includes('postgresql://') ||
      uri_string.includes('postgres://')
    ) {
      const url = new URL(uri_string);
      return url.username || 'unknown';
    }

    // For connection string format, try to extract username
    const userMatch = uri_string.match(/user=([^;]+)/);
    return userMatch ? userMatch[1] : 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Create a PostgreSQL monitoring target for Grafana Alloy
 * 
 * This:
 * 1. Validates the input
 * 2. Parses the connection string
 * 3. Creates the Alloy target config
 * 4. Writes it to a file
 * 5. Returns the result
 */
export const setDatabaseUriToPostgresExporter = async ({
  userId,
  uri_string,
  port,
}: ExporterConfig): Promise<ExporterResult> => {
  try {
    // Basic validation
    if (!userId || userId.trim() === '') {
      throw new Error('userId is required and cannot be empty');
    }

    if (!uri_string || uri_string.trim() === '') {
      throw new Error('uri_string is required and cannot be empty');
    }

    // Make sure we can write to the targets directory
    await ensureTargetDirectory();

    if (!(await isDirectoryWritable(TARGET_DIR))) {
      throw new Error(
        `Directory ${TARGET_DIR} is not writable by the backend service. ` +
          `Please check permissions and ensure the service has write access.`
      );
    }

    // Parse connection string
    const { host, port: parsedPort } = parseConnectionString(uri_string);
    const targetPort = port || parsedPort;

    // Create Alloy target configuration
    const target: AlloyTarget = {
      targets: [`${host}:${targetPort}`],
      labels: {
        user_id: userId,
        database: 'postgresql',
        service: 'queryhawk',
        environment: process.env['NODE_ENV'] || 'development',
        instance: `${host}:${targetPort}`,
        database_name: extractDatabaseName(uri_string),
        user: extractUsername(uri_string),
        // Add some metadata for organization
        created_at: new Date().toISOString(),
        version: '1.0.0',
      },
    };

    // Write config file
    const targetFile = path.join(TARGET_DIR, `user-${userId}.json`);
    await fs.writeFile(targetFile, JSON.stringify([target], null, 2));

    console.log(`✅ Created Alloy target for user ${userId}:`, {
      host,
      port: targetPort,
      database: target.labels.database_name,
      file: targetFile,
    });

    return {
      success: true,
      targetFile,
      target,
      message:
        `PostgreSQL monitoring target created successfully for user ${userId}. ` +
        `Alloy will automatically discover and start monitoring ${host}:${targetPort}`,
    };
  } catch (error) {
    console.error('❌ Error creating Alloy target:', error);

    // Give useful error messages
    if (error instanceof Error) {
      throw new Error(
        `Failed to create PostgreSQL monitoring target: ${error.message}`
      );
    }
    throw new Error(
      'Failed to create PostgreSQL monitoring target: Unknown error occurred'
    );
  }
};

/**
 * Remove a PostgreSQL monitoring target
 * 
 * This deletes the target file, which causes Alloy to stop monitoring
 * the database automatically.
 */
export const cleanupExporter = async (
  userId: string
): Promise<CleanupResult> => {
  try {
    if (!userId || userId.trim() === '') {
      throw new Error('userId is required and cannot be empty');
    }

    const targetFile = path.join(TARGET_DIR, `user-${userId}.json`);

    // Check if the target file exists
    try {
      await fs.access(targetFile);
    } catch {
      console.log(
        `ℹ️ Target file for user ${userId} not found, nothing to clean up`
      );
      return {
        success: true,
        message: `No monitoring target found for user ${userId}`,
      };
    }

    // Remove the target file
    await fs.unlink(targetFile);
    console.log(`✅ Removed Alloy target for user ${userId}`);

    // Alloy will stop monitoring automatically when the file is gone
    return {
      success: true,
      message:
        `PostgreSQL monitoring stopped successfully for user ${userId}. ` +
        `Alloy will automatically stop collecting metrics from the associated database.`,
    };
  } catch (error) {
    console.error(`❌ Error cleaning up exporter for user ${userId}:`, error);

    if (error instanceof Error) {
      throw new Error(`Failed to cleanup monitoring target: ${error.message}`);
    }
    throw new Error(
      'Failed to cleanup monitoring target: Unknown error occurred'
    );
  }
};

/**
 * List all active monitoring targets
 */
export const listActiveTargets = async (): Promise<AlloyTarget[]> => {
  try {
    await ensureTargetDirectory();
    const files = await fs.readdir(TARGET_DIR);

    const targets: AlloyTarget[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(TARGET_DIR, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const fileTargets = JSON.parse(content) as AlloyTarget[];
          targets.push(...fileTargets);
        } catch (fileError) {
          console.warn(
            `⚠️ Warning: Could not parse target file ${file}:`,
            fileError
          );
          // Keep going with other files
        }
      }
    }

    return targets;
  } catch (error) {
    console.error('❌ Error listing active targets:', error);

    if (error instanceof Error) {
      throw new Error(`Failed to list active targets: ${error.message}`);
    }
    throw new Error('Failed to list active targets: Unknown error occurred');
  }
};

/**
 * Get info about a specific monitoring target
 */
export const getTargetInfo = async (
  userId: string
): Promise<AlloyTarget | null> => {
  try {
    if (!userId || userId.trim() === '') {
      throw new Error('userId is required and cannot be empty');
    }

    const targetFile = path.join(TARGET_DIR, `user-${userId}.json`);

    try {
      await fs.access(targetFile);
    } catch {
      return null; // File doesn't exist
    }

    const content = await fs.readFile(targetFile, 'utf-8');
    const targets = JSON.parse(content) as AlloyTarget[];

    return targets.length > 0 ? targets[0] || null : null;
  } catch (error) {
    console.error(`❌ Error getting target info for user ${userId}:`, error);

    if (error instanceof Error) {
      throw new Error(`Failed to get target info: ${error.message}`);
    }
    throw new Error('Failed to get target info: Unknown error occurred');
  }
};