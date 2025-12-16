# Stringman web UI

### Run locally

The frontend server can be run in isolation but stil forwards requests for API endpoints to the control_plane

from this directory

    npm run dev

### Compile Typescript

    npm run build

### first time setup commands

(for reference)

Setup project

    npm create vite@latest nf-viz -- --template vanilla-ts

Install runtime dependencies

    npm install three protobufjs

Install dev dependencies (types and proto-cli tools)

    npm install --save-dev @types/three protobufjs-cli