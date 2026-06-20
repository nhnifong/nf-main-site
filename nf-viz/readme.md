# Stringman web UI

### Setup for frontend

Once (idempotent though)

    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
    source ~/.bashrc
    nvm install 22
    nvm use 22
    cd nf-viz
    npm install --legacy-peer-deps
    python3 -m venv venv
    source venv/bin/activate
    pip install nf_robot

Each build

    source venv/bin/activate
    pip install --upgrade nf_robot
    npm run build

If you need to build against protos that have not been comitted to pypi yet, then install an editable version of the nf_robot module in the venv where you run `npm run build` the only reason for that venv is to extract the protos.

### Run locally

The frontend server can be run in isolation but stil forwards requests for API endpoints to the control_plane

from this directory

    npm run dev

### Generate protos and Compile Typescript

    npm run build

### Generate AV1 versions of videos

The video elements on the page list an AV1-encoded `_av1.mp4` source first (smaller,
better quality) and fall back to the plain H.264 `.mp4` for browsers that can't decode
AV1. Run `make_av1.sh` from this directory to (re)generate the `_av1.mp4` companions in
a batch. It defaults to the `public/assets` directory where the source `.mp4` files live:

    ./make_av1.sh

Already-converted `_av1.mp4` files are skipped, so it's safe to re-run. Set `CRF` to
trade quality for size (lower = higher quality / larger), e.g. `CRF=34 ./make_av1.sh`.
Upload the resulting `_av1.mp4` files next to the existing `.mp4` files in the asset
bucket. See the comments at the top of the script for encoder details.

### first time setup commands

(for reference)

Setup project

    npm create vite@latest nf-viz -- --template vanilla-ts

Install runtime dependencies

    npm install three protobufjs

Install dev dependencies (types and proto-cli tools)

    npm install --save-dev @types/three protobufjs-cli