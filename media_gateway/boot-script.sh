cd nf-main-site
git checkout main
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