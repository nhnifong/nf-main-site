import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// Import the generated protobuf classes
import { nf } from './generated/proto_bundle.js';
import { Gripper } from './objects/gripper.ts';
import { Anchor } from './objects/anchor.ts';
import { Gantry } from './objects/gantry.ts';
import { Cable } from './objects/cable.ts';
import { DynamicRoom } from './objects/dynamic_room.ts'
import { SightingsManager } from './objects/sightings_manager.ts'
import { VideoFeed } from './ui/video_feed.ts'
import { GamepadController } from './ui/gamepad.ts'
import { TargetListManager } from './ui/target_list_manager.ts'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const urlParams: URLSearchParams = new URLSearchParams(window.location.search);
const urlRobotId: string = urlParams.get('robotid') ?? 'playroom';

// Motion perspective modes
const perspViewport = 0; 
const perspPerson = 1;
const perspTop = 2;
const perspBottom = 3;
let currentPerspective: number = perspPerson;

// Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x444444);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.01, 100);
camera.position.set(2, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });

// Initialize Composer
const composer = new EffectComposer(renderer);

// Render Pass: Draws the scene normally first
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// GTAO Pass: Adds the shading
const gtaoPass = new GTAOPass(scene, camera, window.innerWidth, window.innerHeight);
gtaoPass.setSize(window.innerWidth, window.innerHeight);
composer.addPass(gtaoPass);

// Output Pass: Tone mapping and sRGB conversion
const outputPass = new OutputPass();
composer.addPass(outputPass);

composer.setSize(window.innerWidth, window.innerHeight);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.5, 0);
controls.update();

// Lights
const ambientLight = new THREE.AmbientLight(0x808080, 2);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 3);
dirLight.position.set(2, 5, 2);
scene.add(dirLight);

// Geometry
const room = new DynamicRoom(scene);

// Input handler
const gamepad = new GamepadController();

// Anchors
// default poses for four anchors. nf.common.Pose in specified in Z up coordinate system
const acoords = [
  { x: 2.5,  y: -2.5, rotZ: -Math.PI / 4 },
  { x: 2.5,  y: 2.5,  rotZ: -3 * Math.PI / 4 },
  { x: -2.5, y: 2.5,  rotZ: 3 * Math.PI / 4 },
  { x: -2.5, y: -2.5, rotZ: Math.PI / 4 },
];

const anchors: Anchor[] = acoords.map((ac) => {
  const anchor = new Anchor(scene, room);
  anchor.setPose(nf.common.Pose.create({
    position: { x: ac.x, y: ac.y, z: 3 },
    rotation: { x: 0, y: 0, z: ac.rotZ }
  }));
  return anchor; 
});

// Gantry
const gantry = new Gantry(scene);

// Gripper
const gripper = new Gripper(scene);

// Anchor-Gantry Cables
const cables: Cable[] = [0, 1, 2, 3].map((i) => {
  const cable = new Cable(scene);
  cable.update(anchors[i].grommet_pos, gantry.position, 0.0)
  return cable; 
});

// Gantry-Gripper cable
const winchCable = new Cable(scene);
winchCable.update(gantry.position, gripper.grommet_pos, 0.0)

// Visual gantry factor
const gantryVisualCube = new THREE.Mesh(
  new THREE.BoxGeometry(0.1, 0.1, 0.1),
  new THREE.MeshStandardMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 }));
gantryVisualCube.quaternion.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), Math.PI / 4 );
gantryVisualCube.position.set(-0.2, 1.5, 0);
scene.add(gantryVisualCube);

// Visual hang factor
const gantryHangCube = new THREE.Mesh(
  new THREE.BoxGeometry(0.1, 0.1, 0.1),
  new THREE.MeshStandardMaterial({ color: 0x0099ff, transparent: true, opacity: 0.5 }));
gantryHangCube.quaternion.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), Math.PI / 4 );
gantryHangCube.position.set(0.2, 1.5, 0);
scene.add(gantryHangCube);

// gantry sightings manager
const sightingsManager = new SightingsManager(scene);

const targetListManager = new TargetListManager();

// gamepad needs a reference
gamepad.targetListManager = targetListManager;

// Video feed managers
const firstOverheadVideo = new VideoFeed(document.getElementById('firstOverhead')!, targetListManager);
const secondOverheadVideo = new VideoFeed(document.getElementById('secondOverhead')!, targetListManager);
const gripperVideo = new VideoFeed(document.getElementById('gripper')!);
const overheadVideofeeds = [firstOverheadVideo, secondOverheadVideo];

