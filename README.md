# SRE Project

A full-stack application demonstrating SRE practices with real-time data pipeline, observability, and monitoring capabilities.

## What This Project Is

This project is a monorepo implementing a complete SRE (Site Reliability Engineering) stack with:

- **TiDB Cluster**: Distributed MySQL-compatible database (PD, TiKV, TiDB)
- **Change Data Capture (CDC)**: Real-time database change streaming via TiCDC
- **Event Streaming**: Apache Kafka for event processing
- **API Service**: Node.js/Express REST API with authentication
- **Client Application**: React frontend
- **Consumer Service**: Node.js Kafka consumer for CDC events
- **Observability Stack**: Prometheus metrics + Grafana dashboards
- **Monitoring & Alerting**: Comprehensive runbook and alert definitions

## Architecture Overview

```
┌─────────┐     ┌─────────┐     ┌──────────┐     ┌──────────┐
│ Client  │────▶│   API   │────▶│   TiDB   │────▶│   TiKV   │
│ (React) │     │ (Node)  │     │          │     │ (Store)  │
└─────────┘     └─────────┘     └────┬─────┘     └────┬─────┘
      │              │                │                │
      │              │                │                │
      │              │                ▼                │
      │              │         ┌─────────────┐        │
      │              │         │     PD      │        │
      │              │         │ (Placement) │        │
      │              │         └─────────────┘        │
      │              │                │                │
      │              │                │                │
      │              │                ▼                │
      │              │         ┌─────────────┐        │
      │              │         │   TiCDC     │────────┘
      │              │         │  (CDC)      │
      │              │         └──────┬──────┘
      │              │                │
      │              │                ▼
      │              │         ┌─────────────┐
      │              │         │   Kafka     │
      │              │         │  (Events)   │
      │              │         └──────┬──────┘
      │              │                │
      │              │                ▼
      │              │         ┌─────────────┐
      │              └────────▶│  Consumer   │
      │                        │   (Node)    │
      └────────────────────────┴─────────────┘
                │
                ▼
      ┌─────────────────────┐
      │    Prometheus       │
      │   (Metrics)         │
      └──────────┬──────────┘
                 │
                 ▼
      ┌─────────────────────┐
      │     Grafana         │
      │   (Dashboards)      │
      └─────────────────────┘
```

**Data Flow:**
1. Client sends requests to API
2. API writes to TiDB cluster (PD + TiKV + TiDB)
3. TiCDC captures database changes in real-time
4. Changes are streamed to Kafka topic `tidb_cdc`
5. Consumer processes CDC events and logs them
6. Prometheus scrapes API metrics every 5 seconds
7. Grafana visualizes metrics and dashboards

## Prerequisites

- **Docker Desktop** (with Docker Compose v2)
- **Docker Compose** (included with Docker Desktop)

Verify installation:
```bash
docker --version
docker compose version
```

## Quick Start

### Option 1: Using the run script (Recommended)

```bash
./run.sh
```

### Option 2: Using Docker Compose directly

Start all services:
```bash
docker compose up -d --build
```

Stop and cleanup (removes volumes):
```bash
docker compose down -v
```

Stop without cleanup:
```bash
docker compose down
```

View service status:
```bash
docker compose ps
```

## Service URLs & Ports

| Service | URL | Credentials |
|---------|-----|-------------|
| **Client** | http://localhost:3000 | - |
| **API** | http://localhost:3001 | - |
| **API Metrics** | http://localhost:3001/api/metrics | - |
| **Prometheus** | http://localhost:9090 | - |
| **Grafana** | http://localhost:3002 | admin / admin |
| **TiDB** | localhost:4000 | root / (empty) |
| **Kafka** | localhost:9092 | - |
| **Zookeeper** | localhost:2181 | - |
| **TiCDC** | http://localhost:8300 | - |

## Docker Compose Services

### TiDB Cluster
- **pd** (Placement Driver): Cluster metadata and scheduling
- **tikv** (TiKV): Distributed key-value storage engine
- **tidb** (TiDB): MySQL-compatible database server (port 4000)

