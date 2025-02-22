import Docker from 'dockerode';
import fs from 'fs/promises';
import path from 'path';

const docker = new Docker();

interface ExporterConfig {
  userId: string;
  uri_string: string;
  port?: number;
}

async function checkPermissions(dir: string): Promise<void> {
  try {
    // Try to create a test file
    const testFile = path.join(dir, '.permission-test');
    await fs.writeFile(testFile, '', { mode: 0o644 });
    await fs.unlink(testFile);
  } catch (error) {
    throw new Error(`Permission check failed for ${dir}: ${error.message}`);
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
export const setDatabaseUriToPostgresExporter = async ({
  userId,
  uri_string,
  port,
}: ExporterConfig) => {
  // const containerName = `${userId}-postgres-exporter`;
  const containerName = `postgres-exporter-${userId}`;
  const hostPort = port || (await findAvailablePort(9187, 9999));
  const targetDir = '/var/prometheus/postgres_targets';

  // Add the permissions check here, before the directory writable check
  await checkPermissions(targetDir);

  // Verify directory access
  if (!(await isDirectoryWritable(targetDir))) {
    throw new Error(
      `Directory ${targetDir} is not writable by the backend service`
    );
  }

  try {
    await docker.getNetwork('queryhawk_monitoring_network').inspect();
  } catch (err) {
    console.error('Network not found:', err);
    throw new Error(
      'Required Docker network not found: queryhawk_monitoring_network'
    );
  }

  // checking if network eists before creating any containers
  try {
    await docker.getNetwork('queryhawk_monitoring_network').inspect();
  } catch (err) {
    console.error('Network not found:', err);
    throw new Error(
      'Required Docker network not found: queryhawk_monitoring_network'
    );
  }

  try {
    // Check if container already exists
    const existingContainer = docker.getContainer(containerName);
    try {
      const containerInfo = await existingContainer.inspect();
      if (containerInfo.State.Running) {
        console.log(
          `Container ${containerName} already running, stopping first`
        );
        await existingContainer.stop();
      }
      await existingContainer.remove();
    } catch (e) {
      // Container doesn't exist, which is fine
    }

    // Create new container
    const container = await docker.createContainer({
      Image: 'prometheuscommunity/postgres-exporter',
      // name: `postgres-exporter-${userId}`,
      name: containerName,
      Env: [`DATA_SOURCE_NAME=${uri_string}`],
      ExposedPorts: {
        '9187/tcp': {},
      },
      HostConfig: {
        PortBindings: {
          '9187/tcp': [{ HostPort: hostPort.toString() }],
        },
        RestartPolicy: {
          Name: 'always',
        },
        NetworkMode: 'queryhawk_monitoring_network',
      },
      Labels: {
        'user.id': userId,
        'exporter.type': 'postgres',
        'com.docker.compose.project': 'queryhawk', //for prometheus discover
        'com.docker.compose.service': 'postgres_exporter',
      },
    });

    await container.start();

    // Create Prometheus target configuration
    const targetConfig = {
      // targets: [`${userId}-postgres-exporter:9187`],
      targets: [`postgres-exporter-${userId}:9187`],
      // targets: [`postgres-exporter-${userId}:`],
      labels: {
        user_id: userId,
        instance: `postgres-exporter-${userId}`,
      },
    };

    // // Ensure target directory exists
    // const targetDir = '/var/prometheus/postgres_targets';
    // const targetDir = '/etc/prometheus/postgres_targets';
    await fs.mkdir(targetDir, { recursive: true });

    // Write target configuration
    await fs.writeFile(
      path.join(targetDir, `${userId}.yml`),
      JSON.stringify([targetConfig], null, 2)
    );

    // works but co
    // try {
    //   // Create directory if it doesn't exist
    //   await fs.mkdir(targetDir, { recursive: true, mode: 0o755 });

    //   // Write configuration file with explicit permissions
    //   const configPath = path.join(targetDir, `${userId}.yml`);
    //   await fs.writeFile(configPath, JSON.stringify([targetConfig], null, 2), {
    //     mode: 0o644,
    //   });

    //   // Verify file was written
    //   await fs.access(configPath, fs.constants.R_OK | fs.constants.W_OK);
    // } catch (error) {
    //   console.error('Error writing target configuration:', error);
    //   // Cleanup if file operations fail
    //   try {
    //     await container.stop();
    //     await container.remove();
    //   } catch (cleanupError) {
    //     console.error('Error during cleanup:', cleanupError);
    //   }
    //   throw new Error(`Failed to write target configuration: ${error.message}`);
    // }

    // Trigger Prometheus configuration reload
    // try {
    //   await fetch('http://prometheus:9090/-/reload', { method: 'POST' });
    // } catch (error) {
    //   console.warn('Failed to reload Prometheus config:', error);
    //   // Don't fail the whole operation if Prometheus reload fails
    // }

    // return {
    //   containerId: container.id,
    //   port: hostPort,
    //   name: containerName,
    // };

    // Trigger Prometheus configuration reload
    try {
      const response = await fetch('http://prometheus:9090/-/reload', {
        method: 'POST',
      });
      if (!response.ok) {
        console.warn(
          'Prometheus reload returned non-200 status:',
          response.status
        );
      }
    } catch (error) {
      console.warn('Failed to reload Prometheus config:', error);
      // Don't fail the operation if Prometheus reload fails
    }

    return {
      containerId: container.id,
      port: hostPort,
      name: containerName,
    };
  } catch (err) {
    console.error('Error managing Postgres Exporter:', err);

    if (err?.json?.message?.includes('No such image')) {
      try {
        console.log('Pulling postgres-exporter image...');
        await docker.pull('prometheuscommunity/postgres-exporter:latest');
        // Retry container creation
        return setDatabaseUriToPostgresExporter({ userId, uri_string });
      } catch (pullError) {
        throw new Error(`Failed to pull image: ${pullError.message}`);
      }
    }

    throw err;
  }
};

// Helper function to find an available port
async function findAvailablePort(start: number, end: number): Promise<number> {
  const containers = await docker.listContainers();
  const usedPorts = new Set(
    containers.flatMap((container) =>
      Object.values(container.Ports)
        .filter((port) => port.PublicPort)
        .map((port) => port.PublicPort)
    )
  );

  for (let port = start; port <= end; port++) {
    if (!usedPorts.has(port)) {
      return port;
    }
  }
  throw new Error('No available ports found in range');
}

// Cleanup function for when monitoring is stopped
export const cleanupExporter = async (userId: string) => {
  // const containerName = `${userId}-postgres-exporter:9187`;
  // const containerName = `${userId}-postgres-exporter`; // removing port from container name
  const containerName = `postgres-exporter-${userId}`;
  // const containerName = `postgres-exporter-${userId}:9187`;
  try {
    // Stop and remove container
    const container = docker.getContainer(containerName);
    await container.stop();
    await container.remove();

    // Remove Prometheus target configuration
    await fs.unlink(`/var/prometheus/postgres_targets/${userId}.yml`);
    // await fs.unlink(`/etc/prometheus/postgres_targets/${userId}.yml`);

    // Trigger Prometheus reload
    await fetch('http://prometheus:9090/-/reload', { method: 'POST' });
  } catch (error) {
    console.error(`Error cleaning up exporter for user ${userId}:`, error);
    throw error;
  }
};
