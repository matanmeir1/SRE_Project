# Runbook - SRE Project Alerts

This runbook contains procedures for responding to alerts and incidents.

## Alert: API Down

### What the Alert Means
The API service is not responding or Prometheus cannot scrape metrics from the API endpoint (`/api/metrics`).

### Alert Condition
- **Grafana Alert**: `up{job="api"} == 0` for 1 minute
- **Description**: Prometheus target `api` is down

### How to Verify the Issue

1. **Check if API container is running:**
   ```bash
   docker-compose ps api
   ```
   Expected: Container should show `Up` status

2. **Check API logs:**
   ```bash
   docker-compose logs api --tail=50
   ```
   Look for errors, crashes, or connection issues

3. **Test API health endpoint:**
   ```bash
   curl http://localhost:3001/api/health
   ```
   Expected: `{"status":"ok","message":"API is running"}`

4. **Check metrics endpoint:**
   ```bash
   curl http://localhost:3001/api/metrics
   ```
   Expected: Prometheus metrics in text format

5. **Check Prometheus targets:**
   - Open Prometheus UI: http://localhost:9090
   - Navigate to Status → Targets
   - Check if `api` target shows as `UP`

### Common Root Causes

1. **Container crashed or stopped**
   - Check container logs for stack traces
   - Verify Docker resources (memory, CPU)

2. **Database connection failure**
   - Check TiDB service: `docker-compose ps tidb`
   - Test DB connection: `curl http://localhost:3001/api/db-health`
   - Check database logs: `docker-compose logs tidb --tail=50`

3. **Application error**
   - Review application logs for uncaught exceptions
   - Check for dependency issues (missing npm packages)

4. **Network issues**
   - Verify Docker network: `docker network inspect sre_project_default`
   - Ensure API can reach database and other services

5. **Port conflicts**
   - Check if port 3001 is already in use: `lsof -i :3001`
   - Verify no other service is using the same port

### Basic Mitigation Steps

1. **Restart the API service:**
   ```bash
   docker-compose restart api
   ```

2. **If restart fails, rebuild and restart:**
   ```bash
   docker-compose up -d --build api
   ```

3. **Check service dependencies:**
   ```bash
   docker-compose ps
   ```
   Ensure TiDB, PD, and TiKV are all healthy

4. **Full stack restart (if needed):**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

5. **Monitor recovery:**
   - Watch Prometheus target status
   - Check API logs: `docker-compose logs -f api`
   - Verify metrics are being collected

## Alert: High Error Rate (5xx Responses)

### What the Alert Means
The API is experiencing a high rate of server errors (HTTP 5xx status codes), indicating application failures.

### Alert Condition
- **Grafana Alert**: Rate of `http_request_duration_seconds_count{status_code=~"5.."}` exceeds threshold
- **Example**: More than 10 5xx errors per minute for 2 minutes

### How to Verify the Issue

1. **Check error rate in Grafana:**
   - Query: `rate(http_request_duration_seconds_count{status_code=~"5.."}[1m])`
   - View in Grafana dashboard

2. **Check API logs for errors:**
   ```bash
   docker-compose logs api --tail=100 | grep -i error
   ```

3. **Check recent error responses:**
   ```bash
   docker-compose logs api --tail=100 | grep "status.*5"
   ```

4. **Test API endpoints:**
   ```bash
   # Health check
   curl http://localhost:3001/api/health
   
   # Database health
   curl http://localhost:3001/api/db-health
   
   # Login (use valid credentials)
   curl -X POST http://localhost:3001/api/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"admin123"}'
   ```

### Common Root Causes

1. **Database connection issues**
   - TiDB service down or unreachable
   - Connection pool exhaustion
   - Database query timeouts

2. **Application bugs**
   - Unhandled exceptions
   - Null pointer errors
   - Invalid data processing

3. **Resource exhaustion**
   - Memory limits exceeded
   - CPU throttling
   - Too many concurrent requests

4. **Invalid requests**
   - Malformed JSON payloads
   - Missing required fields
   - Authentication failures (though these are 4xx, not 5xx)

5. **Service dependencies down**
   - External service failures
   - Network partitions

### Basic Mitigation Steps

1. **Check database connectivity:**
   ```bash
   docker-compose ps tidb pd tikv
   docker-compose logs tidb --tail=50
   ```

2. **Review error patterns in logs:**
   ```bash
   docker-compose logs api --tail=200 | grep -A 10 -i "error\|exception"
   ```

3. **Check system resources:**
   ```bash
   docker stats
   ```
   Look for containers using high CPU or memory

4. **Restart API service (if needed):**
   ```bash
   docker-compose restart api
   ```

5. **Scale or optimize (if persistent):**
   - Review slow database queries
   - Check for memory leaks
   - Consider increasing container resources

6. **Monitor recovery:**
   - Watch error rate in Grafana
   - Verify error rate decreases after mitigation
   - Check logs for new errors

## General Troubleshooting

### Accessing Services

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3002 (admin/admin)
- **API**: http://localhost:3001
- **API Metrics**: http://localhost:3001/api/metrics

### Useful Commands

```bash
# View all service status
docker-compose ps

# View logs for a service
docker-compose logs -f <service-name>

# Restart a service
docker-compose restart <service-name>

# Rebuild and restart
docker-compose up -d --build <service-name>

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets
```

### Escalation

If issues persist after following mitigation steps:
1. Review full application logs
2. Check system resource usage
3. Review recent code changes
4. Consider rolling back to a previous version
5. Contact development team if issue is application-related

