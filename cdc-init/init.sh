#!/bin/bash
set -e

echo "Waiting for TiCDC to be ready..."
until curl -s http://ticdc:8300/status > /dev/null 2>&1; do
  echo "Waiting for TiCDC..."
  sleep 2
done

echo "Waiting for Kafka to be ready..."
until timeout 1 bash -c '</dev/tcp/kafka/9092' 2>/dev/null; do
  echo "Waiting for Kafka..."
  sleep 2
done

echo "TiCDC and Kafka are ready. Checking for existing changefeed..."

# Check if changefeed already exists (idempotent)
CHANGEFEED_LIST=$(/cdc cli changefeed list --server=http://ticdc:8300 2>/dev/null || echo "")
if echo "$CHANGEFEED_LIST" | grep -q "sre-cdc"; then
  echo "Changefeed 'sre-cdc' already exists. Skipping creation."
else
  echo "Creating changefeed 'sre-cdc'..."
  /cdc cli changefeed create \
    --server=http://ticdc:8300 \
    --changefeed-id="sre-cdc" \
    --sink-uri="kafka://kafka:9092/tidb_cdc?kafka-version=2.4.0&partition-num=1&replication-factor=1&protocol=canal-json" || {
    echo "Warning: Changefeed creation may have failed or already exists. Continuing..."
  }
  echo "Changefeed setup complete!"
fi

