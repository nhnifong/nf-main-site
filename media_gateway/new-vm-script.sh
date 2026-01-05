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

./boot-script.sh