// Listen for hover changes in the manager to trigger repaints in video feeds
targetListManager.onTargetHover = () => {
    firstOverheadVideo.refresh();
    secondOverheadVideo.refresh();
};

targetListManager.onTargetSelect = () => {
    firstOverheadVideo.refresh();
    secondOverheadVideo.refresh();
};

// Connection to backend
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${protocol}//${window.location.host}/control/${urlRobotId}`;
let socket: WebSocket;

function connect() {
  socket = new WebSocket(wsUrl);
  socket.binaryType = 'arraybuffer';

  socket.onopen = () => {
    console.log('Connected to telemetry stream');
  };

  socket.onmessage = (event: MessageEvent) => {
    try {
      // Decode binary data into a message object
      const data = new Uint8Array(event.data as ArrayBuffer);
      const batch = nf.telemetry.TelemetryBatchUpdate.decode(data);

      for (const update of batch.updates) {
        if (update.newAnchorPoses) {
          handleNewAnchorPoses(update.newAnchorPoses);
        }
        else if (update.posEstimate) {
          handlePosEstimate(update.posEstimate);
        }
        else if (update.posFactorsDebug) {
          handlePosFactorsDebug(update.posFactorsDebug);
        }
        else if (update.lastCommandedVel) {
          handleLastCommandedVel(update.lastCommandedVel);
        }
        else if (update.vidStats) {
          handleVidStats(update.vidStats);
        }
        // else if (update.componentConnStatus) {
        //   handleComponentConnStatus(update.componentConnStatus);
        // }
        else if (update.targetList) {
          handleTargetList(update.targetList);
        }
        else if (update.gantrySightings) {
          sightingsManager.handleSightings(update.gantrySightings);
        }
        else if (update.popMessage) {
          showPopup(update.popMessage);
        }
        else if (update.namedPosition) {
          handleNamedPosition(update.namedPosition);
        }
        else if (update.videoReady) {
          handleVideoReady(update.videoReady);
        }
        else if (update.uplinkStatus) {
          handleUplinkStatus(update.uplinkStatus)
        }


      }
    } catch (err) {
      console.error("Decode error:", err);
    }
  };

  socket.onclose = () => {
    console.warn("Disconnected. Retrying in 2s...");
    setTimeout(connect, 2000);
  };
}

connect();

function sendGamepad() {
  const items = gamepad.checkInputsAndCreateControlItems();
  if (items.length > 0) {
    sendControl(items);
  }
}

// --- Render Loop ---
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  sightingsManager.update();
  composer.render();
  sendGamepad();
}

animate();

// Resize Handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

//  ===== telemetry update handlers =====

// Reposition anchors
function handleNewAnchorPoses(data: nf.telemetry.IAnchorPoses) {
  if (data.poses && data.poses.length == 4) {
    data.poses.forEach((apose, i) => {
      // When the anchor poses telemetry message is sent, a pose is sent for each of four anchors
      // in order of their anchor number
      anchors[i].setPose(apose)
    });
  }
}

function handlePosEstimate(data: nf.telemetry.IPositionEstimate) {
  if (data.gantryPosition) {
    gantry.setPosition(data.gantryPosition);
    // redraw cables
    cables.forEach((cable, i) => {
      cable.update(anchors[i].grommet_pos, gantry.position, data.slack![i] ? 0.2 : 0.0)
    });
    winchCable.update(gantry.position, gripper.grommet_pos, 0.0)
    // Inform input controller so it can calculate input orbits
    gamepad.setRobotPosition(data.gantryPosition.x!, data.gantryPosition.y!);
  }

  if (data.gripperPose) {
    // Draw velocity indicator
    gripper.setPose(data.gripperPose);
  }
}

function handlePosFactorsDebug(data: nf.telemetry.IPositionFactors) {
  if (data.visualPos) {
    gantryVisualCube.position.set(data.visualPos.x!, data.visualPos.z!, -data.visualPos.y!);
  }
  if (data.hangingPos) {
    gantryHangCube.position.set(data.hangingPos.x!, data.hangingPos.z!, -data.hangingPos.y!);
  }
}

function handleLastCommandedVel(data: nf.telemetry.ICommandedVelocity) {
  if (data.velocity) {
    // Draw commanded velocity indicator
    gantry.setVelocity(data.velocity);
  }
}

