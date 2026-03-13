# Arpeggio Gripper Build Guide

Hardware Version: Arpeggio

**Print time**: about 20 hours, or about 40 hours if using multicolor instead of stickers for apriltags
**Build time**: about 2 hours

First you should have printed the parts according to the [print guide](print_guide.md)

## Bill of Materials

[Stringman Arpeggio Gripper BOM](https://docs.google.com/spreadsheets/d/1bZy7uijzaD2q74BN9S1-xETvV-d4Wz9Zg1J2bpjwM2k/edit?usp=sharing)

## Tool list

 - [Mini screwdriver with a bit set](https://www.amazon.com/dp/B01KB02F9C)
 - [Cross locking tweezers](https://www.amazon.com/dp/B001BU9MLG)
 - Super glue ([loctite super glue “professional liquid”](https://www.amazon.com/dp/B07VL6MP94?ref_=ppx_hzsearch_conn_dt_b_fed_asin_title_1&th=1) recommended)
 - exacto/hobby knife
 - flush cut wire clippers

Please excuse the changing colors of the parts in this guide. It it is a better use of my time to only update sections which have changed as I develop stringman.
I will make a final pass when the hardware is stable.

## Fingers

Attach a fork to the back of a finger pad. Forks and finger pads are both symmetrical. There is no left and right finger. Insert an M3x30 bolt through the upper hole, followed by a washer and a lock nut. Tighten the nylock nut until no slack remains, then back off until the rod can swing with no out of plane motion. Repeat for the other finger.

![](images/grip_arp/PXL_20260202_230937789.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260202_231747398.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260202_232158785.jpg){ loading=lazy, width=45% }

Slide in a geared lever into the finger assembly with it's flat face coplanar with the finger's flat flace.
Insert an M4x25 bolt through the assembly and a M4 lock nut on the other side.

If you are able to, try to get two M4 washers into the gaps as the bolt comes through. (its not necessary but reduces noise. I have found that you can use a pocket knife to push the washer in while holding it centered with an allen wrench in the hole)

Tighten and then back off just until the mechanism moves freely. Repeat with the other finger.

![](images/grip_arp/PXL_20260202_232316889.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260202_232326116.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260202_232502475.jpg){ loading=lazy, width=45% }

Locate the pressure sense connector. It is a 2-pin 1.00mm pitch male JST-SH connector with 20cm wire ends.

Place heat shrink tubing on the wires and solder them to the pressure sensitive resistor. Polarity is irrelevant.
If you purchase a hardware kit, you should have this pre soldered. Stick the resistor pad onto the finger which has a wire channel in it. Clip the wings off the JST-SH connector with flush cut wire clippers and feed the plug through the channel in the finger.

![](images/grip_arp/PXL_20260306_234806045.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260306_234823899.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260306_234902743.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260306_234931459.jpg){ loading=lazy, width=45% }


Cover the flat face of the finger with a strip of adhesive backed foam. Start from the top edge of the finger (nearest the gear) make one end of the foam meet this edge, stick down the foam and you will have about 10mm sticking off the end. Fold it over the edge.
Press the finger flat against a desk to firmly stick it down everywhere. Then with an exacto knife, cut the foam right down the crack where the two finger peices slide past eachother as pictured. finally, Cut a relief slit on both sides where finger pad curves and narrows so you can fold the remaining foam around the sides.

Repeat with the other finger.

![](images/grip_arp/PXL_20260213_005100134.MP.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260213_005140781.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260213_005143687.MP.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260213_005303717.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260213_005448442.jpg){ loading=lazy, width=45% }

Don't worry if it's not too precise. Foam grip tape is cheap and should be replaced at regular intervals anyway.

## Motors

Attach the aluminum servo horns to both motors with the included M3x6 center screw. Use the one with the ridges inside.

![](images/grip_arp/PXL_20260202_235656620.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260202_235805556.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260203_000043825.jpg){ loading=lazy, width=45% }

Snap two m3x6 screws into the finger drive gear from the sides. For this you cannot use the phillips head screws that come with the STS3215 you need to use the black hex screws that have a thinner head.

!!! tip "Print Settings"

    The drive gear will not have sufficient strength if printed with PLA. PCTG is known to work, but only at a higher than usual nozzle tempurature of 265°C.

![](images/grip_arp/PXL_20260203_000259321.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260203_000335130.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260203_000403398.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260203_000448440.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260203_000606648.jpg){ loading=lazy, width=45% }

Plug a three wire SPOX cable into each motor. (The wire that comes in the box with the motor)

## Body Assembly

After printing, tear the ears off the mechanism lid print. Clean up the area the bridge was supporting with a sharp tool.

![](images/grip_arp/PXL_20260203_000631994.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260203_000701647.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260203_000839400.jpg){ loading=lazy, width=45% }

Attach the finger motor to the inside of mechanism_lid with four of the smallest screws included with the motors.

![](images/grip_arp/PXL_20260203_000923523.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260203_001026556.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260203_001106920.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260203_001205714.jpg){ loading=lazy, width=45% }

Attach a 30mm fan to the mechanism lid using two M3x10 screws in opposite corners. ensure the airflow points outwards.

![](images/grip_arp/PXL_20260306_233719266.MP.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260306_233758557.jpg){ loading=lazy, width=45% }

Locate the printed back plate (the largest piece)
Insert two M4x25 bolts into the back plate from the bottom, hold them in as you place it on the table. Followed by two M4 washers.

![](images/grip_arp/PXL_20260306_233949642.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260306_234013867.jpg){ loading=lazy, width=45% }

Mesh the two geared levers together in the closed position, making sure they are aligned correctly. They must remain meshed the entire time. Use a rubber band to hold them together if necessary.  

Feed the plug of the pressure sense wire through the smile shaped slot in back_plate, and place the fingers on the bolts simultaneously, keeping them meshed, and keeping the sense wire from being pinched anywhere.

Place M4 washers over the bolts after they protrude from the fingers.

![](images/grip_arp/PXL_20260306_235338516.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260307_001018771.jpg){ loading=lazy, width=45% }

Place the mechanism lid and finger motor assembly onto the back plate, gently wiggle everything in order to get it to fit. The two M4x25 bolts should go through the holes in mechanism_lid and the drive gear should mesh with the finger gears. The alignment tabs on the sides should line up. If you have trouble getting it on there, try pulling the m3x15 bolts back a bit into the fingers, make the gear mesh first, then push the bolts through.

Insert two M4 nuts into the hexagonal holes. Tighten the bolts from behind and then back off enough that the geared levers move freely.

![](images/grip_arp/PXL_20260307_001034652.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260307_001123623.jpg){ loading=lazy, width=45% }

Screw in a single M4x10 screw into the center hole in the back plate. this provides some stability to the finger drive gear.

![](images/grip_arp/PXL_20260307_001143714.jpg){ loading=lazy, width=45% }

Secure the lid around the edges with four M3x10 screws

![](images/grip_arp/PXL_20260307_001421462.jpg){ loading=lazy, width=45% }

## Electronics

Select a raspberry pi zero 2w. you can either buy the one with the full header, or one with no header and solder header pins on only the first 6 pins of each row.

Stick a heat sink onto the black chip.

![](images/grip_arp/image11.png){ loading=lazy, width=45% }

Press the Strinman Gripper Hat onto the raspberry pi.

![](images/grip_arp/PXL_20260203_002527211.jpg){ loading=lazy, width=45% }

Insert spacers between the two boards, and insert M2.5x14 through the boards and spacers. Only three corners are used since the ribbon cable is in the path of one of them. use screws and spacers only in the three holes pictured.

![](images/grip_arp/PXL_20260307_163945036.jpg){ loading=lazy, width=45% }

Unpack one [**Wide** angle Rasberry Pi Camera Module 3](https://www.digikey.com/en/products/detail/raspberry-pi/SC1224/17278644) and install an 8cm mini cable. The wide end of the mini ribbon cable plugs in the camera. Very carefully and gently pull out both sides of the black retaining clip in the Raspberry Pis ribbon cable connector. Insert the ribbon cable, black side up, under the retention clip. Push the clip back in to secure it. If the clip falls out, you can put it back in with tweezers by inserting one side at a time.

Layout the parts as pictured screw the camera to the camera mount with two M2x4 bolts in opposite corners. Then, folding the ribbon as pictured, place the board stack on the mount and screw it in in the three corners that have screws.

![](images/grip_arp/PXL_20260307_001646350.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260307_001725647.MP.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260307_001727665.MP.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260303_144334089.jpg){ loading=lazy, width=45% }

Open the gripper fingers. Attach the camera mount assembly to the back plate with an M3x6 countersunk screw.

![](images/grip_arp/PXL_20260203_003116011.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260203_003125474.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260203_003143036.jpg){ loading=lazy, width=45% }

Fold the two fork shaped linkages into place so their remaining holes align with the holes in the gripper body.  
Attach these with four M3x14 screws.
After connecting them all, test the movement of the gripper. If they do not move freely enough, loosen the screws a little.

![](images/grip_arp/PXL_20260203_004935923.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260203_005029210.jpg){ loading=lazy, width=45% }

Plug the pressure sense plug into the Gripper Hat's "pressure" socket.

Image an SD card according to the instructions in [Raspi Setup](raspi_setup.md) and insert it into the SD card slot.

![](images/grip_arp/PXL_20260203_003359996.jpg){ loading=lazy, width=45% }

Solder the straight header onto the rangefinder. You can solder all six or just the four lablelld VIN, GND, SCL, and SCA.
Feed the 4p rectangular dupont plug out of the horizontal slot near the fan and plug it into the rangefinder. note that in this case white is on the VIN plug. I didn't have control of the colors in these wires.

Attach the rangefinder to the frame with two M2x4 screws.  
Feed the other connector through the frame and connect the rangefinder to the gripper hat's stemma socket.

![](images/grip_arp/PXL_20260203_003557749.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260307_003643671.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260203_004822533.jpg){ loading=lazy, width=45% }

Plug in the Fan into to 5V socket labelled FAN. Image coming soon.

## Wrist motor

Attach a bracket to the remaining motor in the pictured orientation. Secure with four of the included small tapping screws from the motor box.

![](images/grip_arp/PXL_20260203_005137842.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260203_005244290.jpg){ loading=lazy, width=45% }

Attach the three-holed helical wrist drive gear to the motor horn with two M3x6 screws.

![](images/grip_arp/PXL_20260203_005323886.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260203_005434275.jpg){ loading=lazy, width=45% }

Attach this motor bracket to the gripper with two M3x6 screws.

![](images/grip_arp/PXL_20260203_005851153.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260203_005932229.jpg){ loading=lazy, width=45% }

Plug the finger motor into the motor port on he Gripper Hat. Leave the wrist motor unconnected for now.

![](images/grip_arp/PXL_20260203_010458913.jpg){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260203_010504029.jpg){ loading=lazy, width=45% }

## Marker Display Box

The marker display box is a passive component that displays april tags at the point where the lines meet.
It was previously called the gantry and so you may find it referred to by that name.
The marker display box is connected to the gripper by a [50cm ABS tube with a diameter of 10mm](https://www.aliexpress.us/item/3256804916904509.html).

Put a 10x15x4 bearing onto the ABS tube followed by a 3/8" x 7/8" steel washer. 

Make a mark 6.5mm from the end of the tube with a sharpie pen.
*Forcefully twist* the helical gear onto the tube until the marked 6mm of tube protrude past the gear.

Put a few drops of cyanoacrylate glue where the gear and tube touch, followed by another washer and press it firmly to glue it there.

![](images/grip_arp/PXL_20260203_024931510.jpg){ loading=lazy, width=45% }
![](images/grip_arp/tube.png){ loading=lazy, width=45% }

!!! tip "Multicolor print or stickers"

    You can either print the marker box in multi color for a more durable result (19h) or print it in white and add stickers (3h)
    If printing in multicolor, you can find it in the STL download in `multicolor prints for bambu/platform box.3mf`

    STLs are on the [downloads page](downloads.md/#__tabbed_1_2)

Locate or print the gantry marker tags.
If you are printing them, This is the [sticker paper on amazon](https://www.amazon.com/dp/B092444Z49) and the [document with the marker images is here](https://docs.google.com/document/d/1B41dnssHsm1Db0LiHVgLatEv6H1jt0amIagw2v5_7dU/edit?usp=sharing). It must be printed without margins.
Cut the stickers apart into squares. 

![](images/grip_arp/PXL_20260205_164916211.jpg){ loading=lazy, width=45% } 
![](images/grip_arp/PXL_20260205_165341642.jpg){ loading=lazy, width=45% } 

Score a triangle in a corner on the back of each one. This makes it easier to remove the backing.
Put stickers on all four sides of the marker box. Note the orientation, the "stem" of the tree is at the bottom.

![](images/grip_arp/PXL_20260205_165401639.jpg){ loading=lazy, width=45% } 
![](images/grip_arp/PXL_20260205_165456666.jpg){ loading=lazy, width=45% } 
![](images/grip_arp/PXL_20260205_165525637.jpg){ loading=lazy, width=45% } 
![](images/grip_arp/PXL_20260205_165608693.jpg){ loading=lazy, width=45% } 
![](images/grip_arp/PXL_20260205_165947320.jpg){ loading=lazy, width=45% } 

Forcefully twist the other end (with no bearing) of the ABS rod into it until it bottoms out. Again, it's intentionally a very tight fit. Put a drop of cyanoacrylate glue on it from the bottom.

![](images/grip_arp/PXL_20260205_170008890.jpg){ loading=lazy, width=45% } 
![](images/grip_arp/PXL_20260205_170030767.jpg){ loading=lazy, width=45% } 

Put another steel washer on the bottom of the tube under the bearing, and holding it in place, slide the gear end of the tube into the slot in the top of the gripper until firmly seated. Press the wrist block into the opening firmly and secure with three m2.5x6 screws.

![](images/grip_arp/PXL_20260205_170146100.jpg){ loading=lazy, width=45% } 
![](images/grip_arp/PXL_20260205_170203710.jpg){ loading=lazy, width=45% } 
![](images/grip_arp/PXL_20260205_170329058.jpg){ loading=lazy, width=45% } 
![](images/grip_arp/PXL_20260205_170451870.jpg){ loading=lazy, width=45% } 

Find (or create yourself) the 75cm cable with male JST ZH plugs at both ends. Thread it into the top of the display box, down the tube, into the gripper, and out the hole on the side of the gripper. Plug the cable into the gripper hat. (this photo is inaccurate and will be replaced)

![](images/grip_arp/PXL_20260205_205501032.jpg){ loading=lazy, width=45% } 
![](images/grip_arp/PXL_20260205_205556987.jpg){ loading=lazy, width=45% } 

## Check out tests and calibration

Find (or create yourself) the barrel jack to Female JST ZH adapter. Plug this into the wire at the top of the display box, and use one of the anchor power supplies (24V) to power on the gripper.

![](images/grip_arp/PXL_20260205_210000179.jpg){ loading=lazy, width=45% } 

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

Screw on the front and back face plates with three M3x4 screws on each side. Two at the top near the pole, one at the botttom near the sensors.

![](images/grip_arp/PXL_20260207_193350888.jpg){ loading=lazy, width=45% } 
![](images/grip_arp/PXL_20260207_193526006.jpg){ loading=lazy, width=45% } 

Complete! you are now in possession of one complete gripper - the most complex part of Stringman.

Now you can move on to [Tie up](installation_guide.md).