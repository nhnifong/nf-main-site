# Print Guide

Hardware version: Arpeegio

Total print time about 80h

![](images/print/image10.webp){ loading=lazy, width=45% } 

The whole print is available as a [Bambu 3MF file here](assets/stringman_bambu.zip)

## Defaults

Unless a part says otherwise:

 - Material: PLA
 - 2 walls, 15% grid infill
 - Print 1 of each part
 - Supports: tree supports, build plate only, 0.5mm XY distance to part

The exceptions to the support default are the **regular bearing block**, the **slip ring block**, and the **sunglasses** — print these three without supports.

Covers, faces, fingers, geared levers, linkage, and parking hooks are all visible on the finished build, so pick their colors with the look of the finished robot in mind. Color is irrelevant for everything else.

Do not use PET for any gears. It squeaks.

## Anchor

### Cover top (2x) and Cover bottom (2x)

 - Visible — choose color to match walls or crown moulding
 - Print top cover upside down.
 - Glue together with cyanoacrylate

### Frame (2x)

 - Print in **PCTG or PETG-CF**. Not PLA - this part needs strength and heat tolerance.
 - 2 walls, 22% adaptive cubic
 - Tree supports, build plate only, critical regions only, 0.5mm XY distance to part
 - Bambu super cool tack plate reccomended

### Regular bearing block (1x) and Slip ring block (1x)

 - No supports
 - Print on side face

### Spool A Power (1x), Spool A Regular (3x), Spool B (4x)

 - tree supports for recessed holes
 - Glue A's and B's together to create complete spools.

### Stud mount (2x)

 - 3 wall thickness, 100% infill. May be visible if you remove the anchors, so white is good.

### Sunglasses (2x)

 - No supports
 - Should match the color of the anchor cover and is externally visible.

### Tilt adapter — 22°, 26°, 30° (1x each)

 - Pick the adapter angle that suits your room. The angler refers to camera centerline degrees of tilt below the horizon. higher value for high ceilings, lower value for low ceilings.
 - fine detail - 0.16mm layers

### Tripod mount (1x) — optional

 - Only print this if you're mounting on a tripod

## Eyelet

### Body stud mount (1x)

 - Print on the odd diagonal flag face since it's stronger than printing on the back.
 - match wall color
 - 100% infill

### Body tripod mount (1x)

 - Only print this if you're mounting on a tripod

### Retainer (1x)

 - match color of other eyelet part

## Gripper

### Back plate (1x), Camera mount (1x), Coupler (1x), Mechanism lid (1x), Motor bracket (1x), Platform box (1x)

 - Default settings, color almost irrelevant, though small bits may be visible with the fingers open.

### Drive gear (1x)

 - **100% infill**
 - PCTG (polyethelyne cyclohexane terepthalate glycol) Nozzle temperature **265°C** — higher than usual for this filament
 - 3 walls
 - If you have an aluminum SLS printer call me 

### Face Back (1x) and Face Front (1x)

 - Visible — choose color deliberately
 - It is a good idea to merge the parts in the slicer and print them with their open faces towards eachother so they share tree supports.

### Finger (1x)

 - Visible — choose color deliberately
 - Otherwise default settings

### Geared lever left (1x) and Geared lever right (1x)

 - Visible — choose color deliberately
 - Otherwise default settings

### Linkage (2x) (part of the finger)

 - Visible — choose color deliberately
 - Otherwise default settings

### Spacer (3x)

 - Default settings

### Wrist pole helical gear (1x), Wrist removal block (1x), Wrist servo helical gear (1x)

 - Default settings, color irrelevant

## Extras

### Clip (1x)

 - Default settings, white

### Parking hook (1x)

 - Visible — match wall color
 - turn diagonally to fit on 250mm build plate.
 - 11% cubic infill

### Parking tag display (1x)

 - Default settings

### Wall tag — optional

 - Print in multicolor using the Bambu profile (`walltag.3mf`)
 - If your printer can't do multicolor, skip this part — it's optional and not worth printing single-color

### All cards

 - `all_cards.3mf` — print with the Bambu multicolor profile
