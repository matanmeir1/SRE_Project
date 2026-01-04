# SRE_Project

## Getting Started

Start all services with a single command:

```bash
docker-compose up --build
```

## Services

- **API**: http://localhost:3001
- **Client**: http://localhost:3000
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3002 (admin/admin)
- **TiDB**: localhost:4000
- **Kafka**: localhost:9092

## Database Setup

### Default User Credentials
- **Email**: `admin@example.com`
- **Password**: `admin123`

### Verifying Password Hash

To verify that the password hash in the seed file is correct, run:

```bash
docker-compose exec api node verify-password.js
```

This will verify that the hash in `db/init/03_seed_default_user.sql` correctly matches the password `admin123`. If it's incorrect, the script will generate a new hash that you can use to update the seed file.

### Regenerating Password Hash

If you need to regenerate the password hash:

```bash
docker-compose exec api node -e "const bcrypt=require('bcrypt');bcrypt.hash('admin123',10).then(h=>console.log(h));"
```

Then update `db/init/03_seed_default_user.sql` with the new hash.

## Observability

### Prometheus

Prometheus is available at http://localhost:9090 and scrapes metrics from the API every 5 seconds.

**Access:**
- Web UI: http://localhost:9090
- Query API: http://localhost:9090/api/v1/query

**Configuration:**
- Config file: `monitoring/prometheus.yml`
- Scrape interval: 5 seconds
- Target: `api:3001/api/metrics`

### Grafana

Grafana is available at http://localhost:3002 with default credentials:
- **Username**: `admin`
- **Password**: `admin`

**First-time Setup:**
1. Log in with admin/admin
2. Add Prometheus data source:
   - URL: `http://prometheus:9090`
   - Access: Server (default)
   - Click "Save & Test"

### Metrics Endpoint

The API exposes Prometheus-compatible metrics at `/api/metrics`:

```bash
curl http://localhost:3001/api/metrics
```

**Available Metrics:**
- `http_request_duration_seconds` - Histogram of HTTP request durations
  - Labels: `method`, `route`, `status_code`
- `process_*` - Default Node.js process metrics (CPU, memory, etc.)
- `nodejs_*` - Default Node.js runtime metrics

### Example PromQL Queries

#### Requests Per Second (RPS)
```promql
rate(http_request_duration_seconds_count[1m])
```

#### P95 Request Latency
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[1m]))
```

#### 5xx Error Rate
```promql
rate(http_request_duration_seconds_count{status_code=~"5.."}[1m])
```

#### Total Requests by Status Code
```promql
sum(rate(http_request_duration_seconds_count[1m])) by (status_code)
```

#### Requests by Route
```promql
sum(rate(http_request_duration_seconds_count[1m])) by (route)
```

### Example Grafana Dashboard Panels

#### Requests Per Second (RPS)
- **Query**: `sum(rate(http_request_duration_seconds_count[1m]))`
- **Visualization**: Graph
- **Unit**: ops/sec

#### P95 Request Latency
- **Query**: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[1m]))`
- **Visualization**: Graph
- **Unit**: seconds

#### 5xx Error Rate
- **Query**: `sum(rate(http_request_duration_seconds_count{status_code=~"5.."}[1m]))`
- **Visualization**: Graph
- **Unit**: ops/sec

#### API Up Status
- **Query**: `up{job="api"}`
- **Visualization**: Stat
- **Thresholds**: 0 (red), 1 (green)

### Alerts

Grafana built-in alerting is configured with the following conditions:

1. **API Down**
   - Condition: `up{job="api"} == 0` for 1 minute
   - See [RUNBOOK.md](RUNBOOK.md) for troubleshooting

2. **High Error Rate**
   - Condition: `rate(http_request_duration_seconds_count{status_code=~"5.."}[1m]) > 10` for 2 minutes
   - See [RUNBOOK.md](RUNBOOK.md) for troubleshooting

For detailed alert procedures and troubleshooting steps, see [RUNBOOK.md](RUNBOOK.md).