# Use the official image that comes with FFmpeg pre-installed
# This is critical for the Playroom HLS transcoding
FROM bluenviron/mediamtx:latest-ffmpeg

# Copy our custom configuration to the root (default location)
COPY mediamtx.yml /mediamtx.yml

# Create a directory to hold the HLS segments
# This matches the output path in your mediamtx.yml: /hls_storage/stream.m3u8
RUN mkdir -p /hls_storage

# Expose the necessary ports
# 8554: RTSP (Internal FFmpeg use)
# 1935: RTMP (Robot Publish)
# 8888: HLS (Spectator View)
# 8889: WebRTC (Driver View)
EXPOSE 8554 1935 8888 8889

# The entrypoint is already set by the base image