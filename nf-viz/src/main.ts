import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// Import the generated protobuf classes
import { nf } from './generated/proto_bundle.js';

// Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 100);
camera.position.set(2, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.5, 0);
controls.update();

// Lights
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(2, 5, 2);
scene.add(dirLight);

// Geometry ---

// Robot Cube
const cubeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.set(0, 0.05, 0);
scene.add(cube);

// Room (One-sided walls)
const roomGeometry = new THREE.BoxGeometry(5, 3, 5);
const roomMaterial = new THREE.MeshStandardMaterial({
  color: 0x888888,
  side: THREE.BackSide // Key for "looking in" effect
});
const room = new THREE.Mesh(roomGeometry, roomMaterial);
room.position.set(0, 1.5, 0);
scene.add(room);

const gridHelper = new THREE.GridHelper(5, 10);
scene.add(gridHelper);

// Telemetry Handler ---

const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${protocol}//${window.location.host}/telemetry/robot_0`;
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
        // Check for PositionEstimate
        // Note: Protobuf optional fields are nullable in the generated types
        if (update.posEstimate && update.posEstimate.gantryPosition) {
          const pos = update.posEstimate.gantryPosition; // a nf.common.Vec3
          
          // gently update position of companion cube
          cube.position.set(
            pos.x ?? 0, 
            pos.y ?? 0, 
            pos.z ?? 0
          );
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

// --- 4. Render Loop ---
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Resize Handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});