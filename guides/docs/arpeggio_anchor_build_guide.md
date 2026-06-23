# Arpeggio Anchor Build Guide

Hardware Version: Arpeggio

**Print time**: 40h  
**Build time**: 1.5h

## Resources

 * [Hardware Kit](/stringman-hardware-kit)
 * [Print Guide](arp_print_guide.md)
 * [Bill of Materials](https://docs.google.com/spreadsheets/d/1bZy7uijzaD2q74BN9S1-xETvV-d4Wz9Zg1J2bpjwM2k/edit?usp=sharing)

## Tool list

 - [Mini screwdriver with a bit set](https://www.amazon.com/dp/B01KB02F9C)
 - [Cross locking tweezers](https://www.amazon.com/dp/B001BU9MLG)
 - Super glue ([loctite super glue “professional liquid”](https://www.amazon.com/dp/B07VL6MP94?ref_=ppx_hzsearch_conn_dt_b_fed_asin_title_1&th=1) recommended)

## Spools

A full system needs three regular having fishing line, referred to below as "regular" spools and one power spool which has cable wound on it.
Spool side A is different on the powerline spool, it has a wider center hole. 

Glue side A to side B

![](images/anc_arp/PXL_20260407_212731244.webp){ loading=lazy, width=45% }
![](images/anc_arp/PXL_20260407_212833336.webp){ loading=lazy, width=45% } 

### Regular spools (create 3 per system)

Press the dry spool onto the motor until fully seated. twist until the holes align, secure with 3 M3x8 screws.

![](images/anc_arp/PXL_20260406_204326320.webp){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_204329758.webp){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_204458647.webp){ loading=lazy, width=45% } 

Put an M4x12 screw through a 4x13x5 bearing follow by 2 M4 washers, then screw it into the 4 mm hole in the center of the spool.

![](images/anc_arp/PXL_20260406_223504485.webp){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_223525909.webp){ loading=lazy, width=45% } 

### Powerline spools (create 1 per system)

Solder a JST ZH female plug housing onto the fixed end of the slip ring.

Glue the 1cm abs tube (included in the kit) into the hole in the powerline spool side A. You can use a coin to press it in. 

??? tip "Creating the 1cm tube"

    Use an "imp" pipe cutter to cut an 10 mm long peice of 10 mm diameter ABS tube. The same tube used on the marker box of the arp gripper.

    ![](images/anc_arp/PXL_20260406_205618415.webp){ loading=lazy, width=45% } 
    ![](images/anc_arp/PXL_20260406_210024131.webp){ loading=lazy, width=45% } 

When dry, put 3/8 * 7/8 stainless steel washer on the plastic tube, followed by a 10x15x4 bearing.

![](images/anc_arp/PXL_20260406_210115354.webp){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260621_222728168.webp){ loading=lazy, width=45% }

Place the slip ring into the slip ring block and secure it using 2 M3x8 screws with an m4 washer on each in the 2 out of 3 accessible screw holes. 

![](images/anc_arp/PXL_20260406_222724209.webp){ loading=lazy, width=45% } 

Thread the rotating wire end through the tube in the spool about half way, and using the access you still have to the back of the spool, thread the wire out the side of the spool through the wire hole. don't sinch it all the way down yet in order to leave room for the screws that secure the motor.

![](images/anc_arp/PXL_20260406_222828687.webp){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_222858249.webp){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_222913517.webp){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_222926713.webp){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_222955593.webp){ loading=lazy, width=45% } 

Press the motor into the spool, align the holes and secure with 3 M3x8 screws.
Now fully seat the slip ring against the side of the spool by gently pulling the wires through.

![](images/anc_arp/PXL_20260406_224446321.webp){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_223012482.webp){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_223116803.webp){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_223140281.webp){ loading=lazy, width=45% } 

## Electronics

Assemble a Raspberry Pi Zero 2W with a Stringman imaged SD card and heat sink.
If the pi does not have header pins, solder on a full set.

![](images/anc_arp/PXL_20260407_003331054.webp){ loading=lazy, width=45% } 

Carefully unpack the a Camera Module 3 standard FOV and remove whatever ribbon cable came attached to it.

Screw a camera angle mount piece (printed) to. (front right when looking at the lens with the ribbon connector on top)
The angle can be chosen from 22, 26, or 30 degrees of downwart pitch from horizontal. The camera pitch should be chosen to keep the floor well centered.
It can be changed out later but the config must be updated to inform the software of the chosen pitch.

![](images/anc_arp/PXL_20260410_195123214.webp){ loading=lazy, width=45% } 

Install a 4cm mini ribbon cable on the camera. the gold pads always face down towards the board.
Attach the smaller end of the ribbon cable to the pi. Be very careful with the delicate connector.

![](images/anc_arp/PXL_20260410_195147352.webp){ loading=lazy, width=45% } 

Press a Stringman Anchor Hat onto the pi.
put spacers in the corners between the two boards and insert four M2.5x18 screws.

![](images/anc_arp/PXL_20260410_200453917.webp){ loading=lazy, width=45% } 

Screw the raspberry pi into the conical standoffs in the electronics box on the bottom of the frame.
The camera should hang out of the window at the front

![](images/anc_arp/PXL_20260410_200807137.webp){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260410_200814489.webp){ loading=lazy, width=45% } 

Screw the camera angle mount to the frame with 1 M2.5x6 screw. The small protrusion is what determines the final angle of the camera. It only fits one way.

![](images/anc_arp/PXL_20260410_200844631.webp){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260410_200908703.webp){ loading=lazy, width=45% } 

## Frame

Flip the frame over. From this point on it can be very helpful to have a beanbag to place the mechanism on at any angle while driving screws.

Install the lower spool first. Insert the plug downwards through the rectangular hole on the lower spool side of the frame. Align the motor's shaft so the gap points down and the flat sides are vertical. slide it into the slot, pulling the wire through as you go. seat it fimly in the slot, and in the bearing cup on the other side. spin and confirm it's not crooked. Secure the motor from the outside of the frame with 3 M3x8 screws.

![](images/anc_arp/PXL_20260406_223235451.webp){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_223306060.webp){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_223630852.webp){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_223645100.webp){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_223836849.webp){ loading=lazy, width=45% } 

If the higher spool is a regular spool, print the variant of the slip ring block made for regular spools instead of slip rings. press it onto the bearing that protrudes from the unmounted spool.

If the higher spool is the powerline spool, it already has a bearing block on it. sinch the wire down firmly by pulling it through the spool till the slip ring cannot get any closer to the spool.

Same as the other one, thread the plug, align the shaft, and align the bearing block on the other side. secure the motor with with 3 M3x8 screws from the outside of the frame, and secure the bearing block with two M3x8 screws.

![](images/anc_arp/PXL_20260406_223922541.webp){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_224601216.webp){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_224701685.webp){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_224812284.webp){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260406_231646223.webp){ loading=lazy, width=45% } 

Secure the "sunglasses" to the top of the frame with 4 M3x8 screws.

## Spool winding

Winding is performed by running a post-assembly script on the anchor (qa-anchor-arp)
It sets motor ids, winds the correct amount of line for the spool type, and checks the camera.

[This video summarizes the process for a non powerline anchor](https://x.com/VMises76153/status/2067794617873973295)

Power on the anchor.

![](images/anc_arp/PXL_20260621_205141146.webp){ loading=lazy, width=45% } 

Begin by logging into the anchor. You can connect it to the internet either by [wifi](arp_install_guide.md/#connect-all-components-to-wifi) or ethernet using an [adapter](https://www.amazon.com/dp/B00L32UUJK). Power on the device and ssh into it with 

    ssh pi@<hostname or ip>

Password `Fo0bar!!`. Then run

    /opt/robot/env/bin/pip install --upgrade "nf_robot[pi]"
    /opt/robot/env/bin/qa-anchor-arp

Follow the prompts. It will ask you to plug in one motor at a time and power cycle them which can be done by pulling and replugging the barrel jack. If you are connected via a powered eithernet adapter, the pi won't turn off. But if you do have to lose your connection at this step, just log back in and run the script again, it will pick up where it left off.

Once motor ids are set, it prompts you to wind the spools. If you are not ready to wind a particular spool or need to skip it, answer no (n) at the prompt for that spool.

!!! tip "Tip"

    It helps to have a beanbag to set the anchor on during these steps.

### Fishing line spools
![](images/anc_arp/foo.jpg){ loading=lazy, width=45% } 

Before winding a fishing line spool, tie the end of the line to the small tie off point on the spool with a [buntline hitch](https://www.animatedknots.com/buntline-hitch-knot).
Hold the supply spool loosely in a clear place. Winding is pretty fast. Winding starts after answering yes (y) for a spool and pressing enter in the `/opt/robot/env/bin/qa-anchor-arp` script.

When winding is finished, feed the line end out of the sunglasses from back to front, then tie a carabiner on the end with a [palomar knot](https://www.animatedknots.com/palomar-knot).

![](images/anc_arp/PXL_20260621_211402483.webp){ loading=lazy, width=45% } 

### Power line spools

First, if you bought a kit and received a pre-cut length of cable, thread one carabiner onto the bare end of the cable now through the carabiner's small hole, and send it all the way to the other end where the JST plug is. We'll need it there later.

![](images/anc_arp/PXL_20260621_200836008.webp){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260621_211133464.webp){ loading=lazy, width=45% } 

Next, feed the bare end of the cable into the front of the "sunglasses". Pull a lot of slack through, and then feed the cable through the spool's tie off hole in the other direction, from the back of the anchor to the front, as pictured.

![](images/anc_arp/PXL_20260621_201153345.webp){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260621_201322658.webp){ loading=lazy, width=45% } 

Pull more slack through the tie off hole and tie a simple square knot. **Do not cinch it tight yet**.

![](images/anc_arp/PXL_20260621_201502267.webp){ loading=lazy, width=45% } 

Rotate the spool forwards and trim the slip ring wires at the point pictured. this causes them to wrap about 2/3 of the way around the spool but not reach the tie off point. This length is important.

![](images/anc_arp/PXL_20260621_201624140.webp){ loading=lazy, width=45% } 

#### Splice the line

Splice the grey power line to the slip ring wires using heat shrink and a pair of solder seal connectors. **Put the heat shrink tube on first.** If you have never used solder seal connectors, the kit includes a few extra so you can practice on some scrap.

 * <span class="wire-brown">Brown</span> to <span class="wire-red">Red</span>
 * <span class="wire-blue">Blue</span> to <span class="wire-black">Black</span>

![](images/anc_arp/PXL_20260621_202806229.webp){ loading=lazy, width=45% } 

!!! tip "Stripping"

    I get the best results stripping the jacket of the cable with the 18 AWG jaws of my wire stripper, and the cores with 28 AWG on a smaller wire stripper.

Now take out the slack in the square knot enough the covered splice sits at the base of the spool, but not enough that the splice takes any of the weight. The knot should take the weight if it comes to that.

![](images/anc_arp/PXL_20260621_203038488.webp){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260621_203041310.webp){ loading=lazy, width=45% } 

#### Wind the powerline cable

Once the splice is complete, winding the powerline cable is similar to the fishing line. Answer yes (y) to the upper spool and press Enter to begin winding.

When winding is complete, tie the carabiner that was threaded before to the end of the line with a [buntline hitch](https://www.animatedknots.com/buntline-hitch-knot) such that the knot takes the weight and the splice at the end is protected from any mechanical stress.

![](images/anc_arp/PXL_20260621_211243999.MP.webp){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260621_211348091.webp){ loading=lazy, width=45% } 


### Finishing the anchor

The script will prompt you to check the camera feed, and then complete. Power off the anchor by simply pulling the power.

Finally, make sure the black motor cables are tucked away properly in the cavity under the anchor.

The anchor is now finished.

![](images/anc_arp/PXL_20260621_211428575.webp){ loading=lazy, width=45% } 

## Create the Eyelets

Create two eyelets. Print the body on the flat edge on the lower left side, for strength. print two retainers.
Press a size 20 Alconite ring into the ring slot. Put a drop of superglue into the remaining space, and press on the retainer with a coin and a pair of pliers.

![](images/anc_arp/PXL_20260407_020206256.webp){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260407_020236086.webp){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260407_020438208.webp){ loading=lazy, width=45% } 
![](images/anc_arp/PXL_20260407_020629830.webp){ loading=lazy, width=45% } 

Complete!

Refer to the [Unboxing and Installation](arp_install_guide.md) page when you are ready to mount it in a room.