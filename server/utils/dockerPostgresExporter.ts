// latest
// import Docker from 'dockerode';
// const docker = new Docker();

// // startPostgresExporter
// // setDatabaseUriToPostgresExporter

// // Security: Be careful with sensitive data like database credentials. Ensure that the user-provided URI is securely handled, and avoid logging sensitive information.
// // Networking: Ensure that the user’s database is accessible by the postgres_exporter container. If it’s running on another host or network, you may need to handle networking accordingly (e.g., Docker networking, port-forwarding).
// // Multiple Users: If you are handling metrics for multiple users, you may want to ensure that each postgres_exporter instance is isolated (e.g., different ports) or spun up dynamically per user request.
// export const setDatabaseUriToPostgresExporter = async (uri_string: string) => {
//   try {
//     const container = await docker.createContainer({
//       Image: 'prometheuscommunity/postgres-exporter', // Image for the exporter
//       Env: [`DATA_SOURCE_NAME=${uri_string}`], // Pass the user’s database URI
//       ExposedPorts: {
//         '9187/tcp': {},
//       },
//       HostConfig: {
//         PortBindings: {
//           '9187/tcp': [
//             {
//               HostPort: '9187',
//             },
//           ],
//         },
//       },
//       name: 'postgres_exporter',
//       Labels: {
//         'com.docker.compose.service': 'postgres_exporter', // Custom label for Prometheus discovery
//       },
//     });

//     await container.start();
//     console.log('Postgres Exporter container started with user database URI');
//   } catch (err) {
//     console.error('Error starting Postgres Exporter:', err);

//     if (err?.json?.message?.includes('No such image')) {
//       console.error(
//         'It looks like the image is not available locally. Please pull the image first: docker pull prometheuscommunity/postgres-exporter'
//       );
//     }

//     throw err; // Re-throw the error to ensure it's handled appropriately in your controller
//   }
// };

import Docker from 'dockerode';
import fs from 'fs/promises';
import path from 'path';

const docker = new Docker();

interface ExporterConfig {
  userId: string;
  uri_string: string;
  port?: number;
}

export const setDatabaseUriToPostgresExporter = async (
  userId: string,
  uri_string: string,
  port?: number
) => {
  const containerName = `postgres-exporter-${userId}`;
  const hostPort = port || (await findAvailablePort(9187, 9999));

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
      },
      Labels: {
        'user.id': userId,
        'exporter.type': 'postgres',
        'com.docker.compose.service': 'postgres_exporter',
      },
    });

    await container.start();

    // Create Prometheus target configuration
    const targetConfig = {
      targets: [`localhost:${hostPort}`],
      labels: {
        user_id: userId,
        instance: containerName,
      },
    };

    // Ensure target directory exists
    const targetDir = '/etc/prometheus/postgres_targets';
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
  const containerName = `postgres-exporter-${userId}`;

  try {
    // Stop and remove container
    const container = docker.getContainer(containerName);
    await container.stop();
    await container.remove();

    // Remove Prometheus target configuration
    await fs.unlink(`/etc/prometheus/postgres_targets/${userId}.yml`);

    // Trigger Prometheus reload
    await fetch('http://prometheus:9090/-/reload', { method: 'POST' });
  } catch (error) {
    console.error(`Error cleaning up exporter for user ${userId}:`, error);
    throw error;
  }
};
