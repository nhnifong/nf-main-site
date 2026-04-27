---
title: Stringman Arpeggio
intro: >
  An automatic decluttering system, hung from anchors mounted in the corners of
  your ceiling and controlled by self-hosted AI or gamepad. 'Arpeggio' is the
  second hardware version of Stringman. This product contains the newest gripper
  based on the ST3215 motors featuring a wrist joint, and powerful, quiet,
  Damiao hub motor based anchors in a 2+2 configuration.
price: "$1235"
shipping: Ships in 5-8 days to the United States or Canada
badge: In Stock
store_description: >
  The complete and latest Stringman system, fully assembled. Includes 2 anchors,
  2 eyelets, gripper, and accessories.
store_image: stringman_white.jpg
image_folder: ""
images:
  - stringman_white.jpg
  - everything_white.jpg
  - arp-anchor-face.jpg
  - arp-anchor-bottom.jpg
  - arp-gripper-white.jpg
  - arp-gripper-nocover.jpg
  - arp-gripper-panda-copper.jpg
  - stringman_copper.jpg
show_in_store: true
store_order: 1
---

# Stringman: A Room-Scale Cable Robot

**Stringman** is a ceiling-mounted, cable-driven parallel robot (CDPR) designed to enable room-scale manipulation without the constraint of an arm clamped to a desk or the cost of humanoid navigation.

By utilizing an anchors-overhead architecture, Stringman remains entirely off the floor, offering a unique sandbox for **Imitation Learning (IL)**, **Teleoperation**, and **Home Automation** experimentation on more than just desk toys. The work area can be an entire room.

Why the ceiling? Avoiding the floor means avoiding navigation and balance, so you can focus on higher-level tasks and start automating the organization of objects in the room while keeping it low cost.

### **The Platform**

Stringman is an open source hardware platform and software stack. It is fully compatible with the Lerobot AI framework and recording datasets can be done from the UI.

- **Kinematics:** 4-wire suspended motion system based on two pairs of anchors and two passive eyelets. 2-dof gripper.
- **Payload:** 3 kg dynamic lifting capacity (specific capacity depends on end effector speed and altitude.)
- **Workspace:** Rooms up to 7 meters from one floor corner to opposite ceiling corner (about 5m × 5m × 3m).
- **Compute:** External. Robot components run on Raspberry Pi Zero 2Ws streaming video to a host machine running the motion controller.

---

### **Technical Specifications**

| Feature | Specification |
|---------|---------------|
| **Vision System** | 3-Camera (2 overhead cameras in anchors, 1 wrist camera viewing fingers) for global localization and target identification. |
| **End-Effector** | Two-fingered servo gripper with integrated finger pressure sensor, IMU, and laser rangefinder. |
| **Anchors** | 2 anchors, each housing a pair of Damiao H6215 BLDC direct drive hub motors with integrated FOC controllers for quiet and powerful motion. Two additional eyelets are mounted on adjacent walls to create four pull points. |
| **Power** | Two outlets are required, one near each anchor. 24V is supplied to the gripper via one of the support lines. |
| **Safety** | Independent wireless hardware E-Stop to instantly kill power to all modules. Motors deactivate when excessive torque is applied, so a person can overpower them if necessary. |

---

### **Control & Intelligence**

Stringman is built for experimentation. The **Stringman motion controller** is the brain of the robot, running headless on a host machine. The robot can be controlled by connecting to its protobuf-based telemetry server.

A [web-based UI](/playroom) allows 3D visualization of the workspace, tension monitoring, and automatic calibration. The robot can operate in LAN-only local mode where no data leaves your network, or in a cloud telemetry mode that uses Neufangled Robotics' servers to allow secure access to your robot from anywhere.

A cloud connected robot can also be shared with other logged in users for remote operation.

Stringman currently utilizes a custom control stack using one model for identifying targets, and lerobot trained models for grasping tasks. Dropoff locations are specified by attaching April tags to bins such as the laundry hamper. A procedure combines these for continuous target-pick-and-place.

- **Intuitive Teleop:** Use a gamepad to navigate the room. The system handles the complex inverse kinematics of the four-cable system for you, and can be made to orbit your position in the room.
- **Custom control:** The `nf_robot` Python module makes it easy to hook into the robot's state and write your own high-level behaviors.
- **Lerobot:** Record teleoperation datasets from the control panel and train your own AI using Google colab to imitate any behavior you need.

---

### **Arpeggio Launch**

Arpeggio is the code name of the second hardware version of Stringman. Software is in active development but this hardware is planned to be the latest until 2027. The flagship features of this version are the motors which have roughtly 8x the torque of their predecessors, as well as the gripper's wrist, which allows networks to learn to grasp objects at the ideal angle.

We are looking for pioneer users who want to try a new robot, share datasets, and provide feedback that will help us eventually create a fully autonomous household utility.

**Note:** The current "out of the box" autonomous behavior is to pick up laundry and drop it into the hamper with a hybrid approach. This platform is for those who are ok with trying something that may not always work, downloading the latest updates and trying things again, or training models themselves.

This listing is for a fully assembled Stringman consisting of several components, ready to mount on the wall. Build kits are also available if you want to print and assemble it.

---

### **System Requirements**

- **Host PC:** A machine (Ubuntu Linux recommended) with 6+ cores. If no GPU or NPU is present the robot can still be driven manually, but no AI based control will be possible.
- **Environment:** Consistent and strong indoor lighting in the work area is needed to maintain high precision.
- **Game Controller:** Analog stick inputs from a game controller are highly reccomended for fine control of Stringman when recording a dataset. Keyboard control is supported.

---

### **Appearance and Livability**

- **Parked out of reach:** The support lines remain connected when powered off and hang taut across the ceiling of the room. They are thin and very hard to see from a distance, and out of reach when parked. They can be disconnected in about 1 minute using carabiners. The gripper hangs on a parking structure also mounted to the wall, with the flexibility to place this structure on any wall above head level.
- **Quick disconnect:** If necessary the whole system can be removed from the walls without tools and stored in about five minutes, leaving only small white butterfly shaped brackets on the wall.
- **Mounting options:** Anchors can be mounted into studs behind drywall, onto drop-ceiling T-bars, or on tripods if they are sufficiently stable and weighed down.
- **Crown moulding look:** The spool anchors have a decorative cover that looks like white crown moulding to blend in.
- **Gripper customization:** The gripper face shell is shipped in copper silk PLA but is easy to reprint in any color you like. STLs are provided on the [downloads page](/docs/downloads/).

---

### **Early Adopter Perks**

**Supporter Discount:** All early launch supporters receive a **permanent 10% discount** on all future Neufangled Robotics hardware.
