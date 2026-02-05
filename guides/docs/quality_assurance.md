# Troubleshooting and Post-assembly Quality Checks 

??? example "No robot components are discovered by the control panel"

    Components were pre-configured with a wifi network and password. those credentials might be wrong. Check whether the devices are on the network by looking at your router's device list page for raspberry pi's. If they are present on the network, ensure your desktop is on the same network and the router permits local peer connections between machines. If that all looks good, mayebe the servers are not running. try running `sudo systemctl start cranebot.service` on each component. Logs can be seen with `tail -f cranebot.log` it's it's in a restarting loop, please file a bug on github.

??? example "MKS Servo 42C is making loud and constant noise and jittering while plugged in"

    **Solution:** It's in UART mode but a big file was dumped onto the serial port. the controller has buffered it and is interpreting it as commands. **Factory reset the motor** the blob of data could have altered any number of settings. After reset put it back in uart mode and se the baud back to 38400. 

??? example "Anchor server logs say No such file or directory: '/dev/ttyAMA0'"

    **Solution:** On the anchor server, edit /boot/firmware/config.txt add dtoverlay=disable-bt at the end. reboot.

??? example "Anchor server logs show a permission error when creating the serial port in motor_contro.py"

    **Solution:** The serial login shell may still be enabled. check this with
        sudo systemctl status serial-getty@ttyAMA0.service
    and if you see it running, it needs to be permanently disabled. run
        sudo raspi-config
    in the tool, select Interface Options, then Serial port. select login shell "No" and serial port hardware "Yes"
    reboot when prompted  

??? example "I disabled the serial login shell but it was still running after a reboot"

    **Solution:** Check if /boot/firmware/cmdline.txt is empty. if so this is a sign of filesystem corruption. reflash the card. according to [raspi setup](raspi_setup.md)


## Anchor Post Assembly Quality Checks

### wiring harness

* Continuity of each conductor checked from pins stuck into the plugs at each end.
* 5 volt output on the regulator. (ALWAYS check this before connecting it to a raspberry pi of you will destroy one)

### Motor:

* Confirm UART mode
* Confirm uart baud of 38400
* Confirm motor jumper is present
* Confim that in idle for 30 seconds, motor is still completely cool to the touch.

### Body

* Confirm spool retainer is secure
* Confirm spool is centered and moves without touching anything
* Slide the pully wheel on the motor shaft until motion is as quiet as possible

### Software

Confirm motor serial communication. if not working, check the following issues
* Double check continuity of serial wires
* confirm dtoverlay=disable-bt in /boot/firmware/config.txt
* confirm `sudo systemctl status serial-getty@ttyAMA0.service` is disabled

* Confirm the cranebot service is enabled.
* Confirm camera connection is working (TODO instructions)
* Confirm tightness switch is working (TODO instructions)

### Cover

* Confirm that a tight line clicks the switch from all angles, and a loose line unclicks it. The lever arm can be bent DOWN to bias it towards clicking ON and vice versa
* Confirm that a swivel is tied on the end of the line outside of the cover
* put the m2.5x6 screw in the bottom of the cover after of the above checks, so that it serves as an indicator.



## Gripper Post Assembly Quality Checks

### Fingers

* Confirm that when the finger servo is commanded to an angle of 90, the fingers completely touch and press together firmly. If they do not, the drive gear's mesh with the finger needs to be adjusted by one tooth.
* Confirm the pressure sensors's wires don't kink at the point where they enter the finger shaft.
* Calibrate the pressure sensor

### Spool/Winch

* Confirm no loops of wire protrude from the spool and that it is wound cleanly. If not, rewind it.
* Confirm the encoder produces correct readings. If not, the Inventor Hat Mini may need an update
* Confirm there is no scraping noise heard when the spool spins. there should be only the sound of the servo.

### Sensors

* Confirm IMU is plugged in and produces correct readings.
* Confirm rangefinder is plugged in and produces correct readings.
* Confim limit switch is plugged in and produces correct readings.
* Confirm camera is plugged in and can stream video.


## Post Install Quality Checks

* Confirm the power wire does not have any loops or bulges in it. if so, smooth them out.
* Confirm the two-pin plug at the gantry has no tension on it. The braided fishing line should be bearing all the weight. If necessary, untie the gripper's fishing line end from the keyring, shorten it a few centimeters, and retie it. Always use a palomar knot. The power line at the gantry should have a slack loop where the plug floats with no forces on it.