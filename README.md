# nf-main-site
Homepage for Neufangled Robotics

## Run locally

### Control plane

Run control plane in container
```
docker compose up --build
```

Or run individual components seperately
```
sudo service redis-server start
uvicorn app.main:app --host=0.0.0.0 --port=8080
```

### Media gateway

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