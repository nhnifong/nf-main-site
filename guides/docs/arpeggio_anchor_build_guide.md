# Arpeggio Anchor Build Guide

Hardware Version: Arpeggio

This is a rough draft of how to assemble the arpeggio anchor (double damiao anchor)
TThe design is not finished, particularly wrt how the cover attaches.

**Print time**: unmeasured
**Build time**: unmeasured

## Bill of Materials

TODO

## Tool list

 - [Mini screwdriver with a bit set](https://www.amazon.com/dp/B01KB02F9C)
 - [Cross locking tweezers](https://www.amazon.com/dp/B001BU9MLG)
 - Super glue ([loctite super glue “professional liquid”](https://www.amazon.com/dp/B07VL6MP94?ref_=ppx_hzsearch_conn_dt_b_fed_asin_title_1&th=1) recommended)

## Spools

Assemble three fishing line spools and one powerline spool
Spool side A is different on the powerline spool, it has a wider center hole.

Glue side A to side B

### For regular spools

Press the dry spool onto the motor until fully seated. twist until the holes align, secure with 3 M3x8 screws.

![](images/anc_arp/PXL_20260406_204326320.png){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_204329758.png){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_204458647.png){ loading=lazy, width=45% } 

Put an M4x12 screw through a 4x13x5 bearing follow by 2 M4 washers, then screw it into the 4 mm hole in the center of the spool.

![](images/anc_arp/PXL_20260406_223504485.png){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_223525909.png){ loading=lazy, width=45% } 

### For powerline spools

Solder a JST ZH female plug housing onto the fixed end of the slip ring.

Use an "imp" pipe cutter to cut an 10 mm long peice of 10 mm diameter ABS tube. The same tube used on the marker box of the arp gripper. Glue the piece of tube in the hole on spool side A. You can use a coin to press it in. 

![](images/anc_arp/PXL_20260406_205618415.png){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_210024131.png){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_210115354.png){ loading=lazy, width=45% } 

When dry, put 3/8 * 7/8 stainless steel washer on the plastic tube, followed by a 10x15x4 bearing.

![](images/anc_arp/PXL_20260406_210024131.png){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_210024131.png){ loading=lazy, width=45% } 

Place the slip ring into the slip ring block and secure it using 2 M3x8 screws with an m4 washer on each in the 2/3 accessible screw holes. 

![](images/anc_arp/PXL_20260406_222724209.png){ loading=lazy, width=45% } 

Thread the rotating wire end through the tube in the spool about half way, and using the access you still have to the back of the spool, thread the wire out the side of the spool through the wire hole. don't sinch it all the way down yet in order to leave room for the screws that secure the motor.

![](images/anc_arp/PXL_20260406_222828687.png){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_222858249.png){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_222913517.png){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_222926713.png){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_222955593.png){ loading=lazy, width=45% } 

Press the motor into the spool, align the holes and secure with 3 M3x8 screws.
Now fully seat the slip ring against the side of the spool by gently pulling the wires through.

![](images/anc_arp/PXL_20260406_224446321.png){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_223012482.png){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_223116803.png){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_223140281.png){ loading=lazy, width=45% } 


## Frame

Install the lower spool first. Insert the plug downwards through the rectangular hole on the lower spool side of the frame. Align the motor's shaft so the gap points down and the flat sides are vertical. slide it into the slot, pulling the wire through as you go. seat it fimly in the slot, and in the bearing cup on the other side. spin and confirm it's not crooked. Secure the motor from the outside of the frame with 3 M3x8 screws.

![](images/anc_arp/PXL_20260406_223235451.png){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_223306060.png){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_223630852.png){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_223645100.png){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_223836849.png){ loading=lazy, width=45% } 

If the higher spool is a regular spool, print the variant of the slip ring block made for regular spools instead of slip rings. press it onto the bearing that protrudes from the unmounted spool.

If the higher spool is the powerline spool, it already has a bearing block on it. sinch the wire down firmly by pulling it through the spool till the slip ring cannot get any closer to the spool.

Same as the other one, thread the plug, align the shaft, and align the bearing block on the other side. secure the motor with with 3 M3x8 screws from the outside of the frame, and secure the bearing block with two M3x8 screws.

![](images/anc_arp/PXL_20260406_223922541.png){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_224601216.png){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_224701685.png){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_224812284.png){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_231646223.png){ loading=lazy, width=45% } 

Secure the "sunglasses" rounded side down with 4 M3x14 screws.

## Electronics

Assemble a Raspberry Pi Zero 2W with a Stringman imaged SD card and heat sink.
Press a Stringman anchor hat onto the raspberry pi.

![](images/anc_arp/PXL_20260407_003331054.png){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_231720003.png){ loading=lazy, width=45% } 

Connect a Camera Module 3 standard FOV to the pi with an 8cm or 4cm mini ribbon cable.

Screw a camera angle mount piece (printed) to the camera. (front right when looking at the lens with the ribbon connector on top)

put spacers in the corners between the two boards and screw it into the bottom of the frame with four M2.5x18 screws.

Screw the camera angle mount to the frame with 1 M2.5x6 screw.

If a powerline is present, on this anchor thread the slip ring's JST-ZH connector through the vertical hole in the frame and plug it into the board in the header marked "slip ring 24v"

For the powerline spool, with heat shrink tubing, splice the end of a 7 meter length of FEP cable onto the spools slip ring wire, tighen heatshrink and secure with tape.

# Spool winding

Power on the device and ssh into it with 

    ssh -L 5000:localhost:5000 pi@<hostname or ip>

run

    source /opt/robot/env/bin/activate
    damiao gui

On your local machine visit `http://localhost:5000`

Plug in only the lower motor into the hat.

Click scan. A single motor with id = 0x001 should appear.
in the registers, edit the feeback id to be 0x001. click save, then click store parameters

unplug this motor from the hat and plug in the other motor. scan again to find a motor with id 1
set it's feedback id to 0x002 and it's receive id to 0x002. click save and store parameters.

Unplug it, replug it, and then plug in the other motor too. Now both are plugged in and have different ids and are properly initialized.

Rescan for motors and confirm you have both of them.

Tie on your fishing line to the spool at the little point meant for this purpose and prepare to wind it.

The lower motor has id 1. with the motor you are winding selected, change the control mode to VEL and vel=0 click enable. the motor should feel rigid.

On low motors, use negative velocities to wind. on high motors use positive velocities. the wire should come off the top of the spool.

Set a velocity between 1 and 3, check "continuous" and click *send command* to spin the motor. let 7 meters wind on, and click stop.

When you have both wound, power off.

Feed the end of the wires/lines through the hole in the sunglasses.

For fishing lines, tie on a small carabiner with a palomar knot.
For power lines, tie on a carabiner *above the splice* with a buntline hitch.

## mount on the wall

Pick two opposing corners to be where the anchors are mounted. they should be the corners with the best view of the floor.

### prepare
Print the wood/stud mount bracket at 100% infill. (2x)
Start two 3in self tapping wood screws in the holes of the peices.
Plug in the power supply and barrel jack extension cable into an outlet near the corner where you are mounting.

### on the step ladder

Bring up the ladder

 * drill
 * bracket peice
 * the anchor you assembled
 * the end of the power plug
 * the decorative cover

Screw the bracket into the wall corner. Don't overtighten if the piece appears to bend. it must be straight to function. Slide the anchor down onto the bracket from the top. plug in the power.

Snap on the decorative cover.

Grab the end of both lines and bring them down with you enough that you can reach them without the ladder. leave them hanging.

repeat in the opposite corner.

### eyelets

In the two other corners of the room, mount ceramic eyelets with a single wood screw into a stud in the wall corner.

From each anchor, pull it's leftmost line over to the adjacent wall corner on the same side, thread it through the eyelet, and let it hang there.



