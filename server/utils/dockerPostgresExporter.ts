import Docker from 'dockerode';
import fs from 'fs/promises';
import path from 'path';

const docker = new Docker();

interface ExporterConfig {
  userId: string;
  uri_string: string;
  port?: number;
}

export const setDatabaseUriToPostgresExporter = async ({
  userId,
  uri_string,
  port,
}: ExporterConfig) => {
  // const containerName = `${userId}-postgres-exporter`;
  const containerName = `postgres-exporter-${userId}`;
  const hostPort = port || (await findAvailablePort(9187, 9999));

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
      name: `postgres-exporter-${userId}`,
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
      // targets: [`postgres-exporter-${userId}:9187`],
      targets: [`postgres-exporter-${userId}:`],
      labels: {
        user_id: userId,
        instance: `postgres-exporter-${userId}`,
      },
    };

    // Ensure target directory exists
    const targetDir = '/var/prometheus/postgres_targets';
    // const targetDir = '/etc/prometheus/postgres_targets';
    await fs.mkdir(targetDir, { recursive: true });

    // Write target configuration
    await fs.writeFile(
      path.join(targetDir, `${userId}.yml`),
      JSON.stringify([targetConfig], null, 2)
    );

    // Trigger Prometheus configuration reload
    try {
      await fetch('http://prometheus:9090/-/reload', { method: 'POST' });
    } catch (error) {
      console.warn('Failed to reload Prometheus config:', error);
      // Don't fail the whole operation if Prometheus reload fails
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
