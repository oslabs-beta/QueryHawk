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

QueryHawk delivers comprehensive SQL database monitoring and visualization, empowering developers and database administrators to optimize performance and quickly identify bottlenecks. Built on industry-standard tools including Prometheus, Grafana, and PostgreSQL Exporter, all containerized with Docker for seamless deployment.

- ✅ Real-time SQL query analysis with millisecond-precision execution metrics
- ✅ Complete visibility into query execution plans with detailed buffer and cache statistics
- ✅ Interactive dashboards for visualizing database health and performance trends
- ✅ Query comparison tool to benchmark and optimize SQL performance
- ✅ Track query execution paths across entire application with distributed tracing

With QueryHawk's intuitive interface, teams can proactively manage database performance, reduce troubleshooting time, and make data-driven optimization decisions. The containerized architecture ensures easy deployment across development, staging, and production environments.

Gain insights into your SQL databases and enhance how your team approaches database performance optimization with QueryHawk.

## Features

## 🔍 Deep SQL Query Analysis

- Execution Plan Visibility: Analyze "EXPLAIN ANALYZE" results with detailed metrics on planning time, execution time, and resource usage.
- Cache Performance Metrics: Monitor cache hit ratios and buffer statistics to identify memory optimization opportunities.
- Query Comparison: Evaluate startup and total costs for queries to understand their impact on database resources.
- Secure Connection Testing: Connect to any PostgreSQL database with SSL support and connection validation.
- Query Performance Profiling: Test queries before deployment with comprehensive performance metrics.
- Historical Comparison: Store and compare query performance over time to track optimization progress.

## 📊 Real-time Performance Monitoring

Once connected, QueryHawk will display multiple metrics, including:

- Transaction rate
- Cache hit ratio
- Active connections
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

## 🛠️ Enterprise-Ready Architecture

- Docker-based Deployment: Quickly deploy the entire monitoring stack with Docker Compose.
- Secure Authentication: GitHub OAuth integration for secure user management.
- Dynamic Exporters: Automatically create and manage PostgreSQL exporters.

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
```

4. Start the services

```bash
docker-compose up -d
```

5. Access the application:

```
Frontend: http://localhost:5173
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
![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white)
![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-F57600?style=for-the-badge&logo=OpenTelemetry&logoColor=white)
![Grafana](https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-FFAA33?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![GitHub OAuth](https://img.shields.io/badge/GitHub_OAuth-181717?style=for-the-badge&logo=github&logoColor=white)
![.env](https://img.shields.io/badge/.env-ECD53F?style=for-the-badge&logoColor=white)
![Dockerode](https://img.shields.io/badge/Dockerode-blue?style=for-the-badge&logo=dockerode&logoColor=white)
![TS-Node](https://img.shields.io/badge/TSNode-blue?style=for-the-badge&logo=ts-node&logoColor=white)
![Nodemon](https://img.shields.io/badge/Nodemon-76D04B?style=for-the-badge&logo=nodemon&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)

</div>

---

## User Interface

<div align="center">

<img src="./src/components/assets/QH_Login.png" alt="Login" width=50% />

</div>

---

<div align="center">

![Dashboard](/src/components/assets/QH_Dashboard.png)

</div>

---

<div align="center">

![Query](/src/components/assets/QH_Query.png)

</div>

---

<div align="center">

![Metrics](/src/components/assets/QH_Metrics.png)

</div>

---

## Docker Tips

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

