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
store_image: pilot-arp-main-white.jpg
image_folder: ""
images:
  - pilot-arp-main-white.jpg
  - pilot-arp-laid-out-white.jpg
  - arp-gripper-panda-white.jpg
  - pilot-corner-anchor.jpg
  - pilot-corner-anchor-nocover.jpg
  - arp-gripper-white.jpg
  - arp-gripper-nocover.jpg
show_in_store: true
store_order: 1
---

# Stringman: A Room-Scale Cable Robot

**Stringman** is a ceiling-mounted, cable-driven parallel robot (CDPR) designed to enable room-scale manipulation without the constraint of an arm clamped to a desk or the cost of humanoid navigation.

By utilizing an anchors-overhead architecture, Stringman remains entirely off the floor, offering a unique sandbox for **Imitation Learning (IL)**, **Teleoperation**, and **Home Automation** experimentation on more than just desk toys. The work area can be an entire room.

Why the ceiling? Avoiding the floor means avoiding navigation, so you can focus on higher-level tasks and start automating the organization of objects in the room while keeping it low cost.

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

Stringman is built for experimentation. The **Stringman motion controller** is the brain of the robot, running headless on a host machine. The robot can be controlled by connecting to its protobuf-based telemetry server. Two UIs are available for 3D visualization of the workspace, tension monitoring, and automatic calibration. One is a LAN-only local application, and a web-based control panel uses Neufangled Robotics' servers to allow secure access to your robot from anywhere.

Stringman currently utilizes a custom control stack in which a model for identifying targets, a model for centering the gripper, and a procedure for target-pick-and-place are combined for a pseudo-intelligent laundry pickup behavior out of the box.

- **Intuitive Teleop:** Use a gamepad to navigate the room. The system handles the complex inverse kinematics of the four-cable system for you.
- **Custom control:** The `nf_robot` Python module makes it easy to hook into the robot's state and write your own high-level behaviors.
- **The Roadmap:** We are actively working to re-integrate **LeRobot** support. The goal is to allow users to once again record datasets for ACT and Diffusion policies using our new, lower latency telemetry protocol.

---

### **Pilot Launch Disclosure**

This is a **Pilot Launch**. Both hardware and software are in active development. We are looking for "pioneer" users who want to try a new robot, share datasets, and provide feedback that will help us eventually create a fully autonomous household utility.

**Note:** The current "out of the box" autonomous behavior is to pick up laundry and drop it into the hamper with a hybrid approach. This platform is for those who are ok with trying something that may not always work, downloading the latest updates and trying things again, or training models themselves.

This listing is for a fully assembled Stringman consisting of several components, ready to mount on the wall. Build kits are also available if you want to print and assemble it.

---

### **System Requirements**

- **Host PC:** A dedicated machine (Ubuntu Linux recommended) with 6+ cores. All image processing occurs here. GPU accelerated inference is ideal, but the CPU fallback is still workable at 1 Hz since neither target nor camera are moving in this unique design.
- **Environment:** Consistent and strong indoor lighting in the work area is needed to maintain high precision.

---

### **Appearance and Livability**

- **Parked out of reach:** The support lines remain connected when powered off and hang taut across the ceiling of the room. They are thin and very hard to see from a distance, and out of reach when parked. They can be disconnected using fishing "speed clips" if needed.
- **Crown moulding look:** The spool anchors have a decorative cover that looks like white crown moulding to blend in. They are intended to be mounted to studs with wood screws. If removed, holes would need to be spackled and painted.
- **Gripper customization:** The gripper face shell is shipped in copper silk PLA but is easy to reprint in any color you like. STLs are provided on the [downloads page](/docs/downloads/).

---

### **Early Adopter Perks**

**Legacy Discount:** All Pilot Launch supporters receive a **permanent 10% discount** on all future Neufangled Robotics hardware.
