<div align="center">
  <img src="./src/components/assets/logo_queryhawk.png" alt="logo_queryhawk">
</div>

[![GuardQL Website](https://img.shields.io/badge/QueryHawk-color?style=flat&color=%23313544)](https://github.com/oslabs-beta/QueryHawk/)

<!-- [![GuardQL Plugin](https://img.shields.io/badge/Plugin-none?style=plastic&label=GuardQL&labelColor=%238A1877&color=%23E623C6)](https://www.npmjs.com/package/guardql-plugin?activeTab=readme)
[![GitHub Stars](https://img.shields.io/github/stars/oslabs-beta/GuardQL?style=plastic&labelColor=%231F1B2D&color=%23F2F2F2)](https://github.com/oslabs-beta/GuardQL/stargazers)
[![GitHub Watchers](https://img.shields.io/github/watchers/oslabs-beta/GuardQL?style=plastic&labelColor=%231F1B2D&color=%23F2F2F2)](https://github.com/oslabs-beta/GuardQL/watchers)
[![GitHub Forks](https://img.shields.io/github/forks/oslabs-beta/GuardQL?style=plastic&labelColor=%231F1B2D&color=%23F2F2F2)](https://github.com/oslabs-beta/GuardQL/network/members) -->

# QueryHawk

### Monitor and Analyze Your SQL Performance and Database Health

QueryHawk monitors and visualizes key SQL metrics to help users improve database and query performance. A central dashboard monitors database health. Containers ensure a consistent environment for all users.

<details>
  <summary>Table of Contents</summary>

- [Technologies](#technologies)
- [Introduction](#introduction)
- [Features](#features)
- [Initial Set-up and Installation](#initial-set-up-and-installation)
- [Contributions](#contributions)
- [QueryHawk Team](#queryhawk-team)
- [Contact Us](#contact-us)
- [License](#license)
- [Acknowledgements](#acknowledgements)

</details>
</div>

## Introduction

<!-- replace with paragraph about queryhawk -->

QueryHawk delivers comprehensive SQL database monitoring and visualization, empowering developers and database administrators to optimize performance and quickly identify bottlenecks. Built on industry-standard tools including Prometheus, Grafana, and PostgreSQL Exporter, all containerized with Docker for seamless deployment.

- ✅ Real-time SQL query analysis with millisecond-precision execution metrics
- ✅ Complete visibility into query execution plans with detailed buffer and cache statistics
- ✅ Interactive dashboards for visualizing database health and performance trends
- ✅ Query comparison tool to benchmark and optimize SQL performance

With QueryHawk's intuitive interface, teams can proactively manage database performance, reduce troubleshooting time, and make data-driven optimization decisions. The containerized architecture ensures easy deployment across development, staging, and production environments.

Gain insights into your SQL databases and enhance how your team approaches database performance optimization with QueryHawk.

## Features

## 🔍 Deep SQL Query Analysis

- Execution Plan Visibility: Analyze "EXPLAIN ANALYZE" results with detailed metrics on planning time, execution time, and resource usage.
- Cache Performance Metrics: Monitor cache hit ratios and buffer statistics to identify memory optimization opportunities.
- Query Cost Calculation: Evaluate startup and total costs for queries to understand their impact on database resources.

## 📊 Real-time Performance Monitoring

- Transaction Rate Tracking: Monitor database transaction throughput.
- Active Connection Management: Track concurrent connections and identify potential connection pool issues.
- Resource Utilization Metrics: Monitor disk I/O operations, shared blocks read/hit, and database work memory usage.

## 🔄 Query Testing Workbench

- Secure Connection Testing: Connect to any PostgreSQL database with SSL support and connection validation.
- Query Performance Profiling: Test queries before deployment with comprehensive performance metrics.
- Historical Comparison: Store and compare query performance over time to track optimization progress.

## 🛠️ Enterprise-Ready Architecture

- Docker-based Deployment: Quickly deploy the entire monitoring stack with Docker Compose.
- Secure Authentication: GitHub OAuth integration for secure user management.
- Dynamic Exporters: Automatically create and manage PostgreSQL exporters.

## Initial Set-up and Installation

#### 1️⃣ Sign Up

- Log in with Github to create an account to gain access to the QueryHawk Dashboard.

#### 2️⃣ Create & Select a Project

- Place your database URI in the field and connect your database.
-

#### 3️⃣ Install the NPM Package

- Add GuardQL to your application by running:
  `npm install guardql-plugin`

#### 4️⃣ Configure the Plugin in Apollo Server

- Integrate GuardQL into your Apollo Server setup by adding the plugin and providing:

  - Your project name
  - The API key from your dashboard
  - Any query execution time thresholds for slow query detection

  ```
     import { ApolloServer } from '@apollo/server';
     import { guardqlPlugin } from 'guardql-plugin';

     const server = new ApolloServer({
       typeDefs,
       resolvers,
       plugins: [
         guardqlPlugin({
           apiKey: 'your-api-key',
           projectName: 'your-project-name',
           slowQueryThreshold: 1000 // in milliseconds
         })
      ]
  });
  ```

#### 5️⃣ Run Your Application

- Start your server and begin making GraphQL requests as usual.

#### 6️⃣ Monitor Your API in Real-Time

- Access the GuardQL Dashboard to track:
  - Query execution times
  - GraphQL errors with stack traces
  - Performance trends and slow query alerts

## Contact Us

[![Static Badge](https://img.shields.io/badge/GuardQL%20%7C%20LinkedIn-none?style=for-the-badge&color=%230A66C2)
](https://linkedin.com/company/guardql)

Alternative linkedin badge
[![LinkedIn](https://img.shields.io/badge/LinkedIn-GuardQL-blue?style=flat&logo=linkedin)](https://www.linkedin.com/company/guardql/)

### QueryHawk Team

Bryan Cabanin

![Static Badge](https://img.shields.io/badge/Henry%20%E2%86%92-none?style=flat-square&logoColor=white&logoSize=auto&label=Nico&labelColor=%23E623C6&color=%238A1877) [![Static Badge](https://img.shields.io/badge/%40Nico21221-Dark%20Charcoal?style=flat-square&logo=Github&logoColor=white&logoSize=auto&color=%23333333)](https://github.com/Nico21221) [![LinkedIn](https://img.shields.io/badge/linkedin/in/nico_henry-%230077B5.svg?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/nico-henry/)

Meagan Lewis

![Static Badge](https://img.shields.io/badge/Rodriguez%20Llivipuma%20%E2%86%92-none?style=flat-square&logoColor=white&logoSize=auto&label=Cindy&labelColor=%23E623C6&color=%238A1877) [![Static Badge](https://img.shields.io/badge/%40csrl23-none?style=flat-square&logo=Github&logoColor=white&logoSize=auto&color=%23333333)](https://github.com/csrl23) [![LinkedIn](https://img.shields.io/badge/linkedin/in/cindy_rod_lliv-%230077B5.svg?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/cindy-rod-lliv/)

Peter Limburg

![Static Badge](https://img.shields.io/badge/Shepherd%20%E2%86%92-none?style=flat-square&logoColor=white&logoSize=auto&label=Sienna&labelColor=%23E623C6&color=%238A1877) [![Static Badge](https://img.shields.io/badge/%40codecaptaincode-none?style=flat-square&logo=Github&logoColor=white&logoSize=auto&color=%23333333)](https://github.com/codecaptaincode) [![LinkedIn](https://img.shields.io/badge/linkedin/in/sienna_shepherd-%230077B5.svg?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/peterlimburg/)

Moe Na

![Static Badge](https://img.shields.io/badge/Na%20%E2%86%92-none?style=flat-square&logoColor=white&logoSize=auto&label=Moe&labelColor=%23E623C6&color=%238A1877) [![Static Badge](https://img.shields.io/badge/%40MoeNa-none?style=flat-square&logo=Github&logoColor=white&logoSize=auto&color=%23333333)](https://github.com/sabrinaira) [![LinkedIn](https://img.shields.io/badge/linkedin/in/Moe_Na-%230077B5.svg?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/sabrinaira)

- **Bryan Cabanin 🐒** - [@Bryancabanin](https://github.com/Bryancabanin)
- **Meagan Lewis 🦜** - [@meaganlewis](https://github.com/meaganlewis)
- **Peter Limburg 🪶** - [@Peter-Limburg](https://github.com/Peter-Limburg)
- **Moe Na 🐸** - [@wmoew](https://github.com/wmoew)

## Contributors

- Bryan Cabanin: [GitHub](https://github.com/Bryancabanin) | [LinkedIn](https://www.linkedin.com/in/bryan-cabanin/)
- Meagan Lewis: [GitHub](https://github.com/meaganlewis) | [LinkedIn](https://www.linkedin.com/in/meaganlewis/)
- Peter Limburg: [GitHub](https://github.com/Peter-Limburg) | [LinkedIn](https://www.linkedin.com/in/peterlimburg/)
- Moe Na: [GitHub](https://github.com/wmoew) | [LinkedIn](https://www.linkedin.com/in/mn1098/)

## License

Distributed under the [MIT](LICENSE.txt) License.

## Acknowledgements

We would like to thank the following resources that helped make QueryHawk possible:

- **[Material-UI](https://mui.com/)** - Used for designing UI components
- **[Excalidraw](https://excalidraw.com/)** - Used for designing wireframe and planning
- **[OpenTelemetry Community](https://opentelemetry.io/community/)**
- **[Grafana Labs](https://grafana.com/)**
- **[PostgreSQL Community](https://www.postgresql.org/community/)**
- **[Supabase Team](https://supabase.com/)**

#### Return to [top](#queryhawk)

<div align="center">

<img src="./src/assets/logo_queryhawk.svg" alt="queryhawk logo" height="150"/>

<h1>QueryHawk</h1>

<p>
<strong>Get a hawk-eyed look at your query performance.</strong>
</p>

</div>

---

## Technologies

<div align="center">

![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![NPM](https://img.shields.io/badge/NPM-%23CB3837.svg?style=for-the-badge&logo=npm&logoColor=white)
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![MUI](https://img.shields.io/badge/MUI-%230081CB.svg?style=for-the-badge&logo=mui&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)
![React Hook Form](https://img.shields.io/badge/React%20Hook%20Form-%23EC5990.svg?style=for-the-badge&logo=reacthookform&logoColor=white)

#### Written With

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![HTML](https://img.shields.io/badge/HTML-e85a2e?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-2e35e8?style=for-the-badge&logo=css3&logoColor=white)

#### Frontend

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![MUI](https://img.shields.io/badge/MUI-007FFF?style=for-the-badge&logo=mui&logoColor=white)
![Lucide](https://img.shields.io/badge/Lucide-f2695a?style=for-the-badge&logo=lucide&logoColor=black)

#### Backend

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![CORS](https://img.shields.io/badge/CORS-000000?style=for-the-badge&logoColor=white)

#### Database

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

#### DevOps & Infrastructure

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![AWS EKS](https://img.shields.io/badge/AWS_EKS-FF9900?style=for-the-badge&logo=amazon-eks&logoColor=white)

#### Monitoring

![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white)
![PromQL](https://img.shields.io/badge/PromQL-F57600?style=for-the-badge&logo=prometheus&logoColor=white)

#### Auth & Security

![JWT](https://img.shields.io/badge/JWT-FFAA33?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Passport](https://img.shields.io/badge/Passport-34E27A?style=for-the-badge&logo=passport&logoColor=white)
![GitHub OAuth](https://img.shields.io/badge/GitHub_OAuth-181717?style=for-the-badge&logo=github&logoColor=white)
![bcrypt](https://img.shields.io/badge/bcrypt-003A70?style=for-the-badge&logoColor=white)

#### Tools & CI/CD

![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)
![Shell Script](https://img.shields.io/badge/Shell_Script-121011?style=for-the-badge&logo=gnu-bash&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![TS-Node](https://img.shields.io/badge/TSNode-blue?style=for-the-badge&logo=ts-node&logoColor=white)
![Nodemon](https://img.shields.io/badge/Nodemon-76D04B?style=for-the-badge&logo=nodemon&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)

</div>

---

## Demo

<div align="center">

![Login](/src/components/assets/QH_Login.png)

</div>
<div align="center">

![Dashboard](/src/components/assets/QH_Dashboard.png)

</div>
<div align="center">

![Query](/src/components/assets/QH_Query.png)

</div>
<div align="center">

![Metrics](/src/components/assets/QH_Metrics.png)

</div>
<!--

gif link template:

![Bottlenetes Demo](https://user-images.githubusercontent.com/xxx/bottlenetes-demo.gif)

-->

---

## Features

- **Real-time Metrics** ⏱: Monitor the CPU and memory usage of each pod in real time.
- **K8s Resource Management** : Debug, manage, scale, and remove workloads from a convenient UI.
- **Bottlenecks Identification** : Track latency and service mesh metrics to quickly detect inefficiencies.
- **Security & Permissions** : Manage user access for your dashboard.
- **AI Integration** : Enjoy automatic resource allocation recommendations powered by LLMs based on historical data.

---

## Getting Started

### Prerequisites

1.  **Docker Desktop**

- [Download Docker Desktop](https://www.docker.com/products/docker-desktop) and install.
- Ensure it’s running in the background.

2.  **Node.js**

- Install the [latest LTS version](https://nodejs.org/en/download) of Node.js.

3. **Homebrew (for macOS)**

- Install [Homebrew](https://brew.sh/)

### Project Setup

1.  **Clone this repository**
    In your terminal, run:

```bash
git clone https://github.com/oslabs-beta/BottleNetes.git
cd bottlenetes
```

2. **Create .env in the root directory**

```
# Example fields (please update with your real values for each one)
POSTGRES_URI=postgresql://username:password@hostname:port/database
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
JWT_SECRET=your_jwt_secret
SUPABASE_URI=your_supabase_uri

```

3. **Run the Quickstart script**

A quickstart script is provided for your convenience, automating much of the setup process (you can also follow the manual setup instructions [here](markdown/manual-setup-instruction.md)).

- Make the quickstart script executable by running in your terminal:

```bash
chmod +x QUICKSTART.sh
```

- Execute the script by running:

```bash
./QUICKSTART.sh
```

If you are running this script for the first time, select "n" when prompted about skipping dependency installations, so everything is installed correctly.

Towards the end, you’ll be asked if you want to generate fake traffic to test latency for the demo app. Choose "y" if you want traffic logs, or "n" to skip.

4. **Access Bottlenetes**

Once the script finishes, it will:

- Install needed dependencies.
- Spin up a local Kubernetes cluster.
- Deploy a demo application.
- Launch your default browser to open both the demo app and the Bottlenetes UI.

If your browser doesn’t open automatically, navigate to http://localhost:4173/ to begin using Bottlenetes!

### Environment Variables

A quick overview of the fields in your .env.production file:

- SUPABASE_URI
  A PostgreSQL connection string provided by Supabase.

- SUPABASE_PASSWORD
  The database password for your Supabase PostgreSQL instance.

- SUPABASE_ANON_KEY
  The anon/public key from Supabase for client-side APIs.

- NODE_ENV
  Typically set to "production" for a deployed environment.

- GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET
  OAuth credentials for GitHub login and callbacks.

- GITHUB_REDIRECT_URI
  URL to redirect to after successful GitHub authentication.

- FRONTEND_URL
  The URL hosting your frontend, e.g., http://localhost:4173/.

## License

Distributed under the MIT License. Please see `LICENSE` for more information.

## Connect with Us

<div align="center">

<!-- link to linkedIN DO WE WANT A LINKEDIN PROFILE FOR QUERYHAWK -->

<a href="https://www.linkedin.com/company/bottlenetes">![LinkedIn](https://img.shields.io/badge/LinkedIn-B9D9EB)</a>

<!-- link to productHunt -->

<a href="https://www.producthunt.com/products/bottlenetes">![ProductHunt](https://img.shields.io/badge/productHunt-B9D9EB)</a>

</div>

<h1 align="center">Hi 👋, I'm QueryHawk</h1>
<h3 align="center">A monitoring and visualization tool.</h3>

<p align="left"> <img src="https://komarev.com/ghpvc/?username=meaganlewis&label=Profile%20views&color=0e75b6&style=flat" alt="meaganlewis" /> </p>

<h3 align="left">Connect with me:</h3>
<p align="left">
<a href="https://linkedin.com/in/meaganlewis" target="blank"><img align="center" src="https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/linked-in-alt.svg" alt="meaganlewis" height="30" width="40" /></a>
</p>

<h3 align="left">Languages and Tools:</h3>
<p align="left"> <a href="https://www.w3schools.com/css/" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/css3/css3-original-wordmark.svg" alt="css3" width="40" height="40"/> </a> <a href="https://www.cypress.io" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/simple-icons/simple-icons/6e46ec1fc23b60c8fd0d2f2ff46db82e16dbd75f/icons/cypress.svg" alt="cypress" width="40" height="40"/> </a> <a href="https://www.docker.com/" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/docker/docker-original-wordmark.svg" alt="docker" width="40" height="40"/> </a> <a href="https://expressjs.com" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/express/express-original-wordmark.svg" alt="express" width="40" height="40"/> </a> <a href="https://git-scm.com/" target="_blank" rel="noreferrer"> <img src="https://www.vectorlogo.zone/logos/git-scm/git-scm-icon.svg" alt="git" width="40" height="40"/> </a> <a href="https://grafana.com" target="_blank" rel="noreferrer"> <img src="https://www.vectorlogo.zone/logos/grafana/grafana-icon.svg" alt="grafana" width="40" height="40"/> </a> <a href="https://www.w3.org/html/" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/html5/html5-original-wordmark.svg" alt="html5" width="40" height="40"/> </a> <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/javascript/javascript-original.svg" alt="javascript" width="40" height="40"/> </a> <a href="https://nodejs.org" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nodejs/nodejs-original-wordmark.svg" alt="nodejs" width="40" height="40"/> </a> <a href="https://www.postgresql.org" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/postgresql/postgresql-original-wordmark.svg" alt="postgresql" width="40" height="40"/> </a> <a href="https://postman.com" target="_blank" rel="noreferrer"> <img src="https://www.vectorlogo.zone/logos/getpostman/getpostman-icon.svg" alt="postman" width="40" height="40"/> </a> <a href="https://reactjs.org/" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original-wordmark.svg" alt="react" width="40" height="40"/> </a> <a href="https://www.typescriptlang.org/" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/typescript/typescript-original.svg" alt="typescript" width="40" height="40"/> </a> </p>

<!-- from claude -->

<div align="center">
  <img src="./src/assets/logo_queryhawk.jpg" width="50%" alt="logo_queryhawk">
</div>

# QueryHawk

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-enabled-success)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-supported-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-powered-blue)

QueryHawk is a real-time database performance monitoring and visualization tool that integrates OpenTelemetry with Grafana dashboards, providing developers with instant insights into their database performance metrics.

## 🚀 Features

- Real-time PostgreSQL performance metrics monitoring
- Custom Grafana dashboards for comprehensive visualization
- OpenTelemetry integration for standardized observability
- Automated alerting and notification system
- Historical performance data analysis
- Custom metric definition support
- GitHub OAuth integration for secure access
- Jaeger integration for distributed tracing

## 🛠️ Tech Stack

### Backend

- Node.js
- Express
- TypeScript
- PostgreSQL
- Supabase
- Prometheus
- OpenTelemetry
- Jaeger
- Docker
- Nodemon

### Frontend

- React
- Vite
- Material-UI (MUI)
- React Router
- TypeScript
- HTML/CSS

### Development & Design

- ESLint
- Git
- Excalidraw
- Lucid Chart

## 📊 Architecture

The application consists of three main components:

1. **Collector**: OpenTelemetry collector that captures PostgreSQL metrics
2. **Processor**: Node.js/Express backend for data processing and aggregation
3. **Visualizer**: React-based frontend with Grafana integration for metric visualization

## 🔧 Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- PostgreSQL (v14 or higher)
- Grafana (v9 or higher)
- OpenTelemetry Collector
- GitHub account (for OAuth)

## 💻 Installation

1. Clone the repository:

```bash
git clone [repository-url]
cd queryhawk
```

2. Install dependencies:

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

3. Configure environment variables:

```bash
# Backend configuration
cp server/.env.example server/.env

# Frontend configuration
cp client/.env.example client/.env
```

4. Start the services:

```bash
docker-compose up -d
```

5. Access the application:

```
Frontend: http://localhost:5173
Grafana: http://localhost:3000
Jaeger: http://localhost:16686
```

## ⚙️ Configuration

### Database Configuration

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=queryhawk
```

### OpenTelemetry Setup

```yaml
receivers:
  postgresql:
    endpoint: localhost:5432
    collection_interval: 10s

processors:
  batch:
    timeout: 10s

exporters:
  prometheus:
    endpoint: '0.0.0.0:8889'
```

### GitHub OAuth

```env
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
```

## 📈 Usage

1. **Authentication**

   - Log in using GitHub OAuth
   - Set up team access and permissions

2. **Dashboard Navigation**

   - Access pre-built PostgreSQL performance dashboards
   - Create custom visualizations
   - Configure metric thresholds

3. **Monitoring**

   - View real-time query performance
   - Analyze query execution plans
   - Track connection pools
   - Monitor resource utilization

4. **Alerting**
   - Set up performance thresholds
   - Configure notification channels
   - Create custom alert rules

## 🔍 Metrics Collected

- Query execution time
- Query throughput
- Connection pool statistics
- Cache hit ratios
- Table and index statistics
- Transaction rates
- Resource utilization (CPU, Memory, I/O)
- Custom metrics support

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to your fork
5. Submit a pull request

## 👥 Team

- [Team Member 1] - Project Lead
- [Team Member 2] - Backend Developer
- [Team Member 3] - Frontend Developer
- [Team Member 4] - DevOps Engineer

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:

- Open an issue: [repository-url/issues]
- Contact the team: [contact-information]
- Documentation: [docs-url]

Made a db file. If you want to use pool make sure to import properly.

Ideally you should import this into the models file as the logic is managed there. While the controller manages the handling of requests.

import { pool } from '../db/db.ts';

Models Folder (Database Interaction)
Controller Folder (Request Handling)
Routes Folder (Mapping Endpoints to controllers)

To get access to our types folder from controller, or models we need to import it properly:
import { (name of type or interface you are trying to import) } from '../../types/types.ts';

Docker

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

## Local Development Setup

1. Clone the repository

```bash
git clone https://github.com/oslabs-beta/QueryHawk.git
cd queryhawk
```
