#!/bin/bash
set -e

echo "Waiting for TiDB to be ready..."
until mysql -h tidb -P 4000 -u root -e "SELECT 1" > /dev/null 2>&1; do
  echo "Waiting for TiDB..."
  sleep 2
done

echo "TiDB is ready. Executing SQL files..."

for file in /db-init/*.sql; do
  if [ -f "$file" ]; then
    echo "Executing $file"
    mysql -h tidb -P 4000 -u root < "$file"
  fi
done

echo "Database initialization complete!"

