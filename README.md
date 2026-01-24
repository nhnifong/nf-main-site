# nf-main-site
Homepage for Neufangled Robotics

## Run locally

Run all components (control_plane, media_gateway, redis) at once with docker compose

```
docker compose up --build
```

### Run media gateway in isolation

build
```
docker build -t media-gateway ./media_gateway
```

run media gateway pointing to local control plane (replace 172.17.0.1 with your Docker Bridge IP if needed)
```
docker run --rm -it \
  -p 8554:8554 \
  -p 1935:1935 \
  -p 8888:8888 \
  -p 8889:8889 \
  -e CONTROL_PLANE_API_URL="http://172.17.0.1:8080" \
  media-gateway
```