# Gripper Build Guide

Hardware Version: Arpeggio

**Print time**: about 12 hours  
**Build time**: about 2 hours

First you should have printed the parts according to the [print guide](print_guide.md)

## Tool list

 - [Mini screwdriver with a bit set](https://www.amazon.com/dp/B01KB02F9C)
 - Soldering iron
 - [Cross locking tweezers](https://www.amazon.com/dp/B001BU9MLG)
 - Super glue ([loctite super glue “professional liquid”](https://www.amazon.com/dp/B07VL6MP94?ref_=ppx_hzsearch_conn_dt_b_fed_asin_title_1&th=1) recommended)

## Fingers

Attach a fork to the back of a finger pad. Forks and finger pads are both symmetrical. There is no left and right finger. Insert an M3x30 bolt through the upper hole, followed by a washer and a lock nut. Tighten the nylock nut until no slack remains, then back off until the rod can swing with no out of plane motion. Repeat for the other finger.

![](images/grip/PXL_20260202_230937789.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260202_231747398.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260202_232158785.jpg){ loading=lazy, width=45% }

Slide in a geared lever into the finger assembly with it's flat face coplanar with the finger's flat flace.
Insert an M4x25 bolt through the assembly and a M4 lock nut on the other side.

If you are able to, try to get two M4 washers into the gaps as the bolt comes through. (its not necessary but reduces noise. I have found that you can use a pocket knife to push the washer in while holding it centered with an allen wrench in the hole)

Tighten and then back off just until the mechanism moves freely. Repeat with the other finger.

![](images/grip/PXL_20260202_232316889.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260202_232326116.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260202_232502475.jpg){ loading=lazy, width=45% }

Locate the pressure sense connector. It is a two pin 2.54 pitch female molex plug with about 20cm of wire ends.

Select the finger with the wire channel. Feed the wires through the small hole starting at the gear and leading down towards the finger joint. Push them down the channel, till they pop out of the face near the joint, thenput them all they way through.

Place a very small piece of heat shrink on each wire.
Strip the ends of the wires, solder the pressure sense resistor to the wires in such a way that they are not twisted. there is no polarity, but there is not enough room for a twist.
Remove the adhesive backing and stick the sensor in the center of the finger pad, feeding any excess wire back through the channel.

![](images/grip/PXL_20260202_233628696.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260202_234837799.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260202_235006310.jpg){ loading=lazy, width=45% }

Cover the face of the finger in adhesive backed foam and trim it to size.
When trimming the foam, you don’t have to be very precise, and it doesn't have to go exactly to the edge.

![](images/grip/PXL_20260202_235130566.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260202_235538809.jpg){ loading=lazy, width=45% }

## Motors

Attach the aluminum servo horns to both motors with the included M3x6 center screw. Use the one with the ridges inside.

![](images/grip/PXL_20260202_235656620.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260202_235805556.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_000043825.jpg){ loading=lazy, width=45% }

Snap two m3x6 screws into the finger drive gear from the sides. For this you cannot use the phillips head screws that come with the STS3215 you need to use the black hex screws that have a thinner head.

![](images/grip/PXL_20260203_000259321.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_000335130.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_000403398.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_000448440.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_000606648.jpg){ loading=lazy, width=45% }

Plug a three wire SPOX cable into each motor.

## Body Assembly

After printing, tear the ears off the mechanism lid print. Clean up the area the bridge was supporting with a sharp tool.

![](images/grip/PXL_20260203_000631994.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_000701647.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_000839400.jpg){ loading=lazy, width=45% }

Attach the finger motor to the inside of mechanism_lid with four of the smallest screws included with the motors.

![](images/grip/PXL_20260203_000923523.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_001026556.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_001106920.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_001205714.jpg){ loading=lazy, width=45% }

Locate the printed back plate (the largest piece)
Insert two M4x25 bolts into the back plate from the bottom, hold them in as you place it on the table. Followed by two M4 washers.

Mesh the two geared levers together in the closed position, making sure they are aligned correctly. They must remain meshed the entire time. Use a rubber band to hold them together if necessary.  

Feed the plug of the pressure sense wire through the smile shaped slot in back_plate, and place the fingers on the bolts simultaneously, keeping them meshed, and keeping the sens wire from being pinched anywhere.

![](images/grip/PXL_20260203_001253755.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_001317876.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_001428724.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_001453658.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_001516533.jpg){ loading=lazy, width=45% }

Place M4 washers over the bolts after they protrude from the fingers.

![](images/grip/PXL_20260203_001535809.jpg){ loading=lazy, width=45% }

Place the mechanism lid and finger motor assembly onto the back plate, gently wiggle everything in order to get it to fit. The two M4x25 bolts should go through the holes in mechanism_lid and the drive gear should mesh with the finger gears. The alignment tabs on the sides should line up. Repeatedly opening and closing the fingers a small angle will help it all fit together.

Insert two M4 nuts into the hexagonal holes. Tighten the bolts from behind and then back off enough that the geared levers move freely. 

![](images/grip/PXL_20260203_001602302.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_001728885.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_001740800.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_001817066.jpg){ loading=lazy, width=45% }

Secure the lid around the edges with four M3x10 bolts

![](images/grip/PXL_20260203_001846992.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_001936613.jpg){ loading=lazy, width=45% }

## Electronics

Unpack one Wide angle Camera Module and install an 8cm mini cable. (golden one) the wide end of the mini ribbon cable plugs in the camera, with its black face on the camera’s back side. The plastic retaining clip is pulled out to loosen a ribbon cable, and pushed in to secure one.  
screw the camera to the camera mount with two M2x4 bolts in opposite corners. Make sure the ribbon is in the pictured direction.

![](images/grip/PXL_20260203_002216883.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_002249091.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_002418793.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_002452120.jpg){ loading=lazy, width=45% }

Stick a heat sink onto a Raspberry Pi Zero 2W (with header). It goes on the black chip.

![](images/grip/image11.png){ loading=lazy, width=45% }

Press the Strinman Gripper Hat onto the raspberry pi.

![](images/grip/PXL_20260203_002527211.jpg){ loading=lazy, width=45% }

Insert spacers between the two boards, and insert M2.5x14 through the boards and spacers. Only three corners are used since the ribbon cable is in the path of one of them.

Attach the PCBs to the camera mount in the three corners that have screw holes.

![](images/grip/PXL_20260203_002857085.jpg){ loading=lazy, width=45% }

Fold the ribbon cable over as shown and insert it into the raspberry pi zero 2w's connector. Be careful it is very delicate.

Very carefully and gently pull out both sides of the black retaining clip in the Raspberry Pis ribbon cable connector. (Zoom in on the photo above to get a good look at it.) Insert the ribbon cable, black side up, under the retention clip. Push the clip back in to secure it. If the clip falls out, you can put it back in with tweezers by inserting one side at a time.

![](images/grip/PXL_20260203_002931578.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_002942002.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_003018515.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_003034854.jpg){ loading=lazy, width=45% }

Open the gripper fingers. Attach the camera mount assembly to the back plate with an M3x6 countersunk screw.

![](images/grip/PXL_20260203_003116011.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_003125474.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_003143036.jpg){ loading=lazy, width=45% }

Fold the two fork shaped linkages into place so their remaining holes align with the holes in the gripper body.  
Attach these with four M3x14 screws.
After connecting them all, test the movement of the gripper. If they do not move freely enough, loosen the screws a little.

![](images/grip/PXL_20260203_004935923.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_005029210.jpg){ loading=lazy, width=45% }

Plug the pressure sense plug into the Gripper Hat's "pressure" socket.

Image an SD card according to the instructions in [Raspi Setup](raspi_setup.md) and insert it into the SD card slot.

![](images/grip/PXL_20260203_003359996.jpg){ loading=lazy, width=45% }

Solder the straight header onto the rangefinder
Attach the rangefinder to the frame with two M2x4 screws.  
connect the rangefinder to the gripper hat's stemma socket.

![](images/grip/PXL_20260203_003557749.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_003848813.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_004633514.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_004822533.jpg){ loading=lazy, width=45% }

## Wrist motor

Attach a bracket to the remaining motor in the pictured orientation. Secure with four of the included small tapping screws from the motor box.

![](images/grip/PXL_20260203_005137842.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_005244290.jpg){ loading=lazy, width=45% }

Attach the three-holed helical wrist drive gear to the motor horn with two M3x6 screws.

![](images/grip/PXL_20260203_005323886.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_005434275.jpg){ loading=lazy, width=45% }

Attach this motor bracket to the gripper with two M3x6 screws.

![](images/grip/PXL_20260203_005851153.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_005932229.jpg){ loading=lazy, width=45% }

Plug the finger motor into the motor port on he Gripper Hat. Leave the wrist motor unconnected for now.

![](images/grip/PXL_20260203_010458913.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_010504029.jpg){ loading=lazy, width=45% }

## Marker Display Box

Put a 10x15x4 bearing onto the ABS tube followed by a 3/8" x 7/8" steel washer. 

Make a mark 6mm from the end of the tube with a sharpie pen.
Forcefully wwist the helical gear onto the tube until the marked 6mm of tube protrude past the gear.

![](images/grip/PXL_20260203_024931510.jpg){ loading=lazy, width=45% }
![](images/grip/PXL_20260203_151856981.jpg){ loading=lazy, width=45% }

Put a drop of cyanoacrylate glue where the gear and tube touch.

Stick marker codes onto all four sizes of the marker box.
If you are printing them, This is the [sticker paper on amazon](https://www.amazon.com/dp/B092444Z49) and the [document with the marker images is here](https://docs.google.com/document/d/1B41dnssHsm1Db0LiHVgLatEv6H1jt0amIagw2v5_7dU/edit?usp=sharing). It must be printed without margins.

Forcefully twist the other end (with no bearing) of the ABS rod into it until it bottoms out. Again, it's intentionally a very tight fit. Put a drop of cyanoacrylate glue on it from the bottom.

Put another steel washer on the bottom of the tube under the bearing, and holding it in place, slide the gear end of the tube into the slot in the top of the gripper until firmly seated. Press the wrist block into the opening firmly and secure with three m2.5x6 screws.

Find (or create yourself) the 75cm cable with male JST ZH plugs at both ends. Thread it into the top of the display box, down the tube, into the gripper, and out the hole on the side of the gripper. Plug the cable into the gripper hat.

## Check out tests and calibration

Find (or create yourself) the barrel jack to Female JST ZH adapter. Plug this into the wire at the top of the display box, and use one of the anchor power supplies (24V) to power on the gripper.

When the component boots it will look for wifi credentials using it's camera. Hold up a wifi share QR code to it and it should appear on your network and be detected by the control panel in under a minute.

You can generate a valid wifi share code with [qifi.org](http://qifi.org)


Find the IP or hostname of the device using your router and SSH into the pi with user `pi` and password `Fo0bar!!`

    ssh pi@<address>

Once in, stop the cranebot service and run the checkout script

    sudo systemctl stop cranebot.service
    /opt/robot/env/bin/qa-gripper-arp

This will prompt you to plug in the other motor.

At the end it prompts you to run ffplay on your host machine to verify the camera looks ok. closing the window on your host machine ends the script.
you can then run on the pi

    sudo shutdown now

and pull power when the green light goes out.

Complete! you are now in possession of one complete gripper - the most complex part of Stringman.

Proceed to the [Raspberry Pi Setup](raspi_setup.md) instructions and after that's done, there is a script in qa/gripper_eval.py that can help you confirm the gripper has been assembled correctly and you have good continuity on all conenctors. There's also a manual QA checklist in [Quality Assurance](quality_assurance.md)

![](images/grip/image82.png){ loading=lazy, width=45% }