function handleVidStats(data: nf.telemetry.IVidStats) {
  // Get Elements
  const dpsEl = document.getElementById('detectionRate');
  const latEl = document.getElementById('videoLatency');
  const fpsEl = document.getElementById('videoFramerate');

  // Format & Update elements
  if (dpsEl) {
    dpsEl.textContent = (data.detectionRate ?? 0).toFixed(1);
  }
  if (latEl) {
    latEl.textContent = (data.videoLatency ?? 0).toFixed(2) + ' s';
  }
  if (fpsEl) {
    fpsEl.textContent = (data.videoFramerate ?? 0).toFixed(1) + ' fps';
  }
}

// function handleComponentConnStatus(data: nf.telemetry.IComponentConnStatus) {
//   // tells us the status of the connection between observer and indibidual robot components.
// }

function handleTargetList(data: nf.telemetry.ITargetList) {
  const targets = data.targets ?? [];

  // show the targets in every video feed
  overheadVideofeeds.forEach(feed => {feed.updateList(data)});
  targetListManager.updateList(targets);
}

function showPopup(data: nf.telemetry.IPopup) {
    const overlay = document.getElementById('popup-overlay');
    const msgEl = document.getElementById('popup-message');

    if (overlay && msgEl && data.message) {
        msgEl.textContent = data.message;
        overlay.classList.remove('hidden');
    }
}

function handleNamedPosition(data: nf.telemetry.INamedObjectPosition) {
  if (data.name) {
    if (data.position) {
      // moved the named object
      if (data.name == 'hamper') {
        room.setHamper(data.position);
      }
      else if (data.name == 'gamepad') {
        room.setPersonTagPosition(data.position);
      }
      // else if (data.name == 'gantry_goal_marker') {
        
      // }
    } else {
      // hide the named object
    }
  }
}

function handleVideoReady(data: nf.telemetry.IVideoReady) {
  if (!data.streamPath) {
    console.error("Got VideoReady update but it doesn't contain a streamPath");
    return;
  }
  const parts: string[] = data.streamPath.split("/");
  if (parts.length != 3) {
    console.error(`Got VideoReady update but streamPath could not be parsed ${data.streamPath}`);
    return;
  }
  const cam_num = parseInt(parts[2]); // Note that this is not anchor num in stringman pilot.
  const videoManager = [gripperVideo, firstOverheadVideo, secondOverheadVideo][cam_num];
  videoManager.connect(data.streamPath);
  if (!data.isGripper && data.anchorNum != null) {
    videoManager.assign(data.anchorNum); // anchor num is here
    if (anchors[data.anchorNum].camera) {
      videoManager.setVirtualCamera(anchors[data.anchorNum].camera!);

      // When the mouse moves on this video feed and a ray intersects the floor
      videoManager.onFloorPoint = (point) => {
        room.setReticule(point)
      };
    }
  }
}

function handleUplinkStatus(data: nf.telemetry.IUplinkStatus) {
  // Indicates whether the robot is connected to control_plane
  // update the indicator dot
  const online = data.online;

  const statusDot = document.getElementById('status-dot-el');
  const statusText = document.getElementById('status-text');
  const runBtn = document.getElementById('run-btn');

  if (statusDot && statusText && runBtn) {
    if (online) {
      statusDot.classList.remove('status-offline');
      statusText.textContent = 'Online';
      runBtn.classList.remove('disabled');
    } else {
      statusDot.classList.add('status-offline');
      statusText.textContent = 'Offline';
      runBtn.classList.add('disabled');

      firstOverheadVideo.setOffline();
      secondOverheadVideo.setOffline();
      gripperVideo.setOffline();
    }
  }
}

// Function called when mode changes
function onPerspectiveChanged(mode: number) {
  switch (mode) {
    case perspViewport:
      gamepad.setOrbitCenter(camera);
      break;

    case perspPerson:
      if (room.userPers) {
        gamepad.setOrbitCenter(room.userPers);
      }
      break;

    case perspTop:
      if (firstOverheadVideo.virtualCamera) {
        gamepad.setOrbitCenter(firstOverheadVideo.virtualCamera);
      }
      break;

    case perspBottom:
      if (secondOverheadVideo.virtualCamera) {
        gamepad.setOrbitCenter(secondOverheadVideo.virtualCamera);
      }
      break;

  }
}

