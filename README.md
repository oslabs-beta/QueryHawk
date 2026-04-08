<div align="center">
  <img src="./src/components/assets/logo_queryhawk.svg" width=50% alt="logo_queryhawk">
</div>

<div align="center">
<a id="queryhawk"></a>
<h1>QueryHawk</h1> 
<p>
<strong>Get a hawk-eyed look at your query performance.</strong>
</p>

</div>

## Monitor and Analyze Your SQL Performance and Database Health

QueryHawk monitors and visualizes key SQL metrics to help users improve database and query performance. A central dashboard monitors database health. Containers ensure a consistent environment for all users.

<details>
  <summary>Table of Contents</summary>

- [Introduction](#introduction)
- [Features](#features)
- [Initial Set-up and Installation](#initial-set-up-and-installation)
- [Technologies](#technologies)
- [User Interface](#user-interface)
- [QueryHawk Team](#queryhawk-team)
- [Acknowledgements](#acknowledgements)
- [License](#license)

</details>
</div>

## Introduction

QueryHawk delivers comprehensive SQL database monitoring and visualization, empowering developers and database administrators to optimize performance and quickly identify bottlenecks. Built on industry-standard tools including Grafana, Grafana Alloy, Jaeger, Loki, and Mimir, all containerized with Docker for seamless deployment.

- ✅ Real-time SQL query analysis with millisecond-precision execution metrics
- ✅ Complete visibility into query execution plans with detailed buffer and cache statistics
- ✅ Interactive dashboards for visualizing database health and performance trends
- ✅ Query comparison tool to benchmark and optimize SQL performance
- ✅ Redis performance testing to benchmark PostgreSQL execution time against Redis cache retrieval
- ✅ Track query execution paths across entire application with distributed tracing

With QueryHawk's intuitive interface, teams can proactively manage database performance, reduce troubleshooting time, and make data-driven optimization decisions. The containerized architecture ensures easy deployment across development, staging, and production environments.

Gain insights into your SQL databases and enhance how your team approaches database performance optimization with QueryHawk.

## Features

## 🔍 Deep SQL Query Analysis

- Execution Plan Analysis: Run "EXPLAIN ANALYZE" to capture detailed planning and execution metrics in real time.
- Query Performance Profiling: Measure execution time, rows processed, loops, and buffer usage before deploying queries.
- Side-by-Side Query Comparison: Compare unoptimized vs optimized queries with clear performance breakdowns.
- Redis Benchmarking: Benchmark PostgreSQL queries against Redis cache retrieval to quantify caching improvements.
- Cache Insights: Analyze cache hit ratios and shared buffer usage to identify memory optimization opportunities.
- Historical Tracking: Save and revisit past queries to monitor performance improvements over time.
- Secure Database Connections: Connect to any PostgreSQL database with SSL support and connection validation.

## 📊 Real-time Performance Monitoring

Once connected, QueryHawk will display multiple metrics, including:

- Transaction rate
- Cache hit ratio
- Active connections
- Top 10 Slowest Queries
- Tuple operations
- Lock metrics
- I/O statistics
- Index usage
- Transaction commits vs. rollbacks
- Long-running queries

## 🫥 Tracing Requests

QueryHawk includes distributed tracing capabilities:

- View the Jaeger dashboard embedded in the UI
- Track request flows through your application
- Identify performance bottlenecks
- Debug slow queries

### Tracing configuration notes

- Traces are exported via OTLP HTTP to Grafana Alloy to keep a single, consistent collection path.
- The backend uses a SimpleSpanProcessor in development to make traces visible immediately; swap to a BatchSpanProcessor for production.
- Sampling is left as default (always on) for local debugging, but can be tuned via OpenTelemetry env vars as traffic grows.

## 🛠️ Enterprise-Ready Architecture

- Docker-based Deployment: Quickly deploy the entire monitoring stack with Docker Compose.
- Secure Authentication: GitHub OAuth integration for secure user management.
- Dynamic Exporters: Automatically create and manage Grafana Alloy targets for PostgreSQL monitoring without restarting services.

## Initial Set-up and Installation

## 🔧 Prerequisites

- Docker and Docker Compose
- PostgreSQL database
- GitHub account (for OAuth)

## 💻 Installation

1. Clone the repository:

```bash
git clone [repository-url]
cd queryhawk
```

2. [Download Docker Desktop](https://www.docker.com/products/docker-desktop), install, and open.

3. Configure environment variables

- Create .env in the root directory
- Input and configure environment variables

```
# Example fields (please update with your real values for each one)
POSTGRES_URI=postgresql://username:password@hostname:port/database
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
JWT_SECRET=your_jwt_secret
SUPABASE_URI=your_supabase_uri


# Supabase PostgreSQL connection details (found in Supabase dashboard under Project Settings > Database)
POSTGRES_HOST=aws-0-us-east-2.pooler.supabase.com   # Your Supabase pooler host
POSTGRES_USER=postgres.your_project_ref             # Format: postgres.<your-project-ref>
POSTGRES_DB=postgres                                # Default Supabase database name
POSTGRES_PASSWORD=your_database_password            # Your Supabase database password
```

4. Start the services

```bash
docker-compose up -d
```

5. Access the application:

```
Frontend: http://localhost:5173
```

### ⚠️ Important: Grafana Mimir Data Source URL

If you are using Grafana Mimir version 2.10.0 or later, the Prometheus-compatible API is exposed under the `/prometheus` path (not `/api/v1`).

**When adding Mimir as a Prometheus data source in Grafana, set the URL to:**

```
http://mimir:9009/prometheus
```

If you use the default (`/api/v1`), queries will fail with 404 errors. Always use `/prometheus` for Mimir 2.10.0+.

## Docker Cheatsheet

Steps to create container:

1. Build the Docker Image:
   docker build -t <image_name>:<tag> .
   Example:
   docker build -t my-server -f server/Dockerfile .

2. Verify the Image was build:
   docker images

3. Create and Start a New Container
   docker run -p <host_port>:<container_port> --name <container_name>
   Example:
   docker run -p 4002:4001 my-server

```
To find containers ID or containers name:
docker ps

To stop container:
docker stop <container_name> or docker stop <container_id>

Optional remove container after stopping it:
docker rm <container_name> or docker rm <container_id>

Rebuilds container:
docker-compose build (name)

Use all container from docker-compose.yml:
docker-compose up

Remove all containers that are running that came from the docker-compose.yml file:
docker-compose down

Stop all containers:
docker stop $(docker ps -aq)

Remove all containers:
docker rm $(docker ps -aq)

Remove all images:
docker rmi $(docker images -q)

remove all volumes:
docker volume rm $(docker volume ls -q)

remove all network volumes:
docker network prune

Remove all dangling resources:
docker system prune -a
```

## Technologies

<div align="center">

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![HTML](https://img.shields.io/badge/HTML-e85a2e?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-2e35e8?style=for-the-badge&logo=css3&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![MUI](https://img.shields.io/badge/MUI-007FFF?style=for-the-badge&logo=mui&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![CORS](https://img.shields.io/badge/CORS-000000?style=for-the-badge&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Postman](https://img.shields.io/badge/Postman-ff6c37?style=for-the-badge&logo=postman&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![NPM](https://img.shields.io/badge/NPM-%23CB3837.svg?style=for-the-badge&logo=npm&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Jaeger](https://img.shields.io/badge/Jaeger-66CFE3?style=for-the-badge&logo=jaeger&logoColor=white)
![Loki](https://img.shields.io/badge/Loki-F46800?style=for-the-badge&logo=grafana&logoColor=white)
![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-F57600?style=for-the-badge&logo=OpenTelemetry&logoColor=white)
![Grafana](https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white)
![Grafana Alloy](https://img.shields.io/badge/Grafana_Alloy-F46800?style=for-the-badge&logo=grafana&logoColor=white)
![Mimir](https://img.shields.io/badge/Mimir-F46800?style=for-the-badge&logo=grafana&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-22B5BF?style=for-the-badge&logo=recharts&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-FFAA33?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![GitHub OAuth](https://img.shields.io/badge/GitHub_OAuth-181717?style=for-the-badge&logo=github&logoColor=white)
![.env](https://img.shields.io/badge/.env-ECD53F?style=for-the-badge&logoColor=white)
![TS-Node](https://img.shields.io/badge/TSNode-blue?style=for-the-badge&logo=ts-node&logoColor=white)
![Nodemon](https://img.shields.io/badge/Nodemon-76D04B?style=for-the-badge&logo=nodemon&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)

</div>

---

## User Interface

<div align="center">

<img src="./src/components/assets/QH_Login.png" alt="Login" width=50% />

<br>
</div>

---

<div align="center">

<br>

![Dashboard](/src/components/assets/QH_Dashboard.png)
<br>

</div>

---

<div align="center">

<br>

![Metrics](/src/components/assets/QH_Metrics.png)

<br>

</div>

---

<div align="center">

<br>

![Query Comparison](./src/components/assets/QH_QueryComparison.png)

<br>

</div>

---

<div align="center">

<br>

![Redis vs PostgreSQL](./src/components/assets/QH_RedisVsPostgreSQL.png)

<br>

</div>

---

## QueryHawk Team

[![LinkedIn](https://img.shields.io/badge/LinkedIn-QueryHawk-313544?style=flat&logo=linkedin)](https://www.linkedin.com/company/queryhawk)

- **Bryan Cabanin** 🐒 [GitHub](https://github.com/Bryancabanin) | [LinkedIn](https://www.linkedin.com/in/bryan-cabanin/)
- **Meagan Lewis** 🦜 [GitHub](https://github.com/meaganlewis) | [LinkedIn](https://www.linkedin.com/in/meaganlewis/)
- **Peter Limburg** 🪶 [GitHub](https://github.com/Peter-Limburg) | [LinkedIn](https://www.linkedin.com/in/peterlimburg/)
- **Moe Na** 🐸 [GitHub](https://github.com/wmoew) | [LinkedIn](https://www.linkedin.com/in/mn1098/)

## Acknowledgements

We would like to thank the following resources that helped make QueryHawk possible:

- **[Material-UI](https://mui.com/)** - Used for designing UI components
- **[Excalidraw](https://excalidraw.com/)** - Used for designing wireframe and planning

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

#### [Return to top](#queryhawk)

---
