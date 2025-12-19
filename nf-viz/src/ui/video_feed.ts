import * as THREE from 'three';
import { nf } from '../generated/proto_bundle.js';

export class VideoFeed {
    private container: HTMLElement;
    private video: HTMLVideoElement;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    
    // State
    private pose: nf.common.Pose | null = null;
    private cameraMatrix: THREE.Matrix4 = new THREE.Matrix4();
    private projectionMatrix: THREE.Matrix4 = new THREE.Matrix4();
    
    // Helper for 3D projection
    private virtualCamera: THREE.PerspectiveCamera;

    constructor(container: HTMLElement) {
        this.container = container;
        
        // Setup DOM Elements
        this.video = document.createElement('video');
        this.video.style.width = '100%';
        this.video.style.height = '100%';
        this.video.style.objectFit = 'cover';
        this.video.autoplay = true;
        this.video.muted = true; // Required for autoplay in many browsers
        this.video.playsInline = true;
        
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none'; // Let clicks pass through to video/controls

        this.container.appendChild(this.video);
        this.container.appendChild(this.canvas);

        const context = this.canvas.getContext('2d');
        if (!context) throw new Error("Could not get 2D context");
        this.ctx = context;

        // Setup Resize Observer to handle canvas resolution matching
        const observer = new ResizeObserver(() => this.resize());
        observer.observe(this.container);

        // Virtual Camera for Math (Not added to scene, just for calculation)
        // Defaulting to 60deg FOV, can be tuned later
        this.virtualCamera = new THREE.PerspectiveCamera(60, 16/9, 0.1, 100);
        this.virtualCamera.updateMatrixWorld(); // Ensure matrix is ready
    }

    private resize() {
        // Match canvas internal resolution to display size for crisp lines
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // Update aspect ratio for projection math
        this.virtualCamera.aspect = rect.width / rect.height;
        this.virtualCamera.updateProjectionMatrix();
    }

    public connect(url: string, posterUrl?: string) {
        if (posterUrl) {
            this.video.poster = posterUrl;
        }

        // Handle error/fallback
        this.video.onerror = () => {
            console.warn(`Failed to load video stream: ${url}`);
            // If we have a poster, it stays visible. 
            // We could also draw text on the canvas here.
            this.ctx.fillStyle = "rgba(0,0,0,0.5)";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = "white";
            this.ctx.font = "14px sans-serif";
            this.ctx.fillText("Signal Lost", 20, 30);
        };

        this.video.src = url;
    }

    public setPose(pose: nf.common.Pose) {
        this.pose = pose;

        // Convert Proto Pose to Three.js Camera Transform
        // Position
        this.virtualCamera.position.set(
            pose.position.x ?? 0,
            pose.position.y ?? 0,
            pose.position.z ?? 0
        );

        // Rotation (Rodrigues Vector)
        // Direction is axis, magnitude is angle in radians
        const rx = pose.rotation.x ?? 0;
        const ry = pose.rotation.y ?? 0;
        const rz = pose.rotation.z ?? 0;
        
        // Calculate magnitude (angle)
        const theta = Math.sqrt(rx * rx + ry * ry + rz * rz);

        if (theta < 1e-6) {
            // Identity rotation if vector is effectively zero
            this.virtualCamera.quaternion.set(0, 0, 0, 1);
        } else {
            // Normalize vector to get axis
            const axis = new THREE.Vector3(rx / theta, ry / theta, rz / theta);
            this.virtualCamera.quaternion.setFromAxisAngle(axis, theta);
        }

        this.virtualCamera.updateMatrixWorld();
    }

    public renderTargetsOverlay(targets: nf.telemetry.TargetList) {
        // Clear previous frame
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (!this.pose || !targets.targets) return;

        this.ctx.strokeStyle = '#00FF00'; // Hacker green
        this.ctx.lineWidth = 2;
        this.ctx.font = '12px monospace';
        this.ctx.fillStyle = '#00FF00';

        for (const target of targets.targets) {
            if (!target.position) continue;

            // Create Vector3 from target position
            const vec = new THREE.Vector3(
                target.position.x ?? 0,
                target.position.y ?? 0,
                target.position.z ?? 0
            );

            // Project 3D point to 2D Screen Space
            // .project() transforms the vector from world space to normalized device coordinate (NDC) space (-1 to +1)
            vec.project(this.virtualCamera);

            // Check if point is in front of camera and within view
            // z < 1 means it's within the frustum's far plane
            // x and y between -1 and 1 means it's on screen
            if (vec.z < 1 && vec.x >= -1 && vec.x <= 1 && vec.y >= -1 && vec.y <= 1) {
                
                // Map NDC to Pixel Coordinates
                const x = (vec.x * .5 + .5) * this.canvas.width;
                const y = (-(vec.y * .5) + .5) * this.canvas.height;

                // Draw Hollow Square (centered on point)
                const size = 20; 
                this.ctx.strokeRect(x - size/2, y - size/2, size, size);

                // Optional: Label
                if (target.id) {
                    this.ctx.fillText(target.id, x + size/2 + 5, y);
                }
            }
        }
    }
}