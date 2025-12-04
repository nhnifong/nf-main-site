# Use the official image that comes with FFmpeg pre-installed
# This is critical for the Playroom HLS transcoding
FROM bluenviron/mediamtx:latest-ffmpeg

# Install gettext to allow us to use 'envsubst' for variable substitution
RUN apk add --no-cache gettext

# Copy our config as a TEMPLATE, not the final file
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


# Entrypoint:
# mediamtx yml configuration will not expand enviroment vars on it's own so we have to do it here, but not all of them,
# because there's an ffmpeg command in there
# 1. We tell envsubst to ONLY replace ${CONTROL_PLANE_API_URL}. 
#    If we don't specify this, it will delete $RTSP_PORT and $G1 in the ffmpeg command.
# 2. We output the result to /mediamtx.yml (the default config location)
# 3. run the binary
ENTRYPOINT ["/bin/sh", "-c", "envsubst '${CONTROL_PLANE_API_URL}' < /mediamtx.template.yml > /mediamtx.yml && /mediamtx"]