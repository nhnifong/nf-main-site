#!/bin/bash

# Navigate to the project directory
cd /home/nhn/nf-main-site/media_gateway

# Build the latest Media Gateway image.
# We build it here to ensure any changes to the Dockerfile or mediamtx.yml are applied.
docker-compose build media-mtx

# Start the entire stack in detached mode.
docker-compose up -d