### Change Data Capture (CDC)
- **ticdc** (TiCDC): Captures database changes and streams to Kafka
- **cdc-init**: Initializes CDC changefeed on startup (runs once)

### Event Streaming
- **zookeeper**: Coordination service for Kafka
- **kafka**: Event streaming platform (port 9092)

### Application Services
- **api**: Node.js/Express REST API (port 3001)
- **client**: React frontend application (port 3000)
- **consumer**: Node.js Kafka consumer for CDC events

### Infrastructure
- **db-init**: Initializes TiDB database schema and seeds default user (runs once)

### Observability
- **prometheus**: Metrics collection and storage (port 9090)
- **grafana**: Metrics visualization and dashboards (port 3002)

## Database Schema

### Database: `sre_app`

Located in `db/init/` directory. Initialization scripts run automatically on startup via `db-init` service.

#### Initialization Scripts

1. **`01_create_database.sql`**: Creates the `sre_app` database
2. **`02_create_users_table.sql`**: Creates the `users` table
3. **`03_seed_default_user.sql`**: Seeds default admin user

#### Users Table Schema

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  token VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Columns:**
- `id`: Primary key (auto-increment)
- `email`: User email (unique, required)
- `password_hash`: bcrypt hashed password
- `token`: Authentication token (UUID)
- `created_at`: Record creation timestamp
- `updated_at`: Record update timestamp

#### Default User

- **Email**: `admin@example.com`
- **Password**: `admin123`

The password hash is pre-computed in `db/init/03_seed_default_user.sql`.

**Verify password hash:**
```bash
docker compose exec api node verify-password.js
```

**Regenerate password hash:**
```bash
docker compose exec api node -e "const bcrypt=require('bcrypt');bcrypt.hash('admin123',10).then(h=>console.log(h));"
```

## Change Data Capture (CDC)

### Changefeed Configuration

- **Changefeed ID**: `sre-cdc`
- **Kafka Topic**: `tidb_cdc`
- **Protocol**: `canal-json`
- **Init Script**: `cdc-init/init.sh`

### CDC Pipeline Flow

1. Database changes (INSERT/UPDATE/DELETE) occur in TiDB
2. TiCDC captures changes via TiKV
3. Changes are formatted as Canal-JSON messages
4. Messages are published to Kafka topic `tidb_cdc`
5. Consumer service processes messages and logs them

### Initialization

The `cdc-init` service automatically creates the changefeed on startup. The script:
1. Waits for TiCDC and Kafka to be healthy
2. Checks if changefeed `sre-cdc` already exists
3. Creates changefeed if it doesn't exist
4. Configures sink URI: `kafka://kafka:9092/tidb_cdc?kafka-version=2.4.0&partition-num=1&replication-factor=1&protocol=canal-json`

### Verification

Check changefeed status:
```bash
docker compose logs cdc-init
```

Should see: `"Create changefeed successfully!"` or `"Changefeed 'sre-cdc' already exists"`

## Verification

### 1. Check Service Status

```bash
docker compose ps
```

All services should show `Up` status. Health checks should pass for services with healthchecks.

### 2. Check API Metrics Endpoint

```bash
curl -s http://localhost:3001/api/metrics | head
```

Should output Prometheus metrics in text format, including:
- `http_request_duration_seconds` histogram
- Node.js process metrics (`process_*`)
- Node.js runtime metrics (`nodejs_*`)

### 3. Check Prometheus Targets

1. Open http://localhost:9090
2. Navigate to **Status → Targets**
3. Verify `api` target shows as **UP**

### 4. Database Operations (Insert/Update)

Connect to TiDB:
```bash
docker run --rm --network sre_project_default mysql:8.0 mysql -h tidb -P 4000 -u root -e "USE sre_app; DESCRIBE users;"
```

Insert a new user:
```bash
docker run --rm --network sre_project_default mysql:8.0 mysql -h tidb -P 4000 -u root -e "USE sre_app; INSERT INTO users (email, password_hash) VALUES ('test@example.com', '\$2b\$10\$test');"
```

