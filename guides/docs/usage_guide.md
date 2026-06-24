# Usage Guide

This guide covers installation of the headless server and the use of the web based control panel.

## Installing and running the motion controller

The control panel alone does not run a Stringman robot. A program called the motion controller runs it.
The motion controller must be run on a PC on the same network as the robot components.
If the motion controller is not running, the anchors simply hold position and transmit nothing.

The brain of the robot is `stringman-headless` which is installed with pip. The components themselves are just light video streaming devices and motor command issuers. In other worfds, Stringman Pilot's compute is *external*.

The motion controller is a headless process, and the user interface is browser based and accessed at [neufangled.com/control_panel](http://neufangled.com/control_panel) whether in lan mode or cloud mode.

### Installation

=== "Linux"

        sudo apt install python3-pip python3-virtualenv
        python3 -m virtualenv venv
        source venv/bin/activate
        pip3 install "nf_robot[host]"
   
=== "Windows"
   
    Either download the [bundled Stringman windows installer](https://storage.googleapis.com/stringman-models/Stringman) (4.3GB)
    or if your machine already has cuda and you want to save space, install stringman directly into a system python installation.

    Installing Python via the Microsoft store is probably the easiest way to integrate it into your system without conflicting installations.
    Type "Microsft Store" in the start menu.  
    Search for python  
    Install python 3.13
    
    Open Powershell
    
        cd ~
        python3.13.exe -m pip install "nf_robot[host]"

=== "Mac"

        python3 -m virtualenv venv
        source venv/bin/activate
        pip3 install "nf_robot[host]"

### Run Stringman

Run stringman's motion controller from the virtualenv you set up during install

=== "Linux"

        venv/bin/stringman-headless

=== "Windows"

        python3.11.exe -m nf_robot.host.observer

=== "Mac"

        venv/bin/stringman-headless

With no args, it runs in LAN mode, meaning it will listen for a UI connection on port 4245. Open the [Control Panel](http://neufangled.com/control_panel) and select LAN mode to connect to the `stringman-headless` process your local machine.

![](images/usage/lanmode.webp){ loading=lazy, width=45% } 

If no configuration file is specified with `--config=<filename.json>` one will be created at `configuration.json` this will be where your specific robot's calibration parameters are stored and where your randomly generated robot id will be stored. if it is deleted, the id will change.

For machines with no NPU or GPU capable of AI acceleration, run with `--no_ai`. This will cut down the resource usage enough that you can still drive manually but you will be unable to use autonomous behaviors.

### Connecting 

Whether starting the motion controller first, or powering on the robot components first, the motion controller should discover and connect to every component automatically.

After making the initial connection to a component, the motion controller will attempt to connect to the video stream as well. The status of all component connections is indicated in the bottom left. It is possible that a component may be connected, but it's video connection is only established a few seconds later. This is normal.

![](images/usage/connections.webp){ loading=lazy, width=45% } 

If some components don't connect, please refer to the [Troubleshooting](quality_assurance.md) page.
Or ask for help on our [Discord](https://discord.gg/T5HEvxVgbA).

## First movment

The first thing you need to do after hanging up stringman and connecting to it, is raise it off the floor.

First tension all lines. In the **RUN** menu, select **Tension all lines** or press `1`

![](images/usage/tension.webp){ loading=lazy, width=45% } 

Then briefly tap the `E` key to move upwards. Briefly hold it enough to raise the gripper to a unobtrusive height.

Any complex motion beyond this requires calibration, which is the next step.

## Calibration

Print out the [full-page "origin" marker](https://docs.google.com/document/d/1B41dnssHsm1Db0LiHVgLatEv6H1jt0amIagw2v5_7dU/edit?usp=sharing) as well as calibration helper 1 thru 3 at 100% scale with no margins. Tape the pages to something completely flat such as a large book, a pane of glass, or an un-damaged peice of cardboard. Lay the origin marker in the center of the room, and place the helper markers around it as spread out as possible while still being visible to all the cameras. The origin card must be on the floor, the the others can be anywhere.

![](images/usage/calibration_cards.webp){ loading=lazy, width=45% }

Select the **Calibration and Maintenence** submenu followed by **Full Calibration**

![](images/usage/maintenence_menu.webp){ loading=lazy, width=45% } 
![](images/usage/fullcal.webp){ loading=lazy, width=45% } 

The robot should move to a position over the origin and make some other small motions. When this is finished, the shape of the room in the UI should update. If anything looks drastically wrong try repeating the calibration with better lighting, or with the helper cards in different places.

You should can judge the quality of the calibration by moving in straight lines. *WASDQE* keys move the robot along the cardinal directions of the origin card. With good calibration, the gantry should move in straight lines. Poor calibration usually causes it to move in an ascending arc, with some lines becoming slack in the process.

At any time, you can run the *quick calibration* (dpad-left) or key `2` which tightens all lines and resets the internal counter on the line length based on visual observation. Quick calibration only takes a few seconds. This can fix slightly slack lines, but cannot fix excessive errors in the position of anchors. In the pilot gripper, Quick calibration also attempts to reset the length of the winch line using the time between recent gantry swings. The gantry is almost always slightly swinging, but if it's not swinging at all, this part will not be updated.

!!! tip

    Left D-pad on the gamepad or key `2` performs quick calibration. Doing this often is very beneficial.

If automatic calibration absolutely cannot determine the true position of the anchors in your room, you can edit them manually in `configuration.json` in the working directory where you ran `stringman-headless`. Units are in meters. The motion controller will not alter them unless you run full calibration again.

### Controls

#### Keyboard

* `WASD` to move laterally and *QE* to move vertically.
* `ZX` to rotate the wrist (arpeggio gripper) or winch motor (pilot gripper)
* `Space` to close the gripper
* `L-Shift` to open the gripper
* `1` to tension all lines
* `2` perform quick calibration
* `3` execute an automated grasp at the current location

#### Gamepad

Any HID gamepad connected to your computer should be recognized by the control panel.
Connect a gamepad and press any button to wake it, then press both left and right analog triggers at the same time.
Gamepad control is highly reccommended over keyboard as it gives you analog speed control.

!!! Warning

    Doesn't work in Linux/Firefox but does work in Linux/Chrome
    [https://hardwaretester.com/gamepad](https://hardwaretester.com/gamepad) is really helpful in debugging this

![](images/usage/gamepad.webp){ loading=lazy, width=45% }

#### Perspective

Whether in keyboard control or in gamepad control, you can select the viewpoint around which the robot orbits.
In any of these perspective but `gripper`, forward moves away from you without changing height, back moves towards you.
Left orbits you counterclockwise, right orbits you clockwise.

You can set the viewpoint to be any camera, the 3D viewport, or the seat tag, which is an Apriltag you can place anywhere in the room, such as near your seat.

In gripper persepctive, forward is always in the direction the gripper is facing, which is up in the gripper camera view.

![](images/usage/perspective.webp){ loading=lazy, width=45% }

#### Stop motion tasks

The STOP button can be pressed at any time to cause a soft stop. This means any task which is generating motion commands will be cancelled and all motors will be commanded to stop. After a soft stop the robot can continue to move again as soon as any task or control input is given.

![](images/usage/stop.webp){ loading=lazy, width=45% }

#### Targets

The Targets panel shows all targets that can be seen from the overhead cameras, whether identified automatically or added manually.
You can select any target by clicking on it in the list or on it's square in any camera view where it appears to delete it.

You can add new targets by clicking twice anywhere in a camera feed (except the gripper camera for now)

At the bottom of the targets panel the **To:** and **From:** fields allow you to configure the pick and place task.
Pick and palce will continuously take items from the *To* category or location and drop them at the **From** location.

For example, if **To** is `User targets` and **From** is `Trash`, then pick and place will take all user-added targets, move to them, perform the configured type of auto grasp, then move over a point 25cm in front of the `Trash` apriltag, and drop the item.

#### Explanation of tags

Stringman comes with four small tags and four large tags.

The large tags are to mark the origin during calibration and to assist in determinging camera pose. They are only used during calibration and can be removed from the floor thereafter.

The small tags are used to tell the system where named locations are. The actual location being controlled is a point 25cm in front of the front face of the tag. The front face is the one with the name on it.

  * Gamepad - Informs the system where you are when controlling the robot manually for the purpose of orbiting around you. See the Perspective section above.
  * Trash - mark the location of a open trashcan
  * Toys - mark the location of an open toybox
  * Hamper - mark the location of an open laundry hamper

The tags can also be used for any other purpose you like. For example, place the hamper tag near a pile of walnuts, and gamepad tag near your cracking station. Set the appropriate tags as **To** and **From** and start pick and place to have the robot continuously bring you walnuts from the pile. The action continues until you press stop.

### Robot components

The interface shows the position of each robot component and the lines that connect them. Each anchor can determine whether a line is tight and the this is indicated in the control panel by either drawing the line as straight or curved. if the line is not tight, it is not possible for us to know by how much, thus the amount of curve drawn has no bearing on what it may look like in reality.

The gripper at it's estimated position in the room. the position estimation is a combination of two factors
 * The visual factor (RED). This is where the display box appears to be based on recent visual observations of the april tags.
 * The hang factor (BLUE). This is where the gantry should be hanging based on how long the lines are right now.

### Diagnostics

Visual detections of the gantry are rendered as white cubes. any time a new detection is made from any camera, a cube is added. These are the detections referred to by the "detections/sec" stat in the bar at the bottom.

If cameras are connected but no detections are made, the robot may just be too high to be in view of any camera, or too far down in the corner of the room. It may aslo just be too dark. The control panel will still try to make an estimate of it's position from last known line lengths, but if this estimate is wrong, you may just have manually move the gantry into a spot where the cameras can see it and then perform a quick calibration.

The distance detected by the laser rangefinder on the gripper is indicated with a red rectangle. You should expect to see this near the floor if calibration is accurate.

## Cloud mode

You can connect your stringman robot to your account at Neufangled.com in order to access it from anywhere as long as `stringman-headless` is running at home

While connected in LAN mode, from the RUN menu, select `Bind to Account`. You will be asked to log in with Google or Github. Give the robot a nickname, and click bind.

![](images/usage/bind_action.webp){ loading=lazy, width=45% } 
![](images/usage/bind_dialog.webp){ loading=lazy, width=45% } 
![](images/usage/myrobots.webp){ loading=lazy, width=45% } 

## AI Control

There are currently two main types of models used in Stringman, but this is a continuously changing feature.

### Small targeting and centering models

Two small models may be loaded for target finding and camera centering. The `--no_ai` flag suppresses the loading of these models, but does not refer to any other kind of ai.

#### Target model

The target model picks out potential targets on the floor which resemble laundry, toys, or trash and are small enough to pick up. When running it marks them as white circles on the camera feeds and adds them to the target list.

#### Centering model

An early solution to automatic grasping, the centering model is loaded by default.
This small model is used as part of an auto grasp routine in which a vector is predicted from the gripper camera to center the gripper over the object.

### Large Lerobot models

The more advanced form of autonomous control available for Stringman is end-to-end control by a Lerobot-based model.
This is access by the `Connect Lerobot` button at the top of the interface. This panel is used to start a lerobot model eval script as a subprocess of stringman-headless by specifying a compatible huggingface repo id.

![](images/learn/start_session.webp){ loading=lazy, width=45% }

The lerobot script connects to the robot's local telemetry stream and consumes video and produces movements as long as an "episode" is active.
`multitask-dit-8` is a model trained on the task of grasping household objects. The default behavior of pick and place is to try to start an episode in the connected lerobot session, assuming it is runnign a model which grasps objects. It's not yet wired up to automatically start the correct model since it's such an unfinished feature.

Therefore the form of autonomous behavior that is most within reach right now is autonomous grasping using a DIT model chained together with procedural cross room moves based on apriltag positions. However, it is possible in theory to use a model for cross room traversals. I have not been successful in training one that does that well yet though.

stringman headless must be started with the `--lerobot_grasp` argument for pick and place to use lerobot models for grasping, and this will suppress loading of the centering net.

### Agentic control

An agent has two main options for controlling stringman.

#### Direct movement control

It can connect to the telemetry stream at `ws://localhost:4245`. Each message read is a serialized TelemetryBatchUpdate and each message sent should be a ControlBatchUpdate.

There are controls for direct gantry velocity or controls to set goal points in room space.

See `src/nf_robot/protos/` from https://github.com/nhnifong/cranebot3-firmware for the interface definition and `src/nf_robot/ml/stringman_lerobot.py` for an example of how the lerobot script connects to telemetry.

#### Lerobot as intermediary

It can use a connected lerobot process evaluating a suitable model for handling low level movement and condition it with prompts. It would still connect to the telemetry stream, but would issue EpisodeControl messages containing prompts and would start and stop episodes from the connected model. Loading `multitask-dit-8` for example would allow an agent to issue a prompt such as "Pick up the orange pen" with the gripper somewhere near the orange pen and track velocity and finger pressure in the telemetry to guage success much like the pick and place routine in observer.py