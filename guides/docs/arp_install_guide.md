# Unboxing and Installation

Anchor Hardware Version: Arpeggio

Hardware installation of a preassembled or diy assembled Stringman pilot robot.

Tools needed:  

 - Step ladder
 - Handheld drill/driver
 - M1.5 hex bit (included)

Expected Difficulty:

 - Takes 1 hour without interruptions
 - Like hanging a curtain rod, plus at least 30 minutes for additional setup.

Hanging the robot in the room where it will operate involves installing anchors in two opposing corners, and attaching each of the four support lines to the gripper.

## Planning

Choose two opposing corners to be the mounting locations for the anchors. The other two corners will be where you mount eyelets. The four-walled volume defined by these points is the robot's work area. If the room has a ceiling fan, you can mount the anchors and eyelets at the blade height or lower and they won't be able to touch. If the room has a bunk bed, it is OK to let it be in the work area but intelligent obstacle avoidances is not implemented so you might have to manually intervene sometimes.

![](images/arp_install/room_diagram.png){ loading=lazy, width=45% }

# Assemble gripper and marker box

The gripper and marker box with attached pole are separated during shipping in order to use a smaller box and must be assembled before use.

![](images/arp_install/PXL_20260412_004041496.png){ loading=lazy, width=45% }

Using the provided 1.5mm mini screwdriver bit, remove the back cover of the gripper with two screws. one on top and one on the bottom.

![](images/arp_install/PXL_20260412_004056062.png){ loading=lazy, width=45% }
![](images/arp_install/PXL_20260412_004123246.png){ loading=lazy, width=45% }

The block at the top of the back of the gripper with the rectangular hole is the `wrist removal block`. It securely holds the wrist joint. Color may vary on internal parts such as this. In these photo's it's lime green.
Unscrew the three screws holding it in and pull it out. It's intentionally a tight fit.

![](images/arp_install/PXL_20260412_004142298.png){ loading=lazy, width=45% }
![](images/arp_install/PXL_20260412_004213285.png){ loading=lazy, width=45% }
![](images/arp_install/PXL_20260412_004221794.png){ loading=lazy, width=45% }
![](images/arp_install/PXL_20260412_004231543.png){ loading=lazy, width=45% }

Feed the power supply plug from the gripper up through the pole of the marker box until it comes out the top.

![](images/arp_install/PXL_20260412_004242189.MP.png){ loading=lazy, width=45% }

Seat the gear and bearing into the wrist socket. The rotation doesn't matter it will be determined later during calibration.
Press the gear in until the teeth mesh and the bearing is fully seated, then press the wrist block down into the cavity and secure with the three screws.

![](images/arp_install/PXL_20260412_004300038.png){ loading=lazy, width=45% }
![](images/arp_install/PXL_20260412_004636298.png){ loading=lazy, width=45% }
![](images/arp_install/PXL_20260412_004646373.png){ loading=lazy, width=45% }
![](images/arp_install/PXL_20260412_004724816.png){ loading=lazy, width=45% }

Reinstall the back cover of the gripper using the two previously removed screws. Set the gripper aside.

![](images/arp_install/PXL_20260412_004803982.png){ loading=lazy, width=45% }

# Mounting Anchors

Mark 5 inches (13cm) below the ceiling on the wall in a corner where an anchor will be mounted. (Or mark the height of the blades of the ceiling fan)
Place the `stud_mount` (butteryfly shaped) part against the wall and drive in two 3-inch wood screws. In a drywall finished home there is always at least one stud behind a wall corner. Hitting a stud on one side is sufficient. If you feel that you didn't hit any studs, the location may be unsuitable and require a backer board.

![](images/arp_install/PXL_20260527_214408186.png){ loading=lazy, width=45% }
![](images/arp_install/PXL_20260527_214538867.png){ loading=lazy, width=45% }
![](images/arp_install/PXL_20260527_214611964.png){ loading=lazy, width=45% }

Hold the anchor up to the wall, near the ceiling. Slide it straight down in the corner so it engages with the mount and locks in.