Update a token:
```bash
docker run --rm --network sre_project_default mysql:8.0 mysql -h tidb -P 4000 -u root -e "USE sre_app; UPDATE users SET token = 'test-token-123' WHERE email = 'test@example.com';"
```

### 5. Read Kafka Messages

Read one message from the CDC topic:
```bash
docker compose exec kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic tidb_cdc \
  --from-beginning \
  --max-messages 1
```

### 6. Check Consumer Logs

Verify consumer received CDC events:
```bash
docker compose logs consumer | grep -A 5 '"action":"db_change"'
```

Should see JSON logs with:
- `"action": "db_change"`
- `"topic": "tidb_cdc"`
- `"payload"` containing the CDC event (INSERT/UPDATE/DELETE)

Example:
```json
{"timestamp":"2026-01-04T19:30:00.000Z","action":"db_change","topic":"tidb_cdc","payload":{"type":"INSERT","table":"users",...}}
```

## Observability

### Prometheus Metrics

The API exposes Prometheus-compatible metrics at `/api/metrics`.

#### Available Metrics

1. **HTTP Request Duration Histogram** (`http_request_duration_seconds`)
   - Labels: `method`, `route`, `status_code`
   - Tracks request latencies with buckets: 0.005s, 0.01s, 0.025s, 0.05s, 0.1s, 0.25s, 0.5s, 1s, 2.5s, 5s, 10s

2. **Default Node.js Metrics** (via `prom-client`)
   - `process_*`: Process-level metrics (CPU, memory, uptime)
   - `nodejs_*`: Node.js runtime metrics (heap, event loop, etc.)

#### Example PromQL Queries

**Requests Per Second (RPS):**
```promql
sum(rate(http_request_duration_seconds_count[1m]))
```

**P95 Request Latency:**
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[1m]))
```

**5xx Error Rate:**
```promql
rate(http_request_duration_seconds_count{status_code=~"5.."}[1m])
```

**Total Requests by Status Code:**
```promql
sum(rate(http_request_duration_seconds_count[1m])) by (status_code)
```

**Requests by Route:**
```promql
sum(rate(http_request_duration_seconds_count[1m])) by (route)
```

**Requests by HTTP Method:**
```promql
sum(rate(http_request_duration_seconds_count[1m])) by (method)
```

#### API Down Alert

Suggested alert condition:
```promql
up{job="api"} == 0
```

For detailed alert procedures and runbooks, see [RUNBOOK.md](RUNBOOK.md).

### Grafana Dashboards

Access Grafana at http://localhost:3002 (admin/admin).

#### First-Time Setup

1. Log in with admin/admin
2. Add Prometheus data source:
   - URL: `http://prometheus:9090`
   - Access: Server (default)
   - Click "Save & Test"

#### Example Dashboard Panels

**1. Requests Per Second (RPS)**
- Query: `sum(rate(http_request_duration_seconds_count[1m]))`
- Visualization: Graph
- Unit: ops/sec

