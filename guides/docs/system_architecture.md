# System Architecture

Stringman is a distributed robot, meaning it consists of multiple computers on a network.

## Network architecture

### A Basic Overview

In summary, the UI connects to stringman-headless and stringman-headless connects to the components.

There are three robot components (two anchors and one gripper) each running on a raspberry pi zero 2W. These are on your wifi network.

`stringman-headless`, also called the motion controller, is a process that runs on a host computer on the same network, and handles all the coordination and kinematics.

The stringman UI, hosted from [neufangled.com/playroom](/playroom) connects to an instance of `stringman-headless` to allow you to view and control the robot.

### The complete network architecture picture

The robot components are running a light websocket server and allow a single client to connect. This client is `stringman-headless`. When it connects, the components start their cameras, which listen on `8888` for a single connection where they begin serving frames in a webts container. The camera process consumes the majority of the resources on the Pi zero 2W. when the client disconnects, the process terminates.

`stringman-headless` Is a coordination process. It discovers new components on the network via mDNS or connects to existing saved ones. It serves as the robot's main brain. Internally there are functions for going to a given XYZ point for example that will send line speed commands to the anchors.

`stringman-headless` publishes a telemetry stream to one or more sources depending on the arguments it is run with. This stream is always available at `ws://localhost:4245` and when running in lan mode (the default behavior when run with no argments) this is the only way the telemetry can be accessed. Every message sent is a serialized TelemetryBatchUpdate and every message received is a serialized ControlBatchUpdate

The UI served from [neufangled.com/playroom](/playroom) in LAN mode (more accurately, localhost mode) will try to connect to the local telemetry websocket.

#### Lerobot or other AI

Because the telemetry websocket at `ws://localhost:4245` is always available, any process on the host machine can act as a controller, not just the UI. A program connects to that socket, reads serialized `TelemetryBatchUpdate` messages (joint state, marker pose, detected objects, camera frames, etc.) and writes back serialized `ControlBatchUpdate` messages to drive the robot. This is the same contract the UI uses, so anything you can do from the playroom you can do from a script.

This is the integration point for AI. When starting a record or eval session, `stringman-headless` starts a subprocess running `stringman_lerobot.py` which connects to the telemtry stream. This script is specific to Stringman and uses the [Lerobot](https://huggingface.co/lerobot) library and dataset format. Suring teleoperation this script records the observation/action pairs streaming over this socket into a dataset, and a trained policy can later be run as the controller, consuming telemetry and emitting control commands in place of a human. See the [imitation learning guide](imitation_learning.md) for the recording and training workflow.

#### Neufangled.com telemetry relay

When `stringman-headless` is run with `--telemetry_env=production` (or `=staging`), in addition to serving the local socket it can use neufangled.com as a relay. This is what lets you view and drive your robot from anywhere over the internet, rather than only from the same wifi network. This is referred to as "Cloud Mode" in some places in the interface, and is accessible from the [My Robots](/my-robots) Page.

This telemetry relay, referred to as the "control plane" in code, is a FastAPI backend backed by Redis and Postgres. `stringman-headless` opens an authenticated websocket to `/control/{robot_id}`; the UI in the browser opens its own connection to the same robot path. The control plane brokers between them, forwarding `TelemetryBatchUpdate`s out to authorized viewers and routing `ControlBatchUpdate`s from the authorized driver back down to the robot. It also publishes an `UplinkStatus` so the UI can tell whether the robot is currently connected to the relay.

Access is gated by ownership. A robot is associated with an account by **binding** it from the RUN meny, after which only the owner or users they've shared with may connect. Browser viewers may log in with Google, Github or other identidy providers. For the video path the backend issues short-lived **stream tickets** (`POST /ticket/{robot_id}`) that the WebRTC player presents. Neufangled.com relays your telemetry and video but does not store either.

See for yourself, 

#### Video flow

In **LAN mode**, video never leaves your network. Each component's camera process listens on port 8888 for the single `stringman-headless` connection; the frames are streamed in over your wifi, consumed by `stringman-headless` for marker localization and object detection, and re-transmitted to the local UI on additional ports as mjpeg streams. When a specific stream is ready, a `VideoReady` telemetry message is sent to the UI indicating where to connect to the stream.

In **cloud mode**, that same processing still happens locally, but the robot additionally pushes a video stream off-box for remote viewing. The robot's observer process tiles and encodes the camera feeds and publishes them via RTMP to a MediaMTX media gateway at neufangled.com. MediaMTX passes the stream through (no transcoding for a private robot) and re-serves it to the owner over **WebRTC**, which the UI's video feed connects to using a stream ticket from the control plane. For the public `/playroom` broadcast stream, MediaMTX additionally transcodes to HLS for spectators. As with telemetry, the relay only forwards the stream while you're connected and does not save it.