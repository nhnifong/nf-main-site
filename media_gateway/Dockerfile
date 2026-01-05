# Use the official image that comes with FFmpeg pre-installed
# This is critical for the Playroom HLS transcoding
FROM bluenviron/mediamtx:latest-ffmpeg

# Install gettext to allow us to use 'envsubst' for variable substitution
RUN apk add --no-cache gettext

# Copy mediamtx config as a template
COPY mediamtx.yml /mediamtx.template.yml

# Create a directory to hold the HLS segments
# This matches the output path in your mediamtx.yml: /hls_storage/stream.m3u8
RUN mkdir -p /hls_storage

# Expose the necessary ports
# 8554: RTSP (Internal FFmpeg use)
# 1935: RTMP (Robot Publish)
# 8888: HLS (Spectator View)
# 8889: WebRTC (Driver View)
EXPOSE 8554 1935 8888 8889
EXPOSE 8189/udp

# perform substitution in the template file at runtime.
ENTRYPOINT ["/bin/sh", "-c", "envsubst '$CONTROL_PLANE_API_URL $WEBRTC_USE_HTTPS $WEBRTC_ADDITIONAL_HOSTS' < /mediamtx.template.yml > /mediamtx.yml && cat /mediamtx.yml && /mediamtx"]