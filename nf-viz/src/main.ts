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

// Auth Manager
import * as AuthManager from './auth.ts';

// --- GLOBAL VARIABLES ---
const urlParams: URLSearchParams = new URLSearchParams(window.location.search);
// If robotid is set in URL, we force cloud login. Otherwise we start the landing UI.
let currentRobotId: string | null = urlParams.get('robotid'); 
let detectedRobotId: string | null = null; // Stored from incoming telemetry

// Motion perspective modes
const perspViewport = 0; 
const perspPerson = 1;
const perspTop = 2;
const perspBottom = 3;
const perspGripper = 5;
let currentPerspective: number = perspGripper; // control the initial selection

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
// laser rangefinder feedback re-uses sightings manager class
const laserReadings = new SightingsManager(scene, {color: 0xFF0000, radius: 0.005});

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

// ------ Authorization and Connection Logic ------

let socket: WebSocket;
let isLanMode = false; 
let isSimMode = false; // Track simulator mode

// Helpers to sync URL
function setUrlParam(id: string | null) {
  const url = new URL(window.location.href);
  if (id) {
    url.searchParams.set('robotid', id);
  } else {
    url.searchParams.delete('robotid');
  }
  window.history.pushState({}, '', url);
}

// Entry Point
function initApp() {
  // Always init firebase to check auth state for button label
  AuthManager.initAuth((user) => {
    const btn = document.getElementById('btn-cloud-mode');
    if (btn) {
      if (user) {
        btn.innerHTML = `My Robots<div class="landing-hint">Manage your cloud-connected robots</div>`;
      } else {
        btn.innerHTML = `Log in<div class="landing-hint">Manage your cloud-connected robots</div>`;
      }
    }
  });

  if (currentRobotId === 'lan') {
    startLanFlow();
  } else if (currentRobotId === 'sim') {
    startSimFlow();
  } else if (currentRobotId) {
    // URL param set -> Force cloud flow
    updateRobotIdUI(currentRobotId);
    startCloudFlow(currentRobotId);
  } else {
    // No URL param -> Show landing page
    const landing = document.getElementById('landing-layer');
    if (landing) landing.classList.remove('hidden');

    // Bind landing buttons
    document.getElementById('btn-lan-mode')?.addEventListener('click', startLanFlow);
    document.getElementById('btn-sim-mode')?.addEventListener('click', startSimFlow);
    document.getElementById('btn-cloud-mode')?.addEventListener('click', handleCloudLogin);
    
    // Bind binding panel buttons
    document.getElementById('btn-cancel-bind')?.addEventListener('click', () => {
      document.getElementById('landing-layer')?.classList.add('hidden');
      document.getElementById('bind-robot-panel')?.classList.add('hidden');
      document.getElementById('landing-options')?.classList.remove('hidden');
    });
    
    document.getElementById('btn-confirm-bind')?.addEventListener('click', executeBind);
  }
}

// LAN Mode Flow
function startLanFlow() {
  isLanMode = true;
  setUrlParam('lan');
  document.getElementById('landing-layer')?.classList.add('hidden');
  updateRobotIdUI("Localhost");
  
  // Show the Bind button since we are in LAN mode
  document.getElementById('action-bind')?.classList.remove('hidden');
  
  // Connect directly without auth or path
  connect("ws://localhost:4245");
}

// Sim Mode Flow
function startSimFlow() {
  isSimMode = true;
  setUrlParam('sim');
  document.getElementById('landing-layer')?.classList.add('hidden');
  updateRobotIdUI("Simulated Pilot");
  
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/simulated/pilot`;
  
  connect(wsUrl);
}

// Cloud Mode Flow
async function handleCloudLogin() {
  // Ensure Auth init is called (lazy)
  AuthManager.initAuth();
  
  try {
    const token = await AuthManager.getAuthToken();
    
    // Switch to list view in landing panel
    document.getElementById('landing-options')?.classList.add('hidden');
    const listPanel = document.getElementById('robot-list-panel');
    listPanel?.classList.remove('hidden');

    // Fetch robot list
    const robots = await AuthManager.apiListRobots(token);
    renderRobotList(robots);
  } catch (error) {
    console.error("Login failed:", error);
    alert("Login failed. Check console for details.");
  }
}

async function startCloudFlow(robotId: string) {
  AuthManager.initAuth();
  
  try {
    const token = await AuthManager.getAuthToken();
    
    // Hide landing if visible
    document.getElementById('landing-layer')?.classList.add('hidden');
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/control/${robotId}?token=${encodeURIComponent(token)}`;
    
    connect(wsUrl);
  } catch (error) {
    console.error("Cloud connection failed:", error);
  }
}

