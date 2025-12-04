# MAJOR COMPONENTS

1. The "Media Gateway" Cluster (MediaMTX)
   - Software: MediaMTX (Multi-tenant configuration).
   - Scaling: One server can handle N robots. Scale horizontally (add more servers) as customer base grows.
   - Authentication: Configured to use "External Auth". It delegates permission checks to the Control Server via HTTP POST.
   
   Stream Types:
   A. Private Robot Stream (Default)
      - Path: /robot_{id}
      - Input: RTMP (from Robot)
      - Output: WebRTC (to Owner)
      - Processing: Passthrough only (Low CPU). No transcoding.
      
   B. Playroom/Broadcast Stream (Special Flag)
      - Path: /playroom
      - Input: RTMP (from Robot)
      - Output: WebRTC (to Driver) AND HLS (to S3/CDN for Spectators).
      - Processing: High CPU. MediaMTX triggers an FFmpeg process to transcode and segment for HLS.

2. The "Control Plane" (Web Backend + Redis)
   - Function: User accounts, Fleet Management, Queue System, Signaling.
   - Database: Postgres (Users/Robots) + Redis (Real-time State/Queue).
   
   Endpoints:
   - POST /internal/auth: Called by MediaMTX to validate stream publishers (robots) and readers (users).
   - WS /control/robot_{id}: 
     - Robot connects here to listen for commands and publish state.
     - User connects here to send commands (if authorized driver) and receive state.
     - Playroom Queue logic lives here (assigns "Driver" role to specific user socket).

3. The Robot (Client Side)
   - Observer Process (Python):
     - Video: Pushes RTMP to `rtmp://media-server/robot_{id}`
     - Control: Connects WebSocket to `wss://api-server/control/robot_{id}`
   - "Watchdog" script ensures these processes restart on failure.

# REQUIRED ARTIFACTS

1. Cloud - Media Gateway
   - mediamtx.yml: The config file defining the paths (/robot_*, /playroom), enabling external auth, and setting up the HLS runOnReady hooks.
   - hls_sync.sh: A bash script triggered by MediaMTX when a segment is created. It uses `aws s3 cp` or `rclone` to push .ts segments to your bucket.
   - Dockerfile.media: Builds the image containing MediaMTX, FFmpeg (for transcoding), and AWS CLI (for syncing).

2. Cloud - Control Plane (Backend)
   - main.py (FastAPI): The entry point for the HTTP API and WebSocket server.
   - auth.py: Handles the `POST /internal/auth` webhook from MediaMTX. Checks DB to see if the stream key matches the robot ID.
   - socket_manager.py: Manages the active WebSocket connections. Handles the logic of "User A sent 'UP', is User A the current driver? Yes -> Publish to Redis."
   - queue_manager.py: Redis logic. `join_queue()`, `promote_next_driver()`, `get_queue_status()`.
   - models.py: SQLAlechemy/Pydantic models for User, Robot, and Permission tables.

3. Robot - Client Side (Python)
   - observer.py: subprocess to tile and encode video. 
     Mode to connect to remote server for state and control. Will differ somewhat from lerobot teleoperation but very similar.

4. Frontend (Web)
   - playroom.html / app.js: The public demo page. Connects to the HLS stream URL (Spectator) or WebRTC (Driver).
   - dashboard.html / dashboard.js: The private owner page. Connects to the WebRTC stream for their specific robot.