No component should have to come up first, and every component should repeatedly try to re-establish a connection to the others.

### Observer

has a telemetry connection to control_plane
has multiple video connections to media_gateway

### Control Plane

has connections to multiple UIs
has connections to multiple observers
multiple control plane intstances are running and coordinating over redis

### UI

has a telemetry connection to control_plane
has multiple video connections to media_gateway

### Media Gateway

has connections to observers
has connections to UIs
One instance for now



Certain things that the observer sends up on the telemetry stream are lasting state that must be sent to each new UI that connects, including

 * The last AnchorPoses message
 * The last ComponentConnStatus of each individual component

The control_plane is naturally responsible for repeating these to new clients, but in order to make the control_plane's job simple in this regard,
The observer could be required to mark certain messages as needing to be repeated to new UIs, call these "UI startup messages". It could do so with an identifier that works like this
if the control plane sees a telemetry update with a ui startup message identifier, it overwrites the last one with the same identifier.
when the control plan gets a new UI client, it takes all ui startup messages from that robot and sends them in a batch to the UI.
Observer would use 6 different identifiers. one for anchor poses, four for anchor connection statuses, and one for the gripper connection status