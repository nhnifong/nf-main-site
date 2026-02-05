# Neufangled Robotics

Stringman Pilot Launch

<iframe width="100%" height="660" src="https://www.youtube.com/embed/7m1xiKnuvV0?si=1Ys52XyADBqQRM_G" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

![Image](images/PXL_20250318_233318194.jpg)

## Purpose

Create an affordable robot with room scale reach for picking up clutter

The largest portion of housework is picking things up and the largest proportion of those things are laundry and trash. Neither need to be handled carefully, and simply dropping them in a bin is all we really require. Other robots targeted at household chores have either humanoid form or the "arm on self propelled cart" form and both of these face navigation problems and cost a lot more.

## Capabilities

Stringman can pick up small objects and drop them in a bin or into a pile in a predetermined location. More advanced autonomous classification of objects is still in development. Example actions can be recorded with the [LeRobot platform](https://huggingface.co/docs/lerobot/en/index) and used to train policies for autonomous operation.

In the pilot launch, you can still drive the robot around manually like a crane game and pick things up. the most intuitive method of control is a gamepad. Stringman aslo has some use in a mobility impairment situation. A bed ridden person can bring themselves things from around the room with the robot.

## Physical Architecture

If an object hangs from three lines of known length, its position in 3D space is fully determined. This is the principle of operation behind a Cable Driven Paralell Robot (CDPR). However to make it slightly more practical in a household setting, we use four lines so that our work area will be rectangular. The four motorized spools referred to here as **anchors** are mounted in the corners of a room. Where they meet, we could place the **gripper**, but in order to keep the lines *mostly* clear of people and furniture, we hang the gripper from a passive object we call the **gantry**[^1] by a fifth, vertical line. We lose some positional control, in exchange for making it slightly easier to live with.

[^1]: Though I have used the term gantry, there is no rigid beam on rails such as in a warehouse gantry crane, I just didn't know the meaning of the word at the time and now it's all over the codebase. In academic literature, the point where lines meet in a CDPR is tupically called the platform.

Every anchor is equipped with a camera so we have four views of the work area from which to locate the robot components and the potential items of clutter to be picked up. The images are served by a process that allows only one client at a time, and the control software on your desktop PC is that client. Everything occurs locally and no cloud interaction will ever occur without your explicit permission.

On the gripper, we use one servo to reel the gripper up and down the vertical line, and one to open and close a pair of fingers. the fingers are linked by helical spur gears which move them apart symmetrically. Though stringman's current generation of gripper is not intended for picking up delicate objects, the fingers have pressure sensors in order to assist the software in determining if something was picked up. The gripper is also equipped with a BNO085 IMU and a camera.

Power delivery to the gripper is done by having one of the lines be a power wire running through slip rings. Having the gripper hard wired to power means greater payload capacity, not having to deal with any charging process, and even cheaper shipping. This wire has to simulteneously have low friction, low weight, low visibility, low memory, high tensile strength, and adequate conductance. To meet those needs I have combined FEP coated 30 AWG conductors with braided fishing line using a counter-rotating wire twisting machine.

The motors used in the Pilot run are the [MKS Servo 42C](https://github.com/makerbase-mks/MKS-SERVO42C). An affordable Nema 17 stepper motor with an integrated FOC controller. This motor is very quiet, efficient, and easy to use. However FOC of BLDC motors are being explored for the next hardware revision.

## Software Architecture

The robot components each contain a [Raspiberry Pi Zero 2w](https://www.raspberrypi.com/products/raspberry-pi-zero-2-w/), to control motors, read sensors, and stream video to the **control panel** software running on your desktop PC. The job of the control panel is to process the images from all camera angles, determine the positon of the robot, the positions of potential targets, compite line lengths and send them to the anchor spool motors.

Calibration is a very important step in making a CDPR move smoothly rather than tear itself apart. Stringman uses [April Tags](https://github.com/AprilRobotics/apriltag) to obtain estimates of the relative poses of it's anchors to the room and to the gantry, which displays an april tag on each of its four sides. After calibration is run, the anchor positions are known and the robot only needs a few observations in order to be ready to use after a power cycle.

The impressive recent developments in robotics have stemmed from the use of deep reinforcement learning. This uses data recorded from teleoperation to train models that predict robot motor positions from cameras and other sensors. Stringman can be teleoperated with a standard xbox format gamepad attached to the machine running the control panel. Data can be recorded this way development is ongoing to use this data for deep learning. 

## Cost

The following costs are estimates of what I will be charging for kits and complete robots. As of this writing, completed stringman robots are not for sale yet, however the design is open source and the BOM and STLs are available on the [Downloads page](downloads.md).
Cost has been strongly affected by tarrifs on Chinese imports to the United States recently, but thankfully raspberry pi's and their cameras are made in the UK.
The MKS Servo42C is made in china however.

$780 - Hardware kit shipped within the United states

All the mechanical parts can be 3D printed with adequate strength and precision.
Building the robot requires some experience soldering, assembling small objects, and working from a linux command line. If you're not sure if that's for you, take a look at the build guides to get an idea of what it involves. 

$1460 - Fully Assembled and shipped within the united states[^2]

[^2]: I currently have no plans to certify the device for sale in the EU due to costly regulations.

The complete robot ships as four anchors and one gripper. The anchors will still have to be mounted to the walls, the gripper connected to the lines that are pre-wound on the anchor spools, and the calibration process run, but you should be up and running in an hour or two.

Hidden cost:

Desktop PC. I can't honestly neglect to mention that you need newer PC in order to run the control software. processing five video streams at the same time while running scikit.minimize in a loop as fast as possible will take at least 6 cores. For a processor I reccomend at least a Ryzen 7. AI based movement is not yet implemented, but is coming soon, and at that point an Nvidia GPU such as an RTX 3090 or better will become necessary for that feature, but it can always be teleoperated without one.

$550 - Estimated cheapest cost to aquire all the parts on the BOM yourself in the United States. Likely cheaper in china, but similar in Europe.

## Safety

Try not to hit your head on the robot. This is a prototype