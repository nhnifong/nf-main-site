import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// Import the generated protobuf classes
import { nf } from './generated/proto_bundle.js';
// import { Gripper } from './objects/gripper.ts';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/*

Wishlist for web based UI

Similar functionality to Ursina UI, but better aesthetics
Overall look:
    light beige walls, well lit.
    Warm colored rug on the floor with company logo
    simple window on one wall with white emissive material in place of glass
    small shelf on opposite wall with plant

*/

// Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.01, 100);
camera.position.set(2, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
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

// Robot Cube
const cubeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.set(0, 1.05, 0);
scene.add(cube);

// Room (One-sided walls)
const roomGeometry = new THREE.BoxGeometry(5, 3, 5);
const roomMaterial = new THREE.MeshStandardMaterial({
  color: 0xEEEEEE0,
  side: THREE.BackSide // Key for "looking in" effect
});
const room = new THREE.Mesh(roomGeometry, roomMaterial);
room.position.set(0, 1.5, 0);
scene.add(room);

const gridHelper = new THREE.GridHelper(5, 10);
scene.add(gridHelper);

// Assets

// const gripper = new Gripper(scene);
// gripper.setPosition(2,0,2);

const loader = new GLTFLoader();

const flowerpot = await loader.loadAsync('/assets/models/flowerpot.glb');
flowerpot.scene.scale.set(0.1, 0.1, 0.1);
scene.add(flowerpot.scene);
flowerpot.scene.position.set(2,0,2);

const rug = await loader.loadAsync('/assets/models/rug.glb');
rug.scene.scale.set(0.2, 0.2, 0.2);
scene.add(rug.scene);

// Telemetry Handler

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