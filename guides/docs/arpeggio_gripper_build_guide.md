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

Attach a fork to the back of a finger pad. Forks and finger pads are both symmetrical. There is no left and right finger. Insert an M3x25 bolt through the upper hole, passing through both parts, followed by an M3 lock nut on the other side. Tighten the nylock nut until no slack remains, then back off until the rod can swing. Repeat for the other finger.

![](images/grip_arp/PXL_20260330_133246386.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260330_133317023.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260330_133400360.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260330_133444670.png){ loading=lazy, width=45% }

Select either geared lever. Slide in a geared lever into the finger assembly with it's flat face coplanar with the finger's flat flace.
Insert an M3x25 bolt through the assembly and a M3 lock nut on the other side.

Tighten and then back off just until the mechanism moves freely. Repeat with the other finger.

![](images/grip_arp/PXL_20260330_133509036.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260330_133721043.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260330_133816709.png){ loading=lazy, width=45% }

### Assemble a pressure sensor

Locate the pressure sense connector. It is a 2-pin 1.00mm pitch male JST-SH connector with 20cm wire ends. Place heat shrink tubing on the wires and solder them to the pressure sensitive resistor. Polarity is irrelevant. Clip the wings off the JST-SH connector with flush cut wire clippers and feed the plug through the channel in the finger.

In build kits, this part is pre-assembled.

Select the finger that has a wire channel inside it. Feed the plug of the pressure sensor through the channel and then stick the resistor pad onto the finger.

![](images/grip_arp/PXL_20260330_133909419.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260330_134037513.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260330_134113767.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260330_134148958.png){ loading=lazy, width=45% }

### Apply grip tape on the fingers

prepare at least four strips of 110x37mm fingerboard grip tape.

Lay the finger on the table face up with the finger pad and gear lever's flat faces coplanar, using the linkage as support.

Stick one pad of grip tape on the finger in the longer direction. Start from the top edge of the finger (nearest the gear) make one end of the foam meet this edge, stick down the foam and you will have about 10mm sticking off the end. Fold it over the edge.
Press the finger flat against a desk to firmly stick it down everywhere.

![](images/grip_arp/PXL_20260330_135418346.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260330_135449560.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260330_135501452.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260330_135507886.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260330_135521402.png){ loading=lazy, width=45% }


In a perpendicular direction stick another sheet of adhesive foam over the fingertip, folding 10 mm around each side.

![](images/grip_arp/PXL_20260330_135546329.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260330_135613874.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260330_135618907.png){ loading=lazy, width=45% }

Then with a hobby knife, cut away any excess foam.

![](images/grip_arp/PXL_20260330_135633225.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260330_135719443.png){ loading=lazy, width=45% }

Flip the finger face up and cut the foam right down the crack where the two finger peices slide past eachother as pictured, and flex the joint to make sure everything stays stuck in place.

Repeat with the other finger.

![](images/grip_arp/PXL_20260330_135740587.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260330_135756602.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260330_140024529.png){ loading=lazy, width=45% }

## Motors

Attach the aluminum servo horns to both motors with the included M3x6 center screw. Use the one with the ridges inside.

![](images/grip_arp/PXL_20260202_235656620.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260202_235805556.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260203_000043825.png){ loading=lazy, width=45% }

Snap two of the m3x6 screws that come with the motor into the finger drive gear from the sides.
Screw the drive gear down tightly to the aluminum servo horn of one of the motors.

!!! tip "Print Settings"

    The drive gear will not have sufficient strength if printed with PLA. PCTG is known to work, but only at a higher than usual nozzle tempurature of 265°C.

![](images/grip_arp/PXL_20260331_214540392.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260331_214646763.png){ loading=lazy, width=45% }

Plug a three wire SPOX cable into each motor. (The wire that comes in the box with the motor)

## Body Assembly

After printing, tear the ears off the mechanism lid print. Clean up the area the sacreficial bridge was supporting with a sharp tool.