While the ladder is still in place in this corner, plug in one of the white barrel jack extension cords and leave it hanging.
Pull both lines out of the anchor down to a level where you can reach them without the ladder.

![](images/arp_install/PXL_20260417_224940434.png){ loading=lazy, width=45% }

Repeat with the other anchor in the opposite corner.

# Mounting Eyelets

In the two remaining corners of the room, With a single wood screw, screw an eyelet into a stud with the small pointer pointing up.
It should be on the right wall when facing the corner, unless this corner of the work area is flat, then you just mount it however you can manage, as long as it's in a stud.

![](images/arp_install/PXL_20260527_122818135.png){ loading=lazy, width=45% }
![](images/arp_install/image_2.png){ loading=lazy, width=45% }

When facing the eyelet, look to anchor to your right. Take the carabiner from it's left line and pull it to you, put it through the eyelet from back to front, then pull it down to a level you can reach without a ladder.

# Mounting the parking hook

The parking hook is a place where the marker box and gripper can hang when the robot is powered off. It can be placed on any wall that is reachable in the robot's work area.

 * The height of the parking hook should be high enough that you can comfortable walk under the lines while the robot is parked, and no higher.
 * if mounted too high, it becomes very difficult to park because precision gets exponentially worse near the ceiling.
 * the parking hook should be mounted in a stud.

!!! note "Self parking is still a work in progress"
    Self parking, or any motion near the ceiling, is extremely dependent on good calibration, and therefore is hard to get working reliably. Depening on the room, you may find it to work, or may not. For that reason, I reccomend manual parking for now. (move near the hook, grab the robot with one hand, power off the motors with the remote, and hang the robot on the hook.)

After selecting a suitable location, screw the parking hook to the stud in the wall with the prong facing upwards.

The other parking component (The printed apriltag on a narrow shelf) is meant to aid in parking localization and should be mounted two inches below the gripper's fingers when it's in the parked position. It is used during self parking. If you are not going to use self parking, you don't need it.

## Other parking options

You can also disconnect the gripper from the lines using the cabiners and run the debug command "stow" to reel in all the lines until some tension is felt. Before doing this mark which hook was the power line hook so you can re-attach everythign the same way it was during calibration.

# Pre-tie-up connection test

Before hanging up the gripper, connect all components to wifi and confirm everything is ready.

Temporarily connect the gripper to power by leaning it against the wall near the gray power supply line coming from one anchor. Plug in it's JST-ZH cable at the top of the marker box.

Connect the 5A 24V powers supplies to the anchors and plug into the walls using the included outlet remote. If desired, hide plugs and route wires for minimal visibility.

Ensure the control panel can run on your host machine and connect to the robot components.

![](images/arp_install/image_1.png){ loading=lazy, width=45% }

The temporary powerup of the gripper can also be done before attaching the marker box.

Following the instructions in the [Usage Guide](usage_guide.md) start up the Stringman controller. It begins searching for components on the network.

!!! note "Only one complete stringman robot may be on the network during this step"
    In order for the controller to discover which components belong to this particula robot, If you own another stringman, turn it off.

Without having tied any of the lines to the gantry, power on all components using the outlet remote. Within about 30 seconds of booting, stringman components begin looking for a wifi share QR code using their cameras.

## Connect all components to wifi