// Helper to handle state change and UI updates
function setPerspective(mode: number) {
    // Update state
    currentPerspective = mode;

    // Update UI classes
    const buttonIds: Record<number, string> = {
        [perspViewport]: 'btn-viewport',
        [perspPerson]: 'btn-person',
        [perspTop]: 'btn-top',
        [perspBottom]: 'btn-bottom'
    };

    // Remove 'perspective-button-selected' from all buttons
    Object.values(buttonIds).forEach(id => {
        document.getElementById(id)?.classList.remove('perspective-button-selected');
    });

    // Add 'perspective-button-selected' to the active button
    const activeId = buttonIds[mode];
    document.getElementById(activeId)?.classList.add('perspective-button-selected');

    onPerspectiveChanged(mode);
}

// Initialize listeners for perspective button
function initPerspectiveControls() {
    document.getElementById('btn-viewport')?.addEventListener('click', () => setPerspective(perspViewport));
    document.getElementById('btn-person')?.addEventListener('click', () => setPerspective(perspPerson));
    document.getElementById('btn-top')?.addEventListener('click', () => setPerspective(perspTop));
    document.getElementById('btn-bottom')?.addEventListener('click', () => setPerspective(perspBottom));
    
    setPerspective(currentPerspective);
}

initPerspectiveControls();


window.addEventListener('resize', () => {
    // Update Composer
    composer.setSize(window.innerWidth, window.innerHeight);
    // Update GTAO specific size
    gtaoPass.setSize(window.innerWidth, window.innerHeight);
});

// One-time setup to bind the button in the popup window
function initPopup() {
    const overlay = document.getElementById('popup-overlay');
    const btn = document.getElementById('popup-ok');

    if (overlay && btn) {
        btn.addEventListener('click', () => {
            overlay.classList.add('hidden');
        });
    }
}

initPopup();

// Send a list of ControlItems immediately
function sendControl(items: Array<nf.control.ControlItem>) {
  const batchData = nf.control.ControlBatchUpdate.create({
    robotId: urlRobotId,
    updates: items
  });

  // protobufjs method of serialization
  const writer = nf.control.ControlBatchUpdate.encode(batchData);
  const serializedBinaryData = writer.finish();
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(serializedBinaryData);
    // if the socket exists but has disconnected, this is a nop
  }
}

// Send a single command to the robot.
function simpleCommand(cmdEnum: nf.control.Command) {
    sendControl([nf.control.ControlItem.create({
      command: {name: cmdEnum}
    })]);
}

overheadVideofeeds.forEach(feed => {feed.sendFn = sendControl});
targetListManager.sendFn = sendControl;

// --- Run menu ---
function initRunMenu() {
    const runBtn = document.getElementById('run-btn');
    const runMenu = document.getElementById('run-menu');
    const stopBtn = document.getElementById('stop-btn');

    // Toggle Menu
    if (runBtn && runMenu) {
        runBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent document click from immediately closing it
            runMenu.classList.toggle('show');
        });
    }

    // Close menu when clicking outside
    document.addEventListener('click', () => {
        if (runMenu && runMenu.classList.contains('show')) {
            runMenu.classList.remove('show');
        }
    });

    // Helper to bind menu items to simpleCommand
    const bindCommand = (elementId: string, cmdEnum: nf.control.Command) => {
        const el = document.getElementById(elementId);
        if (el) {
            el.addEventListener('click', () => {
                if (!el.classList.contains('disabled')) {
                    simpleCommand(cmdEnum);
                    // close menu after selection
                    runMenu?.classList.remove('show');
                }
            });
        }
    };

    // Bind all menu actions
    const Command = nf.control.Command;

    bindCommand('action-pick-drop',      Command.COMMAND_PICK_AND_DROP);
    bindCommand('action-tension',        Command.COMMAND_TIGHTEN_LINES);
    bindCommand('action-full-cal',       Command.COMMAND_FULL_CAL);
    bindCommand('action-half-cal',       Command.COMMAND_HALF_CAL);
    bindCommand('action-grasp',          Command.COMMAND_GRASP);
    bindCommand('action-dataset',        Command.COMMAND_SUBMIT_TARGETS_TO_DATASET);
    // bindCommand('action-zero-winch',     Command.COMMAND_ZERO_WINCH);
    // bindCommand('action-horiz-check',    Command.COMMAND_HORIZONTAL_CHECK);
    bindCommand('action-collect-images', Command.COMMAND_COLLECT_GRIPPER_IMAGES);
    // bindCommand('action-park',           Command.COMMAND_PARK);
    // bindCommand('action-unpark',         Command.COMMAND_UNPARK);

    // stop
    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            console.log("Stop current task");
            simpleCommand(Command.COMMAND_STOP_ALL);
        });
    }
}

// Initialize run menu listeners
initRunMenu();