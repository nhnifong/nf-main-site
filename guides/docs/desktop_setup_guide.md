# Desktop Setup Guide

The control panel must be run on a PC on the same network as the robot components.

## Installation

=== "Linux"

	    sudo apt install python3-pip python3-virtualenv
		git clone https://github.com/nhnifong/cranebot3-firmware.git
		cd cranebot-firmware
		python3 -m virtualenv venv
		source venv/bin/activate
		pip3 install -r requirements_desktop.txt
    
   
=== "Windows"
   
    Installing Python via the Microsoft store is the easiest way to integrate it into your system.  
    Type "Microsft Store" in the start menu.  
    Search for python  
    Install python 3.9  
    
    ![](images/desktop/image1.png){ loading=lazy, width=45% }
    
    Open Powershell
    
        git clone https://github.com/nhnifong/cranebot3-firmware.git
        cd cranebot-firmware
        python -m virtualenv venv
        .\venv\Scripts\activate.bat
        pip install -r requirements_desktop.txt

## Run


=== "Linux"

	    python3 main.py

=== "Windows"

	    .\venv\Scripts\python.exe main.py

The control panel shows a view of a room with the anchors and gripper. Assuming your robot componnents have all been setup according to the Raspberry Pi Setup Guide, and are turned on, and on the same LAN, the control panel should discover and connect to them. The status of each component is shown above it.