import * as fs from 'fs/promises';
import * as path from 'path';

const TARGET_DIR = './grafana-alloy/targets';
const DYNAMIC_TARGETS_FILE = path.join(TARGET_DIR, 'dynamic-targets.json');

interface ExporterConfig {
  userId: string;
  uri_string: string;
  port?: number;
}

interface AlloyTarget {
  targets: string[];
  labels: {
    user_id: string;
    database: string;
    service: string;
    environment: string;
    instance?: string;
    [key: string]: string;
  };
}

// Helper function to parse PostgreSQL connection string
function parseConnectionString(uri_string: string): {
  host: string;
  port: number;
} {
  try {
    // Handle different PostgreSQL URI formats
    let host: string;
    let port: number = 5432; // Default PostgreSQL port

    if (uri_string.startsWith('postgresql://')) {
      const url = new URL(uri_string);
      host = url.hostname;
      port = url.port ? parseInt(url.port) : 5432;
    } else if (uri_string.startsWith('postgres://')) {
      const url = new URL(uri_string);
      host = url.hostname;
      port = url.port ? parseInt(url.port) : 5432;
    } else {
      // Handle connection string format: host:port
      const parts = uri_string.split(':');
      host = parts[0];
      port = parts[1] ? parseInt(parts[1]) : 5432;
    }

    return { host, port };
  } catch (error) {
    console.error('Error parsing connection string:', error);
    throw new Error(`Invalid PostgreSQL connection string: ${uri_string}`);
  }
}

// Helper function to check if directory is writable
async function isDirectoryWritable(dir: string): Promise<boolean> {
  try {
    const testFile = path.join(dir, '.write-test');
    await fs.writeFile(testFile, '');
    await fs.unlink(testFile);
    return true;
  } catch {
    return false;
  }
}

// Helper function to ensure target directory exists
async function ensureTargetDirectory(): Promise<void> {
  try {
    await fs.access(TARGET_DIR);
  } catch {
    await fs.mkdir(TARGET_DIR, { recursive: true });
  }
}

export const setDatabaseUriToPostgresExporter = async ({
  userId,
  uri_string,
  port,
}: ExporterConfig) => {
  try {
    await ensureTargetDirectory();
    if (!(await isDirectoryWritable(TARGET_DIR))) {
      throw new Error(
        `Directory ${TARGET_DIR} is not writable by the backend service`
      );
    }

    // Parse connection string to extract host and port
    const { host, port: parsedPort } = parseConnectionString(uri_string);
    const targetPort = port || parsedPort;

    // Create Alloy target configuration
    const newTarget: AlloyTarget = {
      targets: [`${host}:${targetPort}`],
      labels: {
        user_id: userId,
        database: 'postgresql',
        service: 'queryhawk',
        environment: process.env.NODE_ENV || 'development',
        instance: `${host}:${targetPort}`,
        database_name: extractDatabaseName(uri_string),
        user: extractUsername(uri_string),
      },
    };

    // Read existing targets
    let targets: AlloyTarget[] = [];
    try {
      const content = await fs.readFile(DYNAMIC_TARGETS_FILE, 'utf8');
      targets = JSON.parse(content);
    } catch (err) {
      // If file doesn't exist, start with empty array
      targets = [];
    }

    // Update or add target for this user
    const idx = targets.findIndex(
      (t) => t.labels && t.labels.user_id === userId
    );
    if (idx >= 0) {
      targets[idx] = newTarget;
    } else {
      targets.push(newTarget);
    }

    // Write back to dynamic-targets.json
    await fs.writeFile(DYNAMIC_TARGETS_FILE, JSON.stringify(targets, null, 2));

    console.log(`Updated dynamic-targets.json for user ${userId}:`, newTarget);

    return {
      success: true,
      targetFile: DYNAMIC_TARGETS_FILE,
      target: newTarget,
      message: `PostgreSQL monitoring target updated for user ${userId}`,
    };
  } catch (error) {
    console.error('Error updating dynamic Alloy target:', error);
    throw error;
  }
};

// Helper function to extract database name from connection string
function extractDatabaseName(uri_string: string): string {
  try {
    if (
      uri_string.includes('postgresql://') ||
      uri_string.includes('postgres://')
    ) {
      const url = new URL(uri_string);
      return url.pathname.slice(1) || 'unknown';
    }
    // For connection string format, try to extract database name
    const dbMatch = uri_string.match(/dbname=([^;]+)/);
    return dbMatch ? dbMatch[1] : 'unknown';
  } catch {
    return 'unknown';
  }
}

// Helper function to extract username from connection string
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

// Cleanup function for when monitoring is stopped
export const cleanupExporter = async (userId: string) => {
  try {
    const targetFile = path.join(TARGET_DIR, `user-${userId}.json`);

    // Check if target file exists
    try {
      await fs.access(targetFile);
    } catch {
      console.log(
        `Target file for user ${userId} not found, nothing to clean up`
      );
      return { success: true, message: 'No target found to clean up' };
    }

    // Remove target configuration file
    await fs.unlink(targetFile);
    console.log(`Removed Alloy target for user ${userId}`);

    // Alloy automatically stops monitoring when target files are removed
    return {
      success: true,
      message: `PostgreSQL monitoring stopped for user ${userId}`,
    };
  } catch (error) {
    console.error(`Error cleaning up exporter for user ${userId}:`, error);
    throw error;
  }
};

// Function to list all active targets
export const listActiveTargets = async (): Promise<AlloyTarget[]> => {
  try {
    await ensureTargetDirectory();
    const files = await fs.readdir(TARGET_DIR);
    const targetFiles = files.filter(
      (file) => file.endsWith('.json') && file.startsWith('user-')
    );

    const targets: AlloyTarget[] = [];

    for (const file of targetFiles) {
      try {
        const content = await fs.readFile(path.join(TARGET_DIR, file), 'utf8');
        const fileTargets = JSON.parse(content);
        targets.push(...fileTargets);
      } catch (error) {
        console.error(`Error reading target file ${file}:`, error);
      }
    }

    return targets;
  } catch (error) {
    console.error('Error listing active targets:', error);
    return [];
  }
};

// Function to get target status for a specific user
export const getTargetStatus = async (
  userId: string
): Promise<AlloyTarget | null> => {
  try {
    const targetFile = path.join(TARGET_DIR, `user-${userId}.json`);
    const content = await fs.readFile(targetFile, 'utf8');
    const targets = JSON.parse(content);
    return targets[0] || null;
  } catch (error) {
    console.error(`Error getting target status for user ${userId}:`, error);
    return null;
  }
};


