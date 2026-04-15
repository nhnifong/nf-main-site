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

Hold the anchor up to the wall, near the ceiling. Slide it straight down in the corner so it engages with the mount and locks in.

While the ladder is still in place in this corner, plug in one of the white barrel jack extension cords and leave it hanging.
Pull both lines out of the anchor down to a level where you can reach them without the ladder.

Repeat with the other anchor in the opposite corner.

# Mounting Eyelets

In the two remaining corners of the room, With a single wood screw, screw an eyelet into a stud with the small pointer pointing up.

When facing the eyelet, look to anchor to your right. Take the carabiner from it's left line and pull it to you, put it through the eyelet from back to front, then pull it down to a level you can reach without a ladder. 

# Pre-tie-up connection test

Before hanging up the gripper, connect all components to wifi and confirm everything is ready.

Temporarily connect the gripper to power by leaning it against the wall near the gray power supply line coming from one anchor. Plug in it's JST-ZH cable at the top of the marker box.

Connect the 5A 24V powers supplies to the anchors and plug into the walls using the included outlet remote. If desired, hide plugs and route wires for minimal visibility.

Ensure the control panel can run on your host machine and connect to the robot components.

Following the instructions in the [Usage Guide](usage_guide.md) start up the Stringman controller. It begins searching for components on the network.

!!! note "Only one complete stringman robot may be on the network during this step"
    In order for the controller to discover which components belong to this particula robot, If you own another stringman, turn it off.

Without having tied any of the lines to the gantry, power on all components using the outlet remote. Within about 30 seconds of booting, stringman components begin looking for a wifi share QR code using their cameras.

## Give all three components wifi credentials

Go to [qifi.org](https://qifi.org) on your phone and enter your wifi SSID and password. It will not be saved or sent anywhere. Press Generate to create a QR code that contains this information. You can also try your phone's share wifi feature, but due to the fancy decorative QR codes produced by android, it usually doesn't work. whereas, qifi.org generates traditional blocky QR codes.

Hold the QR in view of each camera (including the gripper camera) for about 10 seconds each. They can see a 2-inch code from about 5 feet away.

When the component succsessuflly connects, it will buzz its motor or wiggle fingers to indicate success. You can also see it discovered in the stringman control panel. You can also see it show up in your router's admin page.

Confirm that the control panel has discovered two anchors and one gripper. If it has not, power everythinng off and trying repeating the process.

If this method is not working for you, wifi credentials can also be added to the SD cards with the [add_wifi_config.sh](https://github.com/nhnifong/cranebot3-firmware/blob/main/add_wifi_config.sh) script.

If you have connection issues at this step, your anchors and host machine might not be on the same network. Guest networks won't work because they don't allow devices to be discovered by eachother. Please refer to the [Troubleshooting Page](quality_assurance.md) or contact me on Discord to resolve the issue before tie up.

Wifi creds can be cleared from a gripper by rapidly squeezing the finger pad five times.

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

With the gripper near the center of the room, touching the floor, select "Calibration and Maintenence" > Full Calibration" from the run menu.
It is normal for some lines to be slack during calibration, this is a necessary step to determine the location of the eyelets.

When calibration is complete, you will see a message in the UI. You can judge the quality by checking that the room shape in the UI matches the work area of the components you installed. Moving in straight lines with WASD should result in staight line movement of the robot. Secondly you can enable swing cancellation and confirm it cancels the swing rather than amplifying it.

If calibration results are poor, trying moving the calibration cards further apart and try agian starting with the gripper on the floor near the center of the room.