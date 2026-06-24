# System Architecture

Stringman is a distributed robot, meaning it consists of multiple computers on a network. It doesn't use ROS partially for that reason.

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

This is the integration point for AI. When starting a record or eval session, `stringman-headless` starts a subprocess running [`stringman_lerobot.py`](https://github.com/nhnifong/cranebot3-firmware/blob/main/src/nf_robot/ml/stringman_lerobot.py) which connects to the telemtry stream. This script is specific to Stringman and uses the [Lerobot](https://huggingface.co/lerobot) library and dataset format. During teleoperation it records the observation/action pairs streaming over this socket into a dataset, and a trained policy can later be run as the controller, consuming telemetry and emitting control commands in place of a human. See the [imitation learning guide](imitation_learning.md) for the recording and training workflow.

Many other robots which are designed to work with Lerobot implement the robot interface and allow lerobot to teleoperate that interface. That was tried with stringman, but the latency was too high and gamepad control was much more complicated. I have instead opted to only use the lerobot dataset format. `stringman_lerobot.py` basically does the job the `lerobot-record` script, but as a passive recorder, and allowing the browser to own the gamepad.

#### Neufangled.com telemetry relay

When `stringman-headless` is run with `--telemetry_env=production` (or `=staging`), in addition to serving the local socket it can use neufangled.com as a relay. This is what lets you view and drive your robot from anywhere over the internet, rather than only from the same wifi network. This is referred to as "Cloud Mode" in some places in the interface, and is accessible from the [My Robots](/my-robots) Page.

This telemetry relay, referred to as the "control plane" in code, is a FastAPI backend backed by Redis and Postgres. `stringman-headless` opens an authenticated websocket to `/control/{robot_id}`; the UI in the browser opens its own connection to the same robot path. The control plane brokers between them, forwarding `TelemetryBatchUpdate`s out to authorized viewers and routing `ControlBatchUpdate`s from the authorized driver back down to the robot. It also publishes an `UplinkStatus` so the UI can tell whether the robot is currently connected to the relay.

Access is gated by ownership. A robot is associated with an account by **binding** it from the RUN meny, after which only the owner or users they've shared with may connect. Browser viewers may log in with Google, Github or other identidy providers. For the video path the backend issues short-lived **stream tickets** (`POST /ticket/{robot_id}`) that the WebRTC player presents. Neufangled.com relays your telemetry and video but does not store either.

#### Video flow

In **LAN mode**, video never leaves your network. Each component's camera process listens on port 8888 for the single `stringman-headless` connection; the frames are streamed in over your wifi, consumed by `stringman-headless` for marker localization and object detection, and re-transmitted to the local UI on additional ports as mjpeg streams. When a specific stream is ready, a `VideoReady` telemetry message is sent to the UI indicating where the UI can connect to the stream.

In **cloud mode**, the motion controller forwards the video streams to a MediaMTX server at media.neufangled.com via RTMP. MediaMTX then and re-serves it to the owner over **WebRTC**, after verifying access with a stream key. As with telemetry, the relay only forwards the stream while you're connected and does not save it.

## Telemetry format

Both the telemetry stream (robot → UI) and the control stream (UI → robot) are [Protocol Buffers](https://protobuf.dev/) messages serialized to bytes. The schemas live in the `nf_robot` package as [`telemetry.proto`](https://github.com/nhnifong/cranebot3-firmware/blob/main/src/nf_robot/protos/telemetry.proto), [`control.proto`](https://github.com/nhnifong/cranebot3-firmware/blob/main/src/nf_robot/protos/control.proto), and [`common.proto`](https://github.com/nhnifong/cranebot3-firmware/blob/main/src/nf_robot/protos/common.proto). Because the wire format is just protobuf, any language with a protobuf implementation can speak it.

Every message in the **telemetry** direction is a `TelemetryBatchUpdate`:

```
TelemetryBatchUpdate {
  string robot_id
  repeated TelemetryItem updates
}
```

Each `TelemetryItem` is a `oneof` — it carries exactly one kind of update. The payloads cover everything the UI needs to render the robot, for example:

- `PositionEstimate` — the gantry position/velocity, gripper pose, per-line tension and slack, and the timestamp the estimate is valid for.
- `ComponentConnStatus` — connection, video, IP, temperature, and motor-torque state of a single anchor or the gripper.
- `GripperSensors` / `GripCamPredictions` — laser range, finger angle, grip pressure, wrist angle, and the gripper-camera model's predictions.
- `TargetList` — the ordered set of objects the robot knows about and their pick-up status.
- `VideoReady` — announces that a camera feed is available and tells the UI where to connect (a `local_uri` for LAN UIs, a `stream_path` for remote WebRTC viewers — see [Video flow](#video-flow)).
- `AnchorPoses`, `VidStats`, `OperationProgress`, `Popup`, `Logs`, `UplinkStatus`, and more.

Batching means a single frame can carry several updates at once. A `TelemetryItem` may also set `retain_key`: when present, the cloud control plane caches that item under the key and replays the latest value of each key to any newly connected UI, so a client that joins mid-session immediately gets the current anchor poses, connection statuses, etc., rather than waiting for them to be re-sent.

The **control** direction is symmetric. Every message is a `ControlBatchUpdate` containing one or more `ControlItem`s, each a `oneof` of one command. These range from continuous teleoperation (`CombinedMove` — gantry direction/speed, winch, wrist, and finger speeds) to high-level goals (`MoveGripperTo`, `SetPoint`), single-spool jogging for setup (`JogSpool`), and fire-and-forget `CommonCommand`s selected from the `Command` enum (calibrate, park, grasp, stop-all, enable lerobot, and so on).

Shared types live in `common.proto`: `Vec3` (world space, Z up), `Pose` (Rodrigues rotation vector + position), and the `EpisodeControl` messages used to coordinate Lerobot recording/eval sessions.

## Motion Controller Architecture

This section serves as an overview of how `stringman-headless` coordinates the motion of the spools.

Internally `stringman-headless` is the **observer** process ([`observer.py`](https://github.com/nhnifong/cranebot3-firmware/blob/main/src/nf_robot/host/observer.py)). It owns a connection to each robot component through a per-component client ([`anchor_client`](https://github.com/nhnifong/cranebot3-firmware/blob/main/src/nf_robot/host/anchor_client.py) / [`gripper_client`](https://github.com/nhnifong/cranebot3-firmware/blob/main/src/nf_robot/host/gripper_client.py), with `arp_*` variants for Arpeggio hardware) and runs the control loop that turns high-level goals into line-speed commands for the spools.

**State estimation.** The robot's gripper hangs from cables paid out by the anchors, so its position is not directly known — it is estimated. The [`position_estimator`](https://github.com/nhnifong/cranebot3-firmware/blob/main/src/nf_robot/host/position_estimator.py) fuses two independent sources: a *visual* estimate from the AprilTag markers on the gripper's marker box, seen by the anchor cameras, and a *hanging* estimate derived from the lengths of line each anchor reports based on it's encoders. Fusing these along with commanded velocity in a kalman filter gives a position that is more drift-free and smooth than any of the individal sources. The result, along with per-line tension and slack flags, is what gets published as `PositionEstimate`.

**Calibration.** Before estimates mean anything, the controller has to know where the anchors are in the room. The [`calibration`](https://github.com/nhnifong/cranebot3-firmware/blob/main/src/nf_robot/host/calibration.py) (and [`eyelet_calibration`](https://github.com/nhnifong/cranebot3-firmware/blob/main/src/nf_robot/host/eyelet_calibration.py)) routines solve for the anchor poses — triangulating from images of marker cards placed on the floor — and save them to the configuration file so they survive restarts. These poses are broadcast to UIs as `AnchorPoses`.

**Kinematics and the control loop.** Given a known set of anchor positions and a current gripper estimate, moving the gripper is an inverse-kinematics problem: to produce a desired gantry velocity in the room frame, the controller computes how fast each line must lengthen or shorten and issues those per-spool speed commands. Continuous `CombinedMove` inputs (from a gamepad or an AI policy) are applied directly as velocities; goal-based commands like `MoveGripperTo` are run as motion *tasks* that drive the estimate toward a target point and then complete. A safety layer watches line tension — if any line goes too tight it briefly switches all motors to damped motion — and `COMMAND_STOP_ALL` decelerates everything within limits.

The reason speed commands are used instead of positional commands is that it makes the system more robust to poor calibration, but this could be revisisted in the future.

**Swing cancellation.** Because the payload is suspended, lateral moves induce pendulum swing. An swing-cancellation task adds a corrective velocity, computed from the gripper's motion and a tunable latency, on top of the commanded velocity to damp out that oscillation. This may eventually be enabled by default, but while in development it is still turned on at the user's request.

**Higher-level behaviors.** On top of the motion primitives, the observer runs several high level behaviors such as pick and place, automatic parking, goal seeking, and diagnostics. `target_queue` holds objects to be picked up, and the pick-and-drop behavior moves to each target, attempts an automated grasp, carries it to the destination, and releases — looping through the queue. The same control interface is what a Lerobot session drives during data collection and policy evaluation.