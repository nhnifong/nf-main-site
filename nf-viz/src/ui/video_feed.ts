import * as THREE from 'three';
import { nf } from '../generated/proto_bundle.js';
import { projectFloorToPixels, projectPixelsToFloor, TargetColors } from '../utils.ts';
import { TargetListManager } from './target_list_manager.ts' 

const TARGET_SIZE = 20; // visual size of target squares on a side

export class VideoFeed {
    private container: HTMLElement;
    private video: HTMLVideoElement;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    public anchorNum: number | null = null;
    
    // WebRTC
    private peerConnection: RTCPeerConnection | null = null;

    // State
    private lastTargets: nf.telemetry.IOneTarget[] = [];
    private targetImageCoords: (THREE.Vector2 | null)[] = [];
    private canvasSize: THREE.Vector2;
    private targetListManager: TargetListManager | null = null;
    private newItemImageCoords: THREE.Vector2 | null = null;

    // Callbacks
    public onFloorPoint: ((point: THREE.Vector3 | null) => void) | null = null;
    
    // Helper for 3D projection
    public virtualCamera: THREE.PerspectiveCamera | null = null;

    constructor(container: HTMLElement, tlm: TargetListManager | null = null) {
        this.container = container;
        this.targetListManager = tlm;
        
        // Find video and canvasl elements
        this.video = this.container.querySelector('video')!;
        this.canvas = this.container.querySelector('canvas')!;
        this.canvasSize = new THREE.Vector2(this.canvas.width, this.canvas.height);

        const context = this.canvas!.getContext('2d');
        if (!context) throw new Error("Could not get 2D context");
        this.ctx = context;

        // Setup Resize Observer to handle canvas resolution matching
        const observer = new ResizeObserver(() => this.resize());
        observer.observe(this.container);

        // Interaction Listeners
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    }

    // associate this feed with a particular anchor number
    public assign(anchorNum: number) {
        this.anchorNum = anchorNum;
    }

    private resize() {
        // Match canvas internal resolution to display size for crisp lines
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.canvasSize = new THREE.Vector2(this.canvas.width, this.canvas.height);
        this.draw();
    }

    private handleMouseMove(e: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const imagePos = new THREE.Vector2(x, y);
        const normPos = new THREE.Vector2(x / rect.width, y / rect.height);

        // Project to Floor
        if (this.virtualCamera) {
            const floorPoints = projectPixelsToFloor([normPos], this.virtualCamera);
            if (floorPoints.length == 1 && this.onFloorPoint) {
                this.onFloorPoint(floorPoints[0]);
            }
        }

        // Hit test targets
        this.hitTestTargets(imagePos);

        // Redraw (cursor, hover states)
        this.draw();
    }

    private handleMouseDown(e: MouseEvent) {
        if (!this.targetListManager) return;

        // hitTestTargets has already updated the hover state in the manager
        const hoveredId = this.targetListManager.getHoveredId();

        if (hoveredId) {
            this.targetListManager.setSelectedId(hoveredId);
        } else {
            // Clicked on background
            this.targetListManager.setSelectedId(null);

            // Add new item here?
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const imagePos = new THREE.Vector2(x, y);
            this.newItemImageCoords = imagePos;
        }
        this.draw();
    }

    private handleMouseLeave() {
        if (this.onFloorPoint) {
            this.onFloorPoint(null); 
        }
        // Clear hover state when leaving canvas
        if (this.targetListManager) {
            this.targetListManager.setHoveredId(null);
        }
        this.draw();
    }

    private hitTestTargets(mousePos: THREE.Vector2) {
        if (!this.targetImageCoords || this.lastTargets.length == 0 || !this.targetListManager) return;

        let foundId: string | null = null;
        const HALF_SIZE = TARGET_SIZE / 2;
        
        const foundIndex = this.targetImageCoords.findIndex(screenPos => {
            if (!screenPos) return false;
            // Axis-aligned bounding box check for exact square hit testing
            const dx = Math.abs(screenPos.x - mousePos.x);
            const dy = Math.abs(screenPos.y - mousePos.y);
            return dx <= HALF_SIZE && dy <= HALF_SIZE;
        });
        
        if (foundIndex !== -1) {
            foundId = this.lastTargets[foundIndex].id ?? null;
        }

        // Update the source of truth
        this.targetListManager.setHoveredId(foundId);
    }

    // --- WebRTC ---
    public async connect(streamPath: string) {
        // MediaMTX WHEP endpoint (standard WebRTC playback port is 8889)
        // production or staging
        let whepUrl = `https://media.neufangled.com:8889/${streamPath}/whep`;
        if (window.location.host === "localhost:5173") {
            // local testing with vite
            whepUrl = `http://localhost:8889/${streamPath}/whep`;
        }

        try {
            console.log('Connecting to: ' + streamPath);

            // Create the PeerConnection
            this.peerConnection = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });

            // Connect video element to incoming tracks
            this.peerConnection.ontrack = (event) => {
                if (event.track.kind === 'video') {
                    this.video.srcObject = event.streams[0];
                }
            };

            // Add a receive-only transceiver (we are watching, not broadcasting)
            this.peerConnection.addTransceiver('video', { direction: 'recvonly' });

            // Create local SDP Offer
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);

            // Send Offer to MediaMTX via WHEP (POST request)
            const response = await fetch(whepUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/sdp' },
                body: offer.sdp
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status} ${response.statusText}`);
            }

            // Set Remote Description from Server Answer
            const answerSdp = await response.text();
            await this.peerConnection.setRemoteDescription({
                type: 'answer',
                sdp: answerSdp
            });

            console.log('Connected! Stream should start shortly.');

        } catch (err) {
            console.error(err);
        }
    }

    // set the virtual camera used when projecting and raycasting targets.
    // This virtual camera is expected to already have a matrix that matches that of the anchor camera
    public setVirtualCamera(vCam: THREE.PerspectiveCamera) {
        this.virtualCamera = vCam;
    }

    // Called by main.ts on telemetry update to provide latest list of targets
    public updateList(targets: nf.telemetry.ITargetList) {
        if (targets.targets) {
            this.lastTargets = targets.targets;

            // Convert all the targets from world space into normalized image coordinates for this perspective
            // Normalized image coordinates are from 0 to 1 and the origin is the top left corner.
            const floorPoints: THREE.Vector3[] = this.lastTargets.map((tg) => {
                return new THREE.Vector3(tg.position!.x ?? 0, 0, -(tg.position!.y ?? 0));
            });
            if (this.virtualCamera) {
                this.targetImageCoords = projectFloorToPixels(floorPoints, this.virtualCamera, this.canvasSize);
            }
        }

        this.draw();
    }

    public refresh() {
        this.draw();
    }

    public setOffline() {
        console.log('resetting video element');
        if (this.peerConnection) {
            this.peerConnection.close();
        }
        this.video.srcObject = null;
        this.video.load();
    }

    // Main draw loop of the canvas that shows targets over the video
    private draw() {
        // Clear frame
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (!this.targetListManager || !this.video.srcObject) { return; }// skip for gripper

        const currentHoverId = this.targetListManager.getHoveredId();
        const currentSelectedId = this.targetListManager.getSelectedId();
        const half = TARGET_SIZE/2;

        // Draw Targets
        this.targetImageCoords.forEach((screenPos, i) => {
            if (screenPos) {
                const target = this.lastTargets[i]
                const isHovered = (target.id === currentHoverId);
                const isSelected = (target.id === currentSelectedId);

                // color the stroke according to it's status in the robot's queue
                let strokeColor = TargetColors.seen;
                if (target.status == nf.telemetry.TargetStatus.TARGETSTATUS_SELECTED) {
                    // selected here means selected by the observer for pickup
                    strokeColor = TargetColors.movingTo;
                } else if (target.status == nf.telemetry.TargetStatus.TARGETSTATUS_PICKED_UP) {
                    strokeColor = TargetColors.grasped;
                }

                let lineWidth = 2;

                // apply fill color according to mouse hover/select status
                if (isSelected) {
                    // This is a seperate meaning of the word selected indicating the user has clicked on the target in the UI.
                    // Fill translucent orange
                    this.ctx.fillStyle = 'rgba(255, 165, 0, 0.7)';
                    this.ctx.fillRect(screenPos.x - half, screenPos.y - half, TARGET_SIZE, TARGET_SIZE);
                } else if (isHovered) {
                    // Fill translucent cyan
                    this.ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
                    this.ctx.fillRect(screenPos.x - half, screenPos.y - half, TARGET_SIZE, TARGET_SIZE);
                }

                // Stroke
                this.ctx.strokeStyle = strokeColor;
                this.ctx.lineWidth = lineWidth;
                this.ctx.strokeRect(screenPos.x - half, screenPos.y - half, TARGET_SIZE, TARGET_SIZE);

                // Label
                if (target.id) {
                    const label = target.id.substring(0, 8);
                    this.ctx.fillStyle = strokeColor;
                    this.ctx.fillText(label, screenPos.x + half + 5, screenPos.y);
                }
            }
        });

        if (this.newItemImageCoords) {
            const x = this.newItemImageCoords.x;
            const y = this.newItemImageCoords.y;

            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = '#00FF00';
            this.ctx.strokeRect(x - half, y - half, TARGET_SIZE, TARGET_SIZE);

            const label1 = "Click again";
            const label2 = "to add new";
            this.ctx.fillStyle = '#00FF00';
            this.ctx.fillText(label1, x + half + 5, y);
            this.ctx.fillText(label2, x + half + 5, y + 10);
        }
    }
}