# Raspberry Pi Setup

To be performed for each robot component (four anchors and one gripper)
If you purchased a fully assembled robot you do not need to do this.

## For pre-imaged cards

When the component boots it will look for wifi credentials using it's camera. Hold up a wifi share QR code to it and it should appear on your network and be detected by the control panel in under a minute.

You can generate a valid wifi share code with [qifi.org](http://qifi.org)

## Image SD card

Download the [Raspiberry Pi Imager](https://www.raspberrypi.com/software/)

Insert a MicroSD card and open the imager.  

For device, select `Raspberry Pi Zero 2 W`  
![](images/raspi/image1.webp){ loading=lazy, width=45% }

Download the [Stringman Raspberry Pi Image](https://storage.googleapis.com/stringman-models/stringman-zero2w.img) (1.6 GB)
For operating system, select custom image and use the downloaded file.
![](images/raspi/image2.webp){ loading=lazy, width=45% }
![](images/raspi/image3.webp){ loading=lazy, width=45% }

Click `Next` and then select the SD card you would like to flash.

![](images/raspi/image4.webp){ loading=lazy, width=45% }

Click `Write` and confirm. When the image is finished, insert it into the raspberry pi of the stringman component and boot.

Configure the wifi with a share code according to the structions in the section above.

### Eval tools and component types

The stringman image automatically distinguishes between all component types except the pilot anchor and pilot power anchor. They differ only by the winding constant. If you are assembling components, after assembly you will have to run the corrsponding eval tool, and the argument you pass here sets the type.

Anchors: `qa-anchor anchor|power_anchor`
Grippers: `qa-gripper` 

These tools walk you through each sensor and stop if one isn't responding. At the end, they wind the correct amount of line on the spool so be prepared for that.

### Updates

At this time it is only possible to update by logging into each component. In the configuration.json file where your robot's details are saved,
`stringman-headless` will have written all of their id addresses. ssh into each one.

    ssh pi@<component-address>

the password on the default stringman image is `Fo0bar!!`

    /opt/robot/env/bin/pip install --upgrade "nf_robot[pi]"

### Setting a different wifi network

At boot if none of the saved wifi networks can be connected to, the device will go into QR code checking mode with it's camera.
**Just hold up a new code**

If that doesn't work in your scenario, insert the Micro SD card from a robot component in your PC. Confirm it is mounted at /media/$USER/rootfs
run the following command from the cranebot3-firmware repo

    sudo ./add_wifi_config.sh "SSID" "password"

### Locking down the pi's

By default the password for th `pi` user on the Stringman image is `Fo0bar!!` which makes it easy to troubleshoot new devices.

For greater security you can disable password authentication and change all three components to accept only private key authentication

#### Automated method

from cranebot3-firmware with venv active

    python experiments/deploy_ssh_keys.py mr_robot.conf

Supply the configuration file for a robot you want to deploy keys to.
Components password auth with only be disabled after verifying your key auth works so it won't lock you out.

Alternatively, here's the manual methods.

#### Change the password

ssh into the component and run

    passwd

Enter the current password (`Fo0bar!!`) once, then your new password twice.

#### Set up key-based authentication

If you don't already have an SSH key pair, generate one on your own computer

    ssh-keygen -t ed25519

Copy your public key to the component so it will recognize you without a password

    ssh-copy-id pi@<component-address>

Confirm you can log in without being prompted for a password before continuing

    ssh pi@<component-address>

#### Disable password authentication

Once key authentication works, ssh into the component and edit the ssh server config

    sudo nano /etc/ssh/sshd_config

Set the following options

    PasswordAuthentication no
    ChallengeResponseAuthentication no

Save, then restart the ssh service to apply

    sudo systemctl restart ssh

Repeat for each component. From now on these devices will only accept logins from machines holding your private key.