**2. P95 Request Latency**
- Query: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[1m]))`
- Visualization: Graph
- Unit: seconds

**3. 5xx Error Rate**
- Query: `sum(rate(http_request_duration_seconds_count{status_code=~"5.."}[1m]))`
- Visualization: Graph
- Unit: ops/sec

**4. API Up Status**
- Query: `up{job="api"}`
- Visualization: Stat
- Thresholds: 0 (red), 1 (green)

### Alerting

Grafana built-in alerting can be configured with:
- **API Down**: `up{job="api"} == 0` for 1 minute
- **High Error Rate**: `rate(http_request_duration_seconds_count{status_code=~"5.."}[1m]) > 10` for 2 minutes

For detailed alert procedures, troubleshooting steps, and runbooks, see [RUNBOOK.md](RUNBOOK.md).

## Troubleshooting

### "Cannot find module prom-client"

**Symptom:** API fails to start with error: `Cannot find module 'prom-client'`

**Fix:**
1. Ensure `prom-client` is in `api/package.json` dependencies
2. Rebuild the API image:
   ```bash
   docker compose up -d --build api
   ```

**Verify:**
```bash
docker compose exec api npm list prom-client
```

### Kafka Leadership Election Messages

**Symptom:** Consumer logs show: `"The group coordinator is not available"` or `"There is no leader for this topic-partition"`

**Cause:** Transient Kafka leadership election during startup

**Fix:** This is normal and resolves automatically. Wait 10-30 seconds for Kafka to stabilize.

**Verify:**
```bash
docker compose logs kafka | grep -i "elected\|leader"
```

### TiCDC Cannot Resolve Kafka Hostname

**Symptom:** CDC init fails with: `connection refused` or `hostname not found`

**Fix:**
1. Verify Kafka service is running:
   ```bash
   docker compose ps kafka
   ```
2. Ensure services are on the same Docker network:
   ```bash
   docker network inspect sre_project_default | grep -A 5 kafka
   ```
3. Restart CDC init:
   ```bash
   docker compose up cdc-init
   ```

### Database Connection Issues

**Symptom:** API fails to connect to TiDB

**Fix:**
1. Check TiDB cluster status:
   ```bash
   docker compose ps pd tikv tidb
   ```
2. Verify TiDB health:
   ```bash
   curl http://localhost:3001/api/db-health
   ```
3. Check TiDB logs:
   ```bash
   docker compose logs tidb --tail=50
   ```

### Services Not Starting

**Symptom:** Services fail to start or exit immediately

**Fix:**
1. Check logs for the failing service:
   ```bash
   docker compose logs <service-name> --tail=50
   ```
2. Verify all dependencies are healthy:
   ```bash
   docker compose ps
   ```
3. Rebuild and restart:
   ```bash
   docker compose down
   docker compose up -d --build
   ```

### Metrics Not Appearing in Prometheus

**Symptom:** Prometheus shows no metrics or empty queries

**Fix:**
1. Verify API metrics endpoint:
   ```bash
   curl http://localhost:3001/api/metrics | head
   ```
2. Check Prometheus targets:
   - Open http://localhost:9090
   - Navigate to Status → Targets
   - Verify `api` target is UP
3. Check Prometheus config:
   ```bash
   docker compose exec prometheus cat /etc/prometheus/prometheus.yml
   ```

## Project Structure

```
SRE_Project/
├── api/                          # Node.js API service
│   ├── db.js                    # Database connection pool
│   ├── logger.js                # Log4js logger configuration
│   ├── metrics.js               # Prometheus metrics setup
│   ├── server.js                # Express server and routes
│   ├── verify-password.js       # Password hash verification utility
│   ├── middleware/
│   │   └── auth.js              # Authentication middleware
│   ├── package.json
│   └── Dockerfile
├── client/                       # React frontend
│   ├── src/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── consumer/                     # Kafka consumer service
│   ├── index.js                 # Consumer main logic
│   ├── logger.js                # Log4js logger configuration
│   ├── package.json
│   └── Dockerfile
├── db/                           # Database initialization
│   └── init/
│       ├── 01_create_database.sql
│       ├── 02_create_users_table.sql
│       ├── 03_seed_default_user.sql
│       └── init.sh              # DB init script
├── cdc-init/                     # CDC initialization
│   └── init.sh                  # CDC changefeed creation script
├── monitoring/                   # Observability configuration
│   └── prometheus.yml           # Prometheus scrape config
├── docker-compose.yml           # All services definition
├── run.sh                       # Quick start script
├── README.md                    # This file
└── RUNBOOK.md                   # Incident response runbook
```

## Additional Resources

- **Runbook**: See [RUNBOOK.md](RUNBOOK.md) for detailed incident response procedures
- **Prometheus Documentation**: https://prometheus.io/docs/
- **Grafana Documentation**: https://grafana.com/docs/
- **TiDB Documentation**: https://docs.pingcap.com/
- **Kafka Documentation**: https://kafka.apache.org/documentation/

## License

Made by Matan Meir.