// --- Binding Logic ---

async function handleBindAction() {
  // Ensure we have the robot ID from telemetry
  if (!detectedRobotId) {
    alert("Cannot bind: Robot ID not yet received from telemetry.");
    return;
  }

  // Force Login (if not already)
  AuthManager.initAuth();
  try {
    await AuthManager.getAuthToken();
    
    // Show Bind Panel
    const landing = document.getElementById('landing-layer');
    const options = document.getElementById('landing-options');
    const bindPanel = document.getElementById('bind-robot-panel');
    
    if (landing && options && bindPanel) {
      landing.classList.remove('hidden');
      options.classList.add('hidden');
      bindPanel.classList.remove('hidden');
    }
  } catch (error) {
    console.error("Login required for binding:", error);
    alert("You must log in to bind a robot.");
  }
}

async function executeBind() {
  const nicknameInput = document.getElementById('bind-nickname') as HTMLInputElement;
  const nickname = nicknameInput?.value || "Stringman";
  
  if (!detectedRobotId) return;

  try {
    const token = await AuthManager.getAuthToken();
    
    await AuthManager.apiBindRobot(detectedRobotId, nickname, token);

    // Success
    document.getElementById('landing-layer')?.classList.add('hidden');
    document.getElementById('bind-robot-panel')?.classList.add('hidden');
    
    // Show nice confirmation
    showPopup({message: "Success! Robot bound to your account.\n\nPlease restart stringman-headless with --telemetry_env=production"});

  } catch (error) {
    console.error(error);
    alert("Failed to bind robot. See console.");
  }
}

// --- Unbind Logic ---

// Callback storage for the confirmation dialog
let pendingConfirmAction: (() => void) | null = null;

function initConfirmDialog() {
  const overlay = document.getElementById('confirm-overlay');
  const yesBtn = document.getElementById('confirm-yes');
  const noBtn = document.getElementById('confirm-no');

  if (yesBtn) {
    yesBtn.addEventListener('click', () => {
      if (pendingConfirmAction) pendingConfirmAction();
      overlay?.classList.add('hidden');
      pendingConfirmAction = null;
    });
  }

  if (noBtn) {
    noBtn.addEventListener('click', () => {
      overlay?.classList.add('hidden');
      pendingConfirmAction = null;
    });
  }
}
initConfirmDialog();

function handleUnbindClick(e: Event, robotId: string) {
  e.stopPropagation(); // prevent selecting the robot
  
  const overlay = document.getElementById('confirm-overlay');
  const msg = document.getElementById('confirm-message');
  
  if (overlay && msg) {
    msg.textContent = `Unlink robot ${robotId} from your account?`;
    overlay.classList.remove('hidden');
    
    pendingConfirmAction = () => executeUnbind(robotId);
  }
}

async function executeUnbind(robotId: string) {
  try {
    const token = await AuthManager.getAuthToken();
    
    await AuthManager.apiUnbindRobot(robotId, token);

    // Refresh list
    const robots = await AuthManager.apiListRobots(token);
    renderRobotList(robots);

  } catch (error) {
    console.error("Unbind error:", error);
    alert("Failed to unlink robot.");
  }
}

// --- List Logic ---