![](images/grip_arp/PXL_20260203_000701647.png){ loading=lazy, width=45% }

Attach the finger motor to the outside of mechanism_lid with four of the smallest screws included with the motors.

![](images/grip_arp/PXL_20260331_214712028.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260331_214759179.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260331_214838930.png){ loading=lazy, width=45% }

Locate the printed back plate (the largest piece)
Insert two M3x25 bolts into the back plate from the bottom, hold them in as you place it on the table. A bean bag can also serve as a good place to put the device while assembling it. Place two M3 washers onto the screws.

![](images/grip_arp/PXL_20260331_214133074.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260331_214236736.png){ loading=lazy, width=45% }

Mesh the two geared levers together in the closed position, making sure they are aligned correctly. They must remain meshed the entire time. Use a rubber band to hold them together if necessary.  

Feed the plug of the pressure sense wire through the smile shaped slot in back_plate, and place the fingers on the bolts simultaneously, keeping them meshed, and keeping the sense wire from being pinched anywhere.

Place M3 washers over the bolts after they protrude from the fingers.

![](images/grip_arp/PXL_20260331_214309109.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260331_214349018.png){ loading=lazy, width=45% }

Place the mechanism lid and finger motor assembly onto the back plate, gently wiggle everything in order to get it to fit. The two M3x25 bolts should go through the holes in mechanism_lid and the drive gear should mesh with the finger gears. The alignment tabs on the sides should line up. If you have trouble getting it on there, try pulling the m3x15 bolts back a bit into the fingers, make the gear mesh first, then push the bolts through.

Insert two M3 lock nuts into the hexagonal holes. Tighten the bolts from behind and then back off enough that the geared levers move freely.

![](images/grip_arp/PXL_20260331_214931771.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260331_215008361.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260331_215045528.png){ loading=lazy, width=45% }

Screw in a single M4x12 screw into the center hole in the back plate. this provides some stability to the finger drive gear.

![](images/grip_arp/PXL_20260331_215346279.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260331_215421357.png){ loading=lazy, width=45% }

Secure the lid around the edges with four M3x8 screws

![](images/grip_arp/PXL_20260331_215229335.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260331_215323818.png){ loading=lazy, width=45% }

Swing the two fork-shaped linkages up and into their slots. Secure them on the mechanism_lid side with two M3x14 screws. The back side comes later.

![](images/grip_arp/PXL_20260331_215453617.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260331_215530342.png){ loading=lazy, width=45% }


## Electronics

Select a raspberry pi zero 2w. you can either buy the one with the full header, or one with no header and solder header pins on only the first 6 pins of each row.

Stick a heat sink onto the black chip.

![](images/grip_arp/image11.png){ loading=lazy, width=45% }

Press the Strinman Gripper Hat onto the raspberry pi.

![](images/grip_arp/PXL_20260203_002527211.png){ loading=lazy, width=45% }

Insert spacers between the two boards, and insert M2.5x16 through the boards and spacers. Only three corners are used since the ribbon cable is in the path of one of them. use screws and spacers only in the three holes pictured.

![](images/grip_arp/PXL_20260307_163945036.png){ loading=lazy, width=45% }

Unpack one [**Wide** angle Rasberry Pi Camera Module 3](https://www.digikey.com/en/products/detail/raspberry-pi/SC1224/17278644) and install an 8cm mini cable. The wide end of the mini ribbon cable plugs in the camera. Very carefully and gently pull out both sides of the black retaining clip in the Raspberry Pis ribbon cable connector. Insert the ribbon cable, black side up, under the retention clip. Push the clip back in to secure it. If the clip falls out, you can put it back in with tweezers by inserting one side at a time.

Layout the parts as pictured screw the camera to the camera mount with two M2x4 bolts in opposite corners. Then, folding the ribbon as pictured, place the board stack on the mount and screw it in in the three corners that have screws.

![](images/grip_arp/PXL_20260307_001646350.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260307_001725647.MP.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260307_001727665.MP.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260303_144334089.png){ loading=lazy, width=45% }

Open the gripper fingers. Attach the camera mount assembly to the back plate with an M3x6 countersunk screw.

![](images/grip_arp/PXL_20260203_003116011.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260203_003125474.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260203_003143036.png){ loading=lazy, width=45% }

Screw two M3x14 screws into the holes that both hold on the electronics mount and secure the forks from the side that was left unfastened earlier.

![](images/grip_arp/PXL_20260203_004935923.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260203_005029210.png){ loading=lazy, width=45% }

Plug the pressure sense plug into the Gripper Hat's "pressure" socket.

Image an SD card according to the instructions in [Raspi Setup](raspi_setup.md) and insert it into the SD card slot.

![](images/grip_arp/PXL_20260203_003359996.png){ loading=lazy, width=45% }

Solder the straight header onto the rangefinder. You can solder all six or just the four lablelld VIN, GND, SCL, and SCA.
Feed the 4p rectangular dupont plug out of the horizontal slot near the fan and plug it into the rangefinder. note that in this case white is on the VIN plug. I didn't have control of the colors in these wires.

Attach the rangefinder to the frame with two M2x4 screws.  
Feed the other connector through the frame and connect the rangefinder to the gripper hat's stemma socket.

![](images/grip_arp/PXL_20260203_003557749.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260307_003643671.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260203_004822533.png){ loading=lazy, width=45% }


## Wrist motor

Attach a bracket to the remaining motor in the pictured orientation. Secure with four of the included small tapping screws from the motor box.

![](images/grip_arp/PXL_20260203_005137842.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260203_005244290.png){ loading=lazy, width=45% }

Attach the three-holed helical wrist drive gear to the motor horn with two of the M3x6 screws that come with the servo motor.

![](images/grip_arp/PXL_20260203_005323886.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260203_005434275.png){ loading=lazy, width=45% }

Attach this motor bracket to the gripper with two M3x8 screws.

![](images/grip_arp/PXL_20260203_005851153.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260203_005932229.png){ loading=lazy, width=45% }

Plug the finger motor into the motor port on he Gripper Hat. Leave the wrist motor unconnected for now.

![](images/grip_arp/PXL_20260203_010458913.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260203_010504029.png){ loading=lazy, width=45% }

## Fan

Attach a 30mm fan to the mechanism lid using two M3x8 screws in opposite corners. ensure the airflow points outwards.

![](images/grip_arp/PXL_20260306_233719266.MP.png){ loading=lazy, width=45% }
![](images/grip_arp/PXL_20260306_233758557.png){ loading=lazy, width=45% }

Plug in the Fan into to 5V socket labelled FAN on the gripper PCB.

## Marker Display Box

The marker display box is a passive component that displays april tags at the point where the lines meet.
It was previously called the gantry and so you may find it referred to by that name.

### 50 cm pole

The marker display box is connected to the gripper by a [50cm ABS tube with a diameter of 10mm](https://www.aliexpress.us/item/3256804916904509.html). If you purchasded a kit from Neufangled, in order to use less expensive packaging, the pole is cut in two. It needs to be recombined using a printed coupler. If you have the full pole, skip this step. This joint is the same type as that used at the ends of the pole. It's good up to about 5kg. Put a ring of cyanoacrylate glue around the inside of the coupler on one side and jam a pole section into it in one quick motion. Super glue sets fast when the fit is tight. Repeat with the other side.

![](images/grip_arp/PXL_20260405_151008393.png){ loading=lazy, width=45% } 
![](images/grip_arp/PXL_20260405_151027084.png){ loading=lazy, width=45% } 
![](images/grip_arp/PXL_20260405_151055436.png){ loading=lazy, width=45% } 

Put a 10x15x4 bearing onto the ABS tube followed by a 3/8" x 7/8" steel washer. 

Make a mark 6.5mm from the end of the tube with a sharpie pen.
*Forcefully twist* the helical gear onto the tube until the marked 6mm of tube protrude past the gear.

Put a few drops of cyanoacrylate glue where the gear and tube touch, followed by another washer and press it firmly to glue it there.

![](images/grip_arp/PXL_20260203_024931510.png){ loading=lazy, width=45% }
![](images/grip_arp/tube.png){ loading=lazy, width=45% }

!!! tip "Multicolor print or stickers"

    You can either print the marker box in multi color for a more durable result (19h) or print it in white and add stickers (3h)
    If printing in multicolor, you can find it in the STL download in `multicolor prints for bambu/platform box.3mf`

    STLs are on the [downloads page](downloads.md/#__tabbed_1_2)

Locate or print the gantry marker tags.
If you are printing them, This is the [sticker paper on amazon](https://www.amazon.com/dp/B092444Z49) and the [document with the marker images is here](https://docs.google.com/document/d/1B41dnssHsm1Db0LiHVgLatEv6H1jt0amIagw2v5_7dU/edit?usp=sharing). It must be printed without margins.
Cut the stickers apart into squares. 

![](images/grip_arp/PXL_20260205_164916211.png){ loading=lazy, width=45% } 
![](images/grip_arp/PXL_20260205_165341642.png){ loading=lazy, width=45% } 

Score a triangle in a corner on the back of each one. This makes it easier to remove the backing.
Put stickers on all four sides of the marker box. Note the orientation, the "stem" of the tree is at the bottom.

![](images/grip_arp/PXL_20260205_165401639.png){ loading=lazy, width=45% } 
![](images/grip_arp/PXL_20260205_165456666.png){ loading=lazy, width=45% } 
![](images/grip_arp/PXL_20260205_165525637.png){ loading=lazy, width=45% } 
![](images/grip_arp/PXL_20260205_165608693.png){ loading=lazy, width=45% } 
![](images/grip_arp/PXL_20260205_165947320.png){ loading=lazy, width=45% } 

Forcefully twist the other end (with no bearing) of the ABS rod into it until it bottoms out. Again, it's intentionally a very tight fit. Put a drop of cyanoacrylate glue on it from the bottom.

![](images/grip_arp/PXL_20260205_170008890.png){ loading=lazy, width=45% } 
![](images/grip_arp/PXL_20260205_170030767.png){ loading=lazy, width=45% } 

Put another steel washer on the bottom of the tube under the bearing, and holding it in place, slide the gear end of the tube into the slot in the top of the gripper until firmly seated. Press the wrist block into the opening firmly and secure with three m2.5x6 screws.

![](images/grip_arp/PXL_20260205_170146100.png){ loading=lazy, width=45% } 
![](images/grip_arp/PXL_20260205_170203710.png){ loading=lazy, width=45% } 
![](images/grip_arp/PXL_20260205_170329058.png){ loading=lazy, width=45% } 
![](images/grip_arp/PXL_20260205_170451870.png){ loading=lazy, width=45% } 

Find (or create yourself) the 75cm cable with male JST ZH plugs at both ends. Thread it into the top of the display box, down the tube, into the gripper, and out the hole on the side of the gripper. Plug the cable into the gripper hat. (this photo is inaccurate and will be replaced)

![](images/grip_arp/PXL_20260205_205501032.png){ loading=lazy, width=45% } 
![](images/grip_arp/PXL_20260205_205556987.png){ loading=lazy, width=45% } 

## Check out tests and calibration

Find (or create yourself) the barrel jack to Female JST ZH adapter. Plug this into the wire at the top of the display box, and use one of the anchor power supplies (24V) to power on the gripper.

![](images/grip_arp/PXL_20260205_210000179.png){ loading=lazy, width=45% } 

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

![](images/grip_arp/PXL_20260207_193350888.png){ loading=lazy, width=45% } 
![](images/grip_arp/PXL_20260207_193526006.png){ loading=lazy, width=45% } 

Complete! you are now in possession of one complete gripper - the most complex part of Stringman.

Now you can move on to [Tie up](installation_guide.md).