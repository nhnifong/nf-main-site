# Desktop Setup Guide

The motion controller for stringman must be run on a PC on the same network as the robot components.
If the motion controller is not running, the anchors simply hold position and transmit nothing.

It can either be run headless, or with a local user interface.

## Installation

=== "Linux"

	    sudo apt install python3-pip python3-virtualenv
		python3 -m virtualenv venv
        source venv/bin/activate
		pip3 install "nf_robot[host]"
   
=== "Windows"
   
    Installing Python via the Microsoft store is probably the easiest way to integrate it into your system without conflicting installations.
    Type "Microsft Store" in the start menu.  
    Search for python  
    Install python 3.11
    
    ![](images/desktop/image1.png){ loading=lazy, width=45% }
    
    Open Powershell
    
        python -m virtualenv venv
        .\venv\Scripts\activate.bat
        pip3 install "nf_robot[host]"

=== "Mac"

        python3 -m virtualenv venv
        source venv/bin/activate
        pip3 install "nf_robot[host]"

## Run as a headless server

In a headless mode, the stringman motion controller will connect to the [neufangled.com web control panel](http://neufangled.com/control_panel) Run from the virtualenv you set up during install

=== "Linux"

        venv/bin/stringman-headless

=== "Windows"

        .\venv\Scripts\stringman-headless.sh

=== "Mac"

        venv/bin/stringman-headless

It will print a link to the web control panel that is formatted like `https://neufangled.com/control_panel?robotid=<your robot id>`
Keep this link private. Thorough security measures are planned, but for now treat this link as a secret. 

If no configuration file is specified with `--config=<filename.json>` one will be created at `configuration.json` this will be where your specific robot's calibration parameters are stored and where your randomly generated robot id will be stored. if it is deleted, the id will change.

## Run with a local UI in LAN-only mode

If the stringman motion controller is run from the local UI, It will not transmit anything outside of your home.
However, this local UI can only be run from source

#### Local UI installation from source

    git clone https://github.com/nhnifong/cranebot3-firmware
    cd cranebot3-firmware/local_ui
    python3 -m virtualenv venv
    source venv/bin/activate
    pip install -r requirements.txt
    python3 main.py

In this mode video is transmitted over wifi from the robot components to the motion controller only when it is running.


## Connecting 

Whether starting the motion controller first, or powering on the robot components first, the motion controller should discover and connect to every component automatically.

After making the initial connection to a component, the motion controller will attempt to connect to the video stream as well. The status of all video stream connections is indicated in the bottom left. An unconnected video stream is indicated by a hollow monitor icon, and a connected stream is indicated by a filled monitor icon.

If some components don't connect, please refer to the [Troubleshooting](quality_assurance.md) page.
Or ask for help on our [Discord](https://discord.gg/T5HEvxVgbA).
