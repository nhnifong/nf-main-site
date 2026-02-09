# Stringman web UI

### Setup for frontend

    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
    source ~/.bashrc
    nvm install 22
    nvm use 22
    cd nf-viz
    npm install
    python3 -m venv venv
    source venv/bin/activate
    pip install nf_robot
    npm run build

### Run locally

The frontend server can be run in isolation but stil forwards requests for API endpoints to the control_plane

from this directory

    npm run dev

### Generate protos and Compile Typescript

    npm run build

### first time setup commands

(for reference)

Setup project

    npm create vite@latest nf-viz -- --template vanilla-ts

Install runtime dependencies

    npm install three protobufjs

Install dev dependencies (types and proto-cli tools)

    npm install --save-dev @types/three protobufjs-cli