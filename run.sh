#!/usr/bin/env bash
set -euo pipefail
docker compose up -d --build
docker compose ps
echo ""
echo "Client:      http://localhost:3000"
echo "API:         http://localhost:3001"
echo "Metrics:     http://localhost:3001/api/metrics"
echo "Prometheus:  http://localhost:9090"
echo "Grafana:     http://localhost:3002 (admin/admin)"

