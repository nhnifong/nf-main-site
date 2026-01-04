#!/bin/bash

# startup script meant to run on VM (outside docker)

# Exit immediately if a command exits with a non-zero status.
set -e

# Install Docker
# Update package list
sudo apt-get update -y

# Install packages to allow apt to use a repository over HTTPS
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up the stable repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add current user to the docker group (optional, but good for interactive use)
sudo usermod -aG docker "$USER"

# build and run the MediaMTX container
git clone https://github.com/nhnifong/nf-main-site.git
cd nf-main-site
docker build -t media-gateway ./media_gateway

# Run the MediaMTX container, mapping the necessary ports
docker run -d \
    --name media-mtx \
    --restart=always \
    -p 8554:8554 \
    -p 1935:1935 \
    -p 8888:8888 \
    -p 8889:8889 \
    -p 8189:8189/udp \
    -e CONTROL_PLANE_API_URL="https://nf-site-monolith-staging-690802609278.us-east1.run.app" \
    media-gateway
