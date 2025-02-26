import Docker from 'dockerode';
import fs from 'fs/promises';
import path from 'path';
import * as yaml from 'js-yaml';

const docker = new Docker();
const NETWORK_NAME = 'queryhawk_monitoring_network';

interface ExporterConfig {
  userId: string;
  uri_string: string;
  port?: number;
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
  const containerName = `postgres-exporter-${userId}`;
  const hostPort = port || (await findAvailablePort(9187, 9999));
  const targetDir = '/var/prometheus/postgres_targets';

  // Verify directory access
  if (!(await isDirectoryWritable(targetDir))) {
    throw new Error(
      `Directory ${targetDir} is not writable by the backend service`
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
      // Log the error when inspecting/removing the container
      console.error(
        `Error inspecting or removing container ${containerName}:`,
        e
      );
    }

    // Create new container
    const container = await docker.createContainer({
      Image: 'prometheuscommunity/postgres-exporter',
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

    const yamlContent = `- targets:
    - "postgres-exporter-${userId}:9187"
  labels:
    user_id: "${userId}"
    instance: "postgres-exporter-${userId}"
`;

    // Ensure target directory exists
    await fs.mkdir(targetDir, { recursive: true });

    console.log('YAML Content (with visible whitespace):');
    console.log(
      yamlContent
        .split('\n')
        .map((line) => `"${line}"`)
        .join('\n')
    );
    // Write the YAML content to the file
    await fs.writeFile(path.join(targetDir, `${userId}.yml`), yamlContent);

    // console.log('Generated YAML:', yamlContent);
    const writtenContent = await fs.readFile(
      path.join(targetDir, `${userId}.yml`),
      'utf8'
    );
    console.log('Written Content (with visible whitespace):');
    console.log(
      writtenContent
        .split('\n')
        .map((line) => `"${line}"`)
        .join('\n')
    );

    // Trigger Prometheus configuration reload
    try {
      // 'http://queryhawk-prometheus:9090/-/reload'
      // const response = await fetch('http://prometheus:9090/-/reload', {
      const response = await fetch(
        'http://queryhawk-prometheus:9090/-/reload',
        {
          method: 'POST',
        }
      );
      if (!response.ok) {
        console.warn(
          'Prometheus reload returned non-200 status:',
          response.status
        );
      }
      console.log('Prometheus reload successful');
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
  const containerName = `postgres-exporter-${userId}`;
  try {
    // Stop and remove container
    const container = docker.getContainer(containerName);
    await container.stop();
    await container.remove();

    // Remove Prometheus target configuration
    await fs.unlink(`/var/prometheus/postgres_targets/${userId}.yml`);
    // await fs.unlink(`/etc/prometheus/postgres_targets/${userId}.yml`);

    // Trigger Prometheus reload
    await fetch('http://queryhawk-prometheus:9090/-/reload', {
      method: 'POST',
    });
  } catch (error) {
    console.error(`Error cleaning up exporter for user ${userId}:`, error);
    throw error;
  }
};