# Gripper Build Guide

Hardware Version: Pilot run

Build time: about 3 hours

First you should have printed the parts according to the [print guide](print_guide.md)

## Tool list

 - Assorted allen wrenches  
 - [Mini screwdriver with a bit set](https://www.amazon.com/dp/B01KB02F9C)  
 - [Wire stripper that goes down to 30awg](https://www.amazon.com/dp/B07D25N45F)  
 - Soldering station with helping hands and a magnifier.  
 - Multimeter, preferably with spring loaded hook probes  
 - [Cross locking tweezers](https://www.amazon.com/dp/B001BU9MLG)  
 - [Mini side cutters](https://www.amazon.com/dp/B00FZPDG1K)  
 - Super glue ([loctite super glue “professional liquid”](https://www.amazon.com/dp/B07VL6MP94?ref_=ppx_hzsearch_conn_dt_b_fed_asin_title_1&th=1) recommended)  
 - Small pocket knife or exacto  
 - [Digital calipers](https://www.amazon.com/dp/B001AQEZ2W), for measuring things and identifying screws. Or just use a ruler 

## Fingers

Attach a rod to the side of a finger pad. The rod has one one location with an indentation for a bolt head. Insert an M3x14 bolt into this indentation, followed by a washer, then from the outside into the upper hole on the fingerpad (the one sized for m3), then a washer, then an m3 nylock nut. If the hole in either the rod or finger ended up small enough for the bolt to cut threads, just overotate the bolt to tear a smooth hole. Tighten the nylock nut until no slack remains, then back off until the rod can swing loosely with no out of plane motion. Repeat for all four rods on both finger-pads.

![](images/grip/image9.png){ loading=lazy, width=45% }
![](images/grip/image49.png){ loading=lazy, width=45% }

Press fit two bearings into each geared lever

![](images/grip/image53.png){ loading=lazy, width=45% }

Orient a finger-pad with the hex cutout on top. The flat side of the lever should align with the flat side of the finger.
Insert an M4x25 bolt into the finger-pad just from the bottom, place an M4 washer on. Slide in the geared lever with the bearing face up into the slot.  
If you are able to, try to get another M4 washer into the gap as the bolt comes through. (its not crucial but reduces play. I have found it easier if using a pocket knife to push the washer in from the side while viewing down the hole from the top)  
Secure it with an M4 nut in the cutout. Tighten and then back off just until the mechanism moves freely. Repeat with the other finger.

![](images/grip/image7.png){ loading=lazy, width=45% }
![](images/grip/image46.png){ loading=lazy, width=45% }  
![](images/grip/image50.png){ loading=lazy, width=45% }
![](images/grip/image34.png){ loading=lazy, width=45% }

Confirm everything you assembled is oriented just as pictured.

Locate the partially assembled pressure sense connector. It can be identified by the exposed resistor.
You can find the description of how to make one in the [Wire guide](wire_guide.md)

![](images/grip/image3.png){ loading=lazy, width=45% }

Feed the wires through the small hole on the side of geared\_lever\_right, pushing them down the channel, till they pop out of the face near the finger pad.
put them all they way through.

![](images/grip/image64.png){ loading=lazy, width=45% }

Strip the ends of the wires, solder the pressure sense resistor to the wires in such a way that they are not twisted. there is no polarity, but there is not enough room for a twist.  
Remove the adhesive backing and stick the sensor in the center of the finger pad, feeding any excess wire back through the channel.

![](images/grip/image72.png){ loading=lazy, width=45% }
![](images/grip/image70.png){ loading=lazy, width=45% }

Cover the face of the finger in adhesive backed foam and trim it to size.  
In this prototype I had to leave a bit of the pad exposed for clearance, but in the current version there is enough clearance to cover the pad in foam and have it still fold freely.  
When trimming the foam, you don’t have to be very precise, and often folding the foam over the corner is easier. It may even help with grip.

![](images/grip/image8.png){ loading=lazy, width=45% }
![](images/grip/image32.png){ loading=lazy, width=45% }

## Body Assembly

After printing, tear the ears off the mechanism lid print. Clean up the area the bridge was supporting with a sharp tool.

![](images/grip/image41.png){ loading=lazy, width=45% }

Insert two M4x25 bolts into the back plate from the bottom, hold them in as you place it on the table. Followed by two M4 washers.
Mesh the two geared levers together in the closed position, making sure they are aligned correctly. They must remain meshed the entire time. Use a rubber band to hold them together if necessary.  
Feed the plug of the pressure sense wire through the corresponding smile shaped slot, and place the fingers on the bolts simultaneously, keeping them meshed.
Place M4 washers over the bolts after they protrude from the fingers.

![](images/grip/image1.png){ loading=lazy, width=45% }
![](images/grip/image73.png){ loading=lazy, width=45% }

![](images/grip/image52.png){ loading=lazy, width=45% }
![](images/grip/image45.png){ loading=lazy, width=45% }

Press the small 9-tooth gear into the mouse wheel encoder.  
Locate the 6-pin JST-SH 1.0 pitch connector that has three untrimmed wires, the red, black, and yellow.  
Solder the connector to the mouse wheel encoder according to the picture

![](images/grip/image63.png){ loading=lazy, width=45% }
![](images/grip/image17.png){ loading=lazy, width=45% }

Feeding the connector through the hole, snap the mouse wheel encoder into the shaped indentation in the back plate. Make sure it is seated down firmly on the bottom.  
Press the encoder retainer into the opening, flat side up. It should be a tight fit that requires no glue, and glue is risky here as we don’t want to bind up the small moving part.

![](images/grip/image62.png){ loading=lazy, width=45% }
![](images/grip/image67.png){ loading=lazy, width=45% }

Glue together the two sides of the spool. It helps the glue dry if you put it around the sides instead of the middle.  
Press a 14mm steel tube into the hole on the gear side, followed by an m4 washer, followed by a 624ZZ bearing.  
Pressing these together is ideally done with a vice but is possible by hand.

![](images/grip/image71.png){ loading=lazy, width=45% }
![](images/grip/image44.png){ loading=lazy, width=45% }

Place a M3x6 button head screw upside down in the hole on the other side of the spool. Place one of the servo horn discs from the Injora motor box, over the screw, flat side down. Secure it with two M2.5x6 screws

![](images/grip/image16.png){ loading=lazy, width=45% }
![](images/grip/image30.png){ loading=lazy, width=45% }

Press the spool’s bearing into the counterbore on the flat side of the mechanism lid (not the back plate)

Please excuse the inaccuracy in this photo, the servo horn should be shown installed on the spool.  
![](images/grip/image20.png){ loading=lazy, width=45% }
![](images/grip/image4.png){ loading=lazy, width=45% }

Place the mechanism lid onto the back plate, gently wiggle the spool, and the fingers until everything fits into place and is seated firming.  
Insert two M4 nuts into the hexagonal holes. Tighten the bolts from behind and then back off enough that the geared levers move freely.  
Secure the lid around the edges with three M3x10 bolts

![](images/grip/image58.png){ loading=lazy, width=45% }
![](images/grip/image59.png){ loading=lazy, width=45% }

You received two Injora servo motors. One of them is labeled “360 winch”. Unpack that one.  
Install the rubber grommets into the mounting holes. Other than the grommets and the servo horn, we don’t need any of the other hardware that ships with it.  
Place the standoff onto the motor in the pictured orientation.

![](images/grip/image68.png){ loading=lazy, width=45% }
![](images/grip/image33.png){ loading=lazy, width=45% }

Manually rotate the spool so that the side hole shows through the window. It’s easier to do it before connecting the motor.  
Install the motor onto the spool by aligning the toothed shaft. Tighten the screw you embedded in the spool earlier with an allen key from the other side of the spool.

![](images/grip/image36.png){ loading=lazy, width=45% }
![](images/grip/image10.png){ loading=lazy, width=45% }

Secure the motor and standoff to the back plate using four M3x16 screws

![](images/grip/image22.png){ loading=lazy, width=45% }

Unpack one Camera Module and install the mini cable. (golden one) the wide end of the mini ribbon cable plugs in the camera, with its black face on the camera’s back side. The plastic retaining clip is pulled out to loosen a ribbon cable, and pushed in to secure one.  
screw the camera to the camera mount with two M2x4 bolts in opposite corners. Make sure the ribbon is in the pictured direction.

![](images/grip/image13.png){ loading=lazy, width=45% }
![](images/grip/image2.png){ loading=lazy, width=45% }

Attach the camera mount assembly to the back plate with an M3x6 countersunk screw.

![](images/grip/image35.png){ loading=lazy, width=45% }

Fold the four connecting rods into place so their remaining holes align with the holes in the gripper body.  
Attach each one with an M3x14 bolt. If the rod does not move freely, loosen the bold a little bit.  
After connecting them all, test the movement of the gripper.  
It’s mostly electronics from here out.

![](images/grip/image60.png){ loading=lazy, width=45% }
![](images/grip/image66.png){ loading=lazy, width=45% }

Locate one slip ring. Feed the wires from the rotor side into the hole in the spool bearing, through the tube, and out of the hole in the side of the spool  
It’s very tricky, and you need very small tweezers. Best to do one at a time.  
![](images/grip/image39.png){ loading=lazy, width=45% }

After you get them through, pull the slip ring up so it is seated on the frame and screw it down with three M3x4 screws.

![](images/grip/image69.png){ loading=lazy, width=45% }

## Electronics

Unpack the [Inventor Hat Mini](https://shop.pimoroni.com/products/inventor-hat-mini?variant=40588023464019) and cut the trace marked with a lightning bolt. This is how the inventor hat mini is configured to deliver power to the motors separately from itself and the Raspberry Pi. I’m no fan of cutting traces but I find the easiest way to do it is to hold the board down firmly (or in a vice) and dig into the trace hard with the tip of a small pocket knife. Confirm with a multimeter that the trace is truly severed.  
Solder a motor power screw terminal to the inventor hat mini. Holes facing out. Ask me how I know.

![](images/grip/image19.png){ loading=lazy, width=45% }
![](images/grip/image28.png){ loading=lazy, width=45% }

One of the raspberry pi’s you receive has headers pre-installed. This is the one meant for the gripper.  
Attach an aluminum heatsink to the black SOC chip. Install an SD card flashed according to the instructions in [Raspberry Pi Software Setup Guide](raspi_setup.md)  
Press the inventor hat mini straight down on top. It will not go all the way down, due to the heatsink, but that’s ok.  
![](images/grip/image11.png){ loading=lazy, width=45% }
![](images/grip/image12.png){ loading=lazy, width=45% }

Mount the Raspberry Pi and hat onto the gripper. Insert four M2.5x16 bolts up through the corners, four 9mm printed spacers between the two boards, and four 2mm printed spacers on the ends of the bolts.  
Hold everything sideways so the pieces don’t fall off and screw it to the back plate. The board should be mounted with the word INVENTOR upside-down. The ribbon cable can pass right underneath the Raspberry Pi

![](images/grip/image6.png){ loading=lazy, width=45% }
![](images/grip/image56.png){ loading=lazy, width=45% }
![](images/grip/image42.png){ loading=lazy, width=45% }

Very carefully and gently pull out both sides of the black retaining clip in the Raspberry Pis ribbon cable connector. (Zoom in on the photo above to get a good look at it.) Insert the ribbon cable, black side up, under the retention clip. Push the clip back in to secure it. If the clip falls out, you can put it back in with tweezers by inserting one side at a time.

![](images/grip/image26.png){ loading=lazy, width=45% }

How about something easy. Plug in the cable for the encoder into motor port A, and the winch servo into servo port 1.

![](images/grip/image23.png){ loading=lazy, width=45% }
 
Plug the pressure sense plug into the inventor hat mini in GPIO port 1. Note the direction with GND on the edge of the board and signal towards the middle.  
![](images/grip/image38.png){ loading=lazy, width=45% }
![](images/grip/image55.png){ loading=lazy, width=45% }


Attach the microswitch to the mechanism lid near the top of the gripper with two M2.5x10 screws in the pictured orientation.  
Locate the pictured connector. It is a 3-pin dupont connector with wires only in the outer two slots.
Strip and solder the wires to the two contacts of the microswitch closer to the hinge end.
Feed the dupont connector through the hole in the body and connect it to the inventor hat mini’s GPIO port 2. Direction doesn’t matter.

![](images/grip/image24.png){ loading=lazy, width=45% }
![](images/grip/image57.png){ loading=lazy, width=45% }
![](images/grip/image74.png){ loading=lazy, width=45% }

We have two additional sensors to connect. The IMU is the purple one, and the rangefinder is the black one with the little window. These will be on the I2C bus, but we have only one stemma port so you’ve been provided with a pre-made connector to chain them together.  
Solder a 4 pin straight header to the pins on the IMU that correspond to VCC thru SDA. And another 4 pin straight header on the VCC thru SCL pins of the rangefinder.

![](images/grip/image54.png){ loading=lazy, width=45% }

Attach the rangefinder to the frame with two M2x4 screws.  
Attach the IMU to the frame with two M3x4 screws.  
Plug in the 4-pin dupont connector that has doubles coming out of it into the IMU. VCC ond the end  
Plug the 4-pin dupond connector with singles into the rangefinder. VCC on the end.  
Feed the white connector through the hole to the other side and connect it to the stemma port on the Inventor Hat Mini

![](images/grip/image27.png){ loading=lazy, width=45% }
![](images/grip/image31.png){ loading=lazy, width=45% }

Locate the larger DC-DC buck converter. This will take the 24v coming through the slip ring and convert it to 6v for the servos.
In our hardware kit, it is already tuned for 6v, but if you bought your own, tune it now.
Solder 15cm of 28awg silicone red black pair to the output side and 15cm to the input side. This isn't an input technically, just a take-off to another regulator we will add next for the microcontroller.

![](images/grip/image51.png){ loading=lazy, width=45% }

Mount this onto the mechanism lid with two M3x4 screws. Output side towards the outside of the gripper. Feed all the wires through the nearby hole to the other side.

![](images/grip/image37.png){ loading=lazy, width=45% }

Trim the wires that come from the stator side of the slip ring so that they reach the input side of the buck converter with plenty of room to go around the motor that isn’t there yet.  
Strip the ends, and solder them to the input side of the buck converter.  
Here you can see I temporarily disconnected the connector for the rangefinder since it was in the way.

![](images/grip/image43.png){ loading=lazy, width=45% }

Flip the gripper over and position it so that the two 28 awg red and black wires that we fed through the hole before are in reach of your helping hands and soldering iron.  
Note that these are the smaller wires we connected to the \*input\* side of the buck converter along with the slip ring wires. They carry 24v.  
Solder these to the input of one of the small green buck converters.  
Strip a 2cm piece of solid core wire so that one end has about 6mm of exposed core to use as a pin. Solder the short stripped end to the output vcc of this small converter.

![](images/grip/image25.png){ loading=lazy, width=45% }

Both of these buck converters are adjustable, but have been pre-tuned to the correct voltage. The small one to 5v and the large one to 6v.  
But just to be extra sure. I think you should confirm the voltage is correct before connecting them.  
If you have a desktop power supply, or care to jerry rig one of the supplies you got in the box, connect it to the input side of the slip ring and confirm the voltage on the output side of the converters.

Tin the ends of the 22awg red and black pair and insert them into the screw terminal. Ground is on the left and you can see the silkscreen on the underside of the inventor hat mini if you turn it up to the light.  
Hold the screw terminal as you tighten so the torque doesn’t break its solder joint.

Now, to deliver 5v to the raspberry pi, jam the solid core wire into the corner pin hole on top of the inventor hat mini.  
Ok now that you tried that, you’re thinking “there’s already a pin in there coming up from the bottom, I can’t put this in”. I know. I didn’t say put it in, I said *jam* it in. Use the cross locking pliers to hold it close to the base and push it in next to the other pin.  
Maybe in the future I will deliver 5v to the raspberry pi in some saner way like the USB port.

![](images/grip/image15.png){ loading=lazy, width=45% }

## Drive Gear

Prepare the drive gear.
Set an M3x6 button head screw in the indentation upside down, and then trap it there by screwing on a servo horn disc just as you did with the spool. Secure with two M2.5x6 screws

![](images/grip/image29.png){ loading=lazy, width=45% }

Attach the gear to the 270° servo with an allen wrench.

![](images/grip/image14.png){ loading=lazy, width=45% }

Insert an M4x12 screw into the back plate in this hole, screwing it in just until it is flush with the inside surface.

![](images/grip/image5.png){ loading=lazy, width=45% }
![](images/grip/image65.png){ loading=lazy, width=45% }

The drive gear servo must be installed in the fully open position. If you have a servo tester you can command the servo to move to it's lowest value (500ms). Otherwise, you can use the rasberry pi, but it's more involved.

??? example "Using the raspberry pi to manually move the servo"

	Connect the unit to 24v power temporarily. The easiest way to do this is a pair of aligator clips but you can also solder a dc barrel jack on the two leads that come from the spool’s side hole.  
	Find out the raspberry pi’s ip address on your network.  
	SSH into it with  

	    ssh pi@192.160.1.156  

	Or whatever username and password you chose when creating the image.  
	Clone [cranebot-firmware](https://github.com/nhnifong/cranebot3-firmware)

	    git clone https://github.com/nhnifong/cranebot3-firmware.git
		cd cranebot3-firmware
		python3 -m venv --system-site-packages venv
		source venv/bin/activate
		pip3 install -r requirements_raspi.txt

	Start a python shell in the virtual environment  

	    from inventorhatmini import InventorHATMini, SERVO_2  
	    hat = InventorHATMini(init_leds=False)

	To manually control the grip servo you can send \-90 for full open, or 90 for full closed.  
	Set a value of negative \-90  

	    hat.servos[SERVO_2].value(-90)  

	![](images/grip/image40.png){ loading=lazy, width=45% }

Manually open the fingers to the pictured position.  
Insert the grip servo into its slot, rotated a few degrees to the left (in this position the gear teeth don’t mesh)  
Gripping the servo tightly while keeping it pressed into the frame, turn it clockwise a few degrees. In this position, the gear teeth mesh.  
Tighten the M4 screw on the back. It aligns with the gear’s bore and holds it straight.  
Send a servo command of 90 to close the grip. Confirm it closes tightly with no gap at all. Reopen the grip by sending \-90. If there was any gap, adjust the fingers closed by one gear tooth, and repeat.  
Secure the motor in place with four M3x10 screws.

![](images/grip/image48.png){ loading=lazy, width=45% }
![](images/grip/image18.png){ loading=lazy, width=45% }
![](images/grip/image47.png){ loading=lazy, width=45% }

## Gripper Spool Connection

Verify that the spool in your gripper has the hole facing the window. If not spin it now either with a servo tester, or by pushing on the gear teeth with your tweezers.

Create a 2 meter peice of FEP tether power line and thread one end (all three strands) through the hole at the top of the gripper so it goes behind the spool and up and out the window as pictured. use your tweezers to grab it.

![](images/grip/image13-g.jpg){ loading=lazy, width=45% }
![](images/grip/image14-g.jpg){ loading=lazy, width=45% }
![](images/grip/image1-g.jpg){ loading=lazy, width=45% }

Grab only the fishing line and insert the end into the small hole in the spool, such that it comes back out of the adjacent larger hole. Tie off the fishing line with a triple square knot. it is extremely tricky and the only way to do it is with the cross locking tweezers and maybe another normal pair of tweezers or needle nose pliers. 


![](images/grip/image31-g.jpg){ loading=lazy, width=45% }
![](images/grip/image32-g.jpg){ loading=lazy, width=45% }
![](images/grip/image33-g.jpg){ loading=lazy, width=45% }

Cut the wires from the power-line and the wires from the slip ring to the shortest length that you can while still having space to comfortably splice them with helping hands.


!!! note "Design cosideration"

    Since the fishing line is now shorter than the wires, it will bear the weight even if all the line is unwound, protecting the wire splices from stress. but if the loop of wire is too long, it may not stay buried under the windings, and this can cause it to get stuck in the gear so it needs to be short. If you can't make it short at least tape it down.

Prepare one narrow heat shrink tube cut in two. Put them onto the wires before beginning the splice.

Splice the grey-red and black-black. activate the heat shrink but keep your heat away from the braided fishing line. 

![](images/grip/image15-g.jpg){ loading=lazy, width=45% }

Pull the line tight out of the top of the gripper. plug in the winch servo to a servo tester and use it to carefully wind your two meters of power line onto the spool.

![](images/grip/image18-g.jpg){ loading=lazy, width=45% }

Print the outer shells in the color of your choice and trim any support material.
The outer shells press onto each side. each shell half is secured with two M3x4 screws at the top, and one at the bottom.

![](images/grip/image21.png){ loading=lazy, width=45% }
![](images/grip/image75.png){ loading=lazy, width=45% }
![](images/grip/image77.png){ loading=lazy, width=45% }

Tie a fishing swivel onto the end of the fishing line with a [palomar knot](https://www.animatedknots.com/palomar-knot).

![](images/grip/image78.png){ loading=lazy, width=45% }

Put two peices of heat shink on the leads of a male JST 1.25 2P connector.

![](images/grip/image79.png){ loading=lazy, width=45% }

Splice the grey/red wires and black/black wires. Activiate the heat shrink. keep heat away from the fishing line.

![](images/grip/image80.png){ loading=lazy, width=45% }
![](images/grip/image81.png){ loading=lazy, width=45% }

Complete! you are now in possession of one complete gripper - the most complex part of Stringman.

Proceed to the [Raspberry Pi Setup](raspi_setup.md) instructions and after that's done, there is a script in qa/gripper_eval.py that can help you confirm the gripper has been assembled correctly and you have good continuity on all conenctors. There's also a manual QA checklist in [Quality Assurance](quality_assurance.md)

![](images/grip/image82.png){ loading=lazy, width=45% }