function renderRobotList(robots: AuthManager.RobotInfo[]) {
  const container = document.getElementById('robot-list-container');
  if (!container) return;
  container.innerHTML = '';

  if (robots.length === 0) {
    container.innerHTML = '<div style="padding:20px; color:#aaa">No robots found. You must first connect in LAN mode and select Bind from the run menu.</div>';
    return;
  }

  robots.forEach(bot => {
    const el = document.createElement('div');
    el.className = 'robot-list-item';
    
    // Create inner structure manually to bind events cleanly
    const infoDiv = document.createElement('div');
    infoDiv.style.flexGrow = '1';
    infoDiv.innerHTML = `
        <div class="robot-name">${bot.nickname || 'Unnamed Robot'}</div>
        <div class="robot-id">${bot.robotid}</div>
    `;
    
    const statusDiv = document.createElement('div');
    statusDiv.className = `status-badge ${bot.online ? 'status-online' : ''}`;
    statusDiv.textContent = bot.online ? 'ONLINE' : 'OFFLINE';

    // Unbind button with SVG icon (Broken Link)
    const unbindBtn = document.createElement('button');
    unbindBtn.className = 'btn-unbind';
    unbindBtn.title = 'Unlink Robot';
    unbindBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        <line x1="14" y1="11" x2="10" y2="13" stroke="currentColor" stroke-width="2" stroke-dasharray="2"></line> <!-- Simulating broken link with dash -->
      </svg>
    `;
    
    unbindBtn.onclick = (e) => handleUnbindClick(e, bot.robotid);

    el.appendChild(infoDiv);
    el.appendChild(statusDiv);
    el.appendChild(unbindBtn);

    el.onclick = () => {
      currentRobotId = bot.robotid;
      updateRobotIdUI(currentRobotId);
      // Update URL without reload
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('robotid', currentRobotId);
      window.history.pushState({}, '', newUrl);
      
      startCloudFlow(currentRobotId);
    };
    container.appendChild(el);
  });
}

function updateRobotIdUI(id: string) {
  const el = document.getElementById('ui-robot-id');
  if (el) el.textContent = id;
}

// --- WebSocket Logic ---

function disconnect() {
  if (socket) {
    // Disable the onclose handler so it doesn't try to reconnect
    socket.onclose = null;
    socket.close();
  }
  updateOnlineStatus(false);
  
  // Reset modes
  isLanMode = false;
  isSimMode = false;
  updateRobotIdUI("Unknown");
  setUrlParam(null);
}

function connect(wsUrl: string) {
  if (socket) {
    // Clear onclose to prevent the old socket from triggering a reconnect loop
    // or interfering with the new connection
    socket.onclose = null;
    socket.close();
  }

  console.log("Connecting to:", wsUrl);
  socket = new WebSocket(wsUrl);
  socket.binaryType = 'arraybuffer';

  socket.onopen = () => {
    console.log('Connected to telemetry stream');
    
    // In LAN/Sim mode, we don't get UplinkStatus, so we assume online immediately
    if (isLanMode || isSimMode) {
      updateOnlineStatus(true);
    }
  };

  socket.onmessage = (event: MessageEvent) => {
    try {
      const data = new Uint8Array(event.data as ArrayBuffer);
      const batch = nf.telemetry.TelemetryBatchUpdate.decode(data);

      // Capture ID from telemetry stream if available
      if (batch.robotId && batch.robotId !== detectedRobotId) {
        detectedRobotId = batch.robotId;
        console.log("Telemetry from Robot ID:", detectedRobotId);
        if (isLanMode) {
          updateRobotIdUI(detectedRobotId);
        }
      }

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
        else if (update.componentConnStatus) {
          handleComponentConnStatus(update.componentConnStatus);
        }
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
          handleUplinkStatus(update.uplinkStatus);
        }
        else if (update.gripSensors) {
          handleGripSensors(update.gripSensors);
        }
        else if (update.gripCamPreditions) {
          gripperVideo.setGripperPredictions(update.gripCamPreditions);
        }
        else if (update.operationProgress) {
          handleOperationProgress(update.operationProgress);
        }
      }
    } catch (err) {
      console.error("Decode error:", err);
    }
  };

  socket.onclose = (event) => {
    if (event.code === 1008) {
      console.error("Authentication failed. Not retrying automatically.");
    } else {
      console.warn("Disconnected. Retrying in 2s...");
      updateOnlineStatus(false);
      setTimeout(() => connect(wsUrl), 2000);
    }
  };
  
  socket.onerror = (err) => {
    console.error("WebSocket Error:", err);
  };
}

function handleOperationProgress(data: nf.telemetry.IOperationProgress) {
  const container = document.getElementById('op-progress-container');
  const nameEl = document.getElementById('op-name');
  const actionEl = document.getElementById('op-action');
  const fillEl = document.getElementById('op-bar-fill');

  if (!container || !nameEl || !actionEl || !fillEl) return;

  // 100% Logic
  if ((data.percentComplete ?? 0) >= 100) {
    container.classList.add('hidden');
    // Use data.name and data.currentAction for the popup
    showPopup({ message: `${data.name ?? 'Operation'} Complete\n${data.currentAction ?? ''}` });
    return;
  }

  // Show and Update
  container.classList.remove('hidden');
  nameEl.textContent = data.name ?? 'Operation';
  actionEl.textContent = data.currentAction ?? '';
  fillEl.style.width = `${Math.max(0, Math.min(100, data.percentComplete ?? 0))}%`;
}

// Start the app
initApp();

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
  laserReadings.update();
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

  // redraw cables
  cables.forEach((cable, i) => {
    cable.update(anchors[i].grommet_pos, gantry.position, 0.0);
  });
  winchCable.update(gantry.position, gripper.grommet_pos, 0.0);
}

function handlePosEstimate(data: nf.telemetry.IPositionEstimate) {
  if (data.gantryPosition) {
    gantry.setPosition(data.gantryPosition);
    // redraw cables
    cables.forEach((cable, i) => {
      cable.update(anchors[i].grommet_pos, gantry.position, data.slack![i] ? 0.2 : 0.0);
    });
    winchCable.update(gantry.position, gripper.grommet_pos, 0.0);
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

// Track state of all components since updates arrive one by one
interface ComponentState {
  name: string;
  type: 'Anchor' | 'Gripper';
  status: number;
  ip: string;
}
const componentStates = new Map<string, ComponentState>();

function handleComponentConnStatus(data: nf.telemetry.IComponentConnStatus) {
  // Identify Component Name & Type
  let name = "Unknown";
  let type: 'Anchor' | 'Gripper' = 'Anchor';

  if (data.isGripper) {
    type = 'Gripper';
    if (data.gripperModel === nf.telemetry.GripperModel.GRIPPERMODEL_ARPEGGIO) {
      name = "Arpeggio Gripper";
    } else {
      name = "Pilot Gripper";
    }
  } else {
    type = 'Anchor';
    name = `Anchor ${data.anchorNum}`;
  }

  // Update Map
  componentStates.set(name, {
    name: name,
    type: type,
    status: data.websocketStatus ?? nf.telemetry.ConnStatus.CONNSTATUS_NOT_DETECTED,
    ip: data.ipAddress ?? ""
  });

  // Recalculate Totals
  let anchorCount = 4; // TODO from another message we should be told the expected total based on the model of installed anchor
  let anchorConnected = 0;
  let gripperCount = 1;
  let gripperConnected = 0;

  componentStates.forEach(comp => {
    const isConnected = comp.status === nf.telemetry.ConnStatus.CONNSTATUS_CONNECTED;
    
    if (comp.type === 'Anchor') {
      if (isConnected) anchorConnected++;
    } else if (comp.type === 'Gripper') {
      if (isConnected) gripperConnected++;
    }
  });

  // Update Button Text
  const btnText = document.getElementById('component-status-text');
  if (btnText) {
    btnText.textContent = `Anchors (${anchorConnected}/${anchorCount}) Gripper (${gripperConnected}/${gripperCount})`;
  }

  // Update Popup List
  const menu = document.getElementById('component-menu');
  if (menu) {
    menu.innerHTML = '';
    
    // Sort keys alphabetically for consistent display
    const sortedKeys = Array.from(componentStates.keys()).sort();

    if (sortedKeys.length === 0) {
      menu.innerHTML = '<div class="menu-item disabled">Waiting for telemetry...</div>';
      return;
    }

    sortedKeys.forEach(key => {
      const comp = componentStates.get(key)!;
      const row = document.createElement('div');
      row.className = 'comp-row';

      const isConnected = comp.status === nf.telemetry.ConnStatus.CONNSTATUS_CONNECTED;
      const statusClass = isConnected ? 'comp-status-good' : 'comp-status-bad';
      const statusText = isConnected ? 'Connected' : 'Disconnected';
      const ip = comp.ip || 'Unknown IP';
      
      // Use placeholder span for the second line detail
      row.innerHTML = `
        <div class="comp-header">
          <span>${comp.name}</span>
          <span class="${statusClass}">${statusText}</span>
        </div>
        <div class="comp-details">
          <span>${ip}</span>
          <span></span> 
        </div>
      `;
      menu.appendChild(row);
    });
  }
}

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

async function handleVideoReady(data: nf.telemetry.IVideoReady) {
  const feedNumber = data.feedNumber!; // Note that this is not anchor num in stringman pilot.
  const videoManager = [gripperVideo, firstOverheadVideo, secondOverheadVideo][feedNumber];
  
  if (isLanMode && data.localUri) {
    // Connect to the video streams at the local UDP address for this camera. example udp:127.0.0.1:1234
    videoManager.connectLocal(data.localUri);
  } else if (data.streamPath) {
    // Connect with WebRTC to the production server at data.streamPath
    let token: string | undefined;
    if (!isSimMode) {
      try {
        token = await AuthManager.getAuthToken();
      } catch (e) {
        console.warn("Could not get a token to authenticate video stream. Not logged in?", e);
      }
    }
    videoManager.connectWebRTC(data.streamPath, token);
  }

  // Assign the feed's anchor num and vitual camera for target overlay math
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
  updateOnlineStatus(data.online ?? false);
}

function handleGripSensors(data: nf.telemetry.IGripperSensors) {
  gripper.setSensorValues(data, laserReadings);
}

function updateOnlineStatus(online: boolean) {``
  const statusDot = document.getElementById('status-dot-el');
  const statusText = document.getElementById('status-text');
  const runBtn = document.getElementById('run-btn');

  if (statusDot && statusText && runBtn) {
    if (online) {
      statusDot.classList.remove('status-offline');
      
      let text = 'Online';
      if (isLanMode) text = 'Online (Local)';
      if (isSimMode) text = 'Online (Sim)';
      
      statusText.textContent = text;
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

    case perspGripper:
      gamepad.setSeatOrbitMode(false);

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
        [perspBottom]: 'btn-bottom',
        [perspGripper]: 'btn-gripper'
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
    document.getElementById('btn-gripper')?.addEventListener('click', () => setPerspective(perspGripper));
    
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
  // Determine robot ID context
  let rId = currentRobotId ?? "unknown";
  if (isLanMode) rId = "local";
  if (isSimMode) rId = "simulated";

  const batchData = nf.control.ControlBatchUpdate.create({
    robotId: rId,
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

    bindCommand('action-pick-drop',       Command.COMMAND_PICK_AND_DROP);
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
    bindCommand('action-update-firmware', Command.COMMAND_UPDATE_FIRMWARE);
    
    // Bind bind action
    const bindAction = document.getElementById('action-bind');
    if (bindAction) {
      bindAction.addEventListener('click', () => {
        handleBindAction();
        runMenu?.classList.remove('show');
      });
    }

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

// --- Header Menu ---
function initHeader() {
  document.getElementById('btn-header-back')?.addEventListener('click', () => {
    // Disconnect and stop reconnection loops
    disconnect();
    // Show landing layer
    document.getElementById('landing-layer')?.classList.remove('hidden');
    // Ensure we are on the main options screen, not the robot list or bind screen
    document.getElementById('landing-options')?.classList.remove('hidden');
    document.getElementById('robot-list-panel')?.classList.add('hidden');
    document.getElementById('bind-robot-panel')?.classList.add('hidden');
  });

  // robot list back button
  document.getElementById('btn-robot-list-back')?.addEventListener('click', () => {
    document.getElementById('robot-list-panel')?.classList.add('hidden');
    document.getElementById('landing-layer')?.classList.remove('hidden');
    document.getElementById('landing-options')?.classList.remove('hidden');
  });
}
initHeader();

// --- Component Status Menu ---
function initComponentMenu() {
  const compBtn = document.getElementById('component-status-btn');
  const compMenu = document.getElementById('component-menu');

  if (compBtn && compMenu) {
    compBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      compMenu.classList.toggle('show');
    });
  }

  // Close menu when clicking outside (shares logic with run menu if needed, or specific listener)
  document.addEventListener('click', () => {
    if (compMenu && compMenu.classList.contains('show')) {
      compMenu.classList.remove('show');
    }
  });
}

initComponentMenu();