Go to [qifi.org](https://qifi.org) on your phone and enter your wifi SSID and password. It will not be saved or sent anywhere. Press Generate to create a QR code that contains this information. You can also try your phone's share wifi feature, but due to the fancy decorative QR codes produced by android, it usually doesn't work. whereas, qifi.org generates traditional blocky QR codes.

Hold the QR in view of each camera (including the gripper camera) for about 10 seconds each. They can see a 2-inch code from about 5 feet away.

When the component succsessuflly connects, it will buzz its motor or wiggle fingers to indicate success. You can also see it discovered in the stringman control panel. You can also see it show up in your router's admin page.

Confirm that the control panel has discovered two anchors and one gripper. If it has not, power everythinng off and trying repeating the process.

If this method is not working for you, wifi credentials can also be added to the SD cards with the [add_wifi_config.sh](https://github.com/nhnifong/cranebot3-firmware/blob/main/add_wifi_config.sh) script.

If you have connection issues at this step, your anchors and host machine might not be on the same network. Guest networks won't work because they don't allow devices to be discovered by eachother. Please refer to the [Troubleshooting Page](quality_assurance.md) or contact me on Discord to resolve the issue before tie up.

Wifi creds can be cleared from a gripper by rapidly squeezing the finger pad five times.

### Firmware update and timezone sync

With all components connected to the motion controller, select "Calibration and Maintenence" > "Update Firmware On Components" from the run menu.
Wait for confirmation of completion from all components. Updates are not pushed automatically, they are always done at your discretion.

# Tie up

Power off the whole system.

Place the gripper in the center of the room. Pull out each of the four lines to the center. clip the carabiner onto the corresponding loop in the white marker box. No lines should cross. Plug in the power to the gripper from the end of the gray line if not already plugged in.

![](images/arp_install/PXL_20260412_004820302.png){ loading=lazy, width=45% }
![](images/arp_install/PXL_20260412_005103906.png){ loading=lazy, width=45% }

Power the system back on.

In the control panel wait for all components to be discovered.

Select "Quick Calibration". this should tighten all four lines.

Hold `E` for a second or two to move up off the ground. More complex motion requires full calibration.

# Full Calibration

??? example "Changing the camera tilt angle"

    Different room shapes and ceiling heights may require tilting the camera up or down. But because calibration needs to know what angle the camera has relative to the frame, there are fixed adapters with specific angles.

    22°, 26°, and 30°

    Stringman anchors are shipped with the 26° adapter installed. If you find that your cameras are not pointed at the center of the floor in the room, you can replace the adapter with the following procedure.

    Remove the white cover from the anchor. this can be done while the anchor is mounted on the wall, but you may find it easier at a desk.

    Ground yourself to prevent static discharge and Unscrew the camera mount from the side.

    ![](images/arp_install/PXL_20260527_162458033.png){ loading=lazy, width=45% }

    Flip the camera up, and remove the two screws that attach it to the mount.

    ![](images/arp_install/PXL_20260527_162516907.png){ loading=lazy, width=45% }
    ![](images/arp_install/PXL_20260527_162545638.png){ loading=lazy, width=45% }

    Swap in the mount that has a better angle for your room. 30° for tall skinny rooms, 22° for wider rooms or short ceilings.

    ![](images/arp_install/PXL_20260527_162551217.MP.png){ loading=lazy, width=45% }

    Screw the new mount to the camera with the same screws

    ![](images/arp_install/PXL_20260527_162604065.png){ loading=lazy, width=45% }
    ![](images/arp_install/PXL_20260527_162650265.png){ loading=lazy, width=45% }

    press it into the notch on the frame and screw it back in from the side. The screw should be fully seated and the mount tight against the frame or it may end up in an indeterminate orientation.

    ![](images/arp_install/PXL_20260527_162722427.png){ loading=lazy, width=45% }

Prepare for calibration by placing the four large paper cards on the floor. The one labelled "origin" should be in the center, with the others around it anywhere. The small plastic cards are not part of calibration, they are for labelling drop points during normal operation.

With the gripper near the center of the room, touching the floor, select "Calibration and Maintenence" > "Full Calibration" from the run menu.
It is normal for some lines to be slack during calibration, this is a necessary step to determine the location of the eyelets.

!!! note "If a card moves, stop calibration and start again."
    If any card moves during calibration, the abort it by pressing STOP and start again.

When calibration is complete, you will see a message in the UI. You can judge the quality by checking that the room shape in the UI matches the work area of the components you installed. Moving in straight lines with WASD should result in staight line movement of the robot. Secondly you can enable swing cancellation and confirm it cancels the swing rather than amplifying it.

A lateral move forwards (W or up on the left stick) should move in the direction the gripper's nose is facing when controlling from gripper perspective (the default). If this does not occur, try repeating calibration.

If calibration results are poor, trying moving the calibration cards further apart and try agian starting with the gripper on the floor near the center of the room.