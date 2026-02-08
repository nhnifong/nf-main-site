#!/bin/bash

# Configuration
BUCKET_NAME="neufangled-db-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/nhn/backups"
ENV_FILE="$(dirname "$0")/.env"

# Load environment variables from .env file if it exists
if [ -f "$ENV_FILE" ]; then
    # We export the variables so they are available to sub-processes (like docker exec)
    export $(grep -v '^#' "$ENV_FILE" | xargs)
else
    echo "Error: .env file not found at $ENV_FILE"
    exit 1
fi

# Ensure backup dir exists
mkdir -p "$BACKUP_DIR"

# Backup Production
# Using the variable from .env instead of hardcoding
echo "Backing up Production DB..."
docker exec -e PGPASSWORD="$PROD_DB_PASSWORD" postgres-prod pg_dump -U prod_user neufangled_prod > "$BACKUP_DIR/prod_$TIMESTAMP.sql"

# Backup Staging
echo "Backing up Staging DB..."
docker exec -e PGPASSWORD="$STAGING_DB_PASSWORD" postgres-staging pg_dump -U staging_user neufangled_staging > "$BACKUP_DIR/staging_$TIMESTAMP.sql"

# Upload to GCS
# The VM service account must have 'Storage Object Admin' on the bucket
gsutil cp "$BACKUP_DIR"/*_"$TIMESTAMP".sql "gs://$BUCKET_NAME/"

# Cleanup local files older than 7 days
find "$BACKUP_DIR" -type f -mtime +7 -name "*.sql" -delete

echo "Backup complete: prod_$TIMESTAMP.sql and staging_$TIMESTAMP.sql uploaded to gs://$BUCKET_NAME/"
