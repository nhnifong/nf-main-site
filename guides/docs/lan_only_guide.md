# Local UI LAN-mode Guide

This guide covers the use of the Ursina-based Local UI for operating Stringman in a lan-only mode

If the stringman motion controller is run from the local UI, It will not transmit anything outside of your home.
However, this local UI can only be run from source

### Run from source

    git clone https://github.com/nhnifong/cranebot3-firmware
    cd cranebot3-firmware/local_ui
    python3 -m virtualenv venv
    source venv/bin/activate
    pip install -r requirements.txt
    python3 main.py

### Connection status

Whether starting the control panel first, or powering on the robot components first, the control panel should discover and connect to every component automatically. The status of the connection to each component is displayed above it.

![](images/usage/image1.png){ loading=lazy, width=45% }

After making the initial connection to a component, the control panel will attempt to connect to the video stream as well. The status of all video stream connections is indicated in the bottom left. An unconnected video stream is indicated by a hollow monitor icon, and a connected stream is indicated by a filled monitor icon.

![](images/usage/image2.png){ loading=lazy, width=45% }

If some components don't connect, please refer to the [Troubleshooting](quality_assurance.md) page.
Or ask for help on our [Discord](https://discord.gg/T5HEvxVgbA).

#### Status bar

The bar at the bottom of the screen shows various system health measurements such as video latency and error messages.

The STOP button can be pressed at any time to cause a soft stop. this means any task which is generating motion commands will be cancelled and all motors will be commanded to stop. After a soft stop the robot can continue to move again as soon as any task or control input is given.

![](images/usage/image3.png){ loading=lazy, width=45% }
