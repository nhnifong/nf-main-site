import * as THREE from 'three';
import { nf } from '../generated/proto_bundle.js';
import { projectFloorToPixels, projectPixelsToFloor } from '../utils.ts';

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

    
    // Interaction State
    private mousePos: { x: number, y: number } | null = null;
    private hoveredTargetIndex: number | null = null;
    public selectedTargetId: string | null = null;

    // Callbacks
    public onFloorPoint: ((point: THREE.Vector3 | null) => void) | null = null;
    public onTargetSelect: ((targetId: string) => void) | null = null;
    
    // Helper for 3D projection
    private virtualCamera: THREE.PerspectiveCamera | null = null;

    constructor(container: HTMLElement) {
        this.container = container;
        
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

    private handleMouseDown() {
        if (this.hoveredTargetIndex != null) {
            // when a target is selected, remember it by it's stable id, not it's index in the queue.
            if (this.lastTargets.length > this.hoveredTargetIndex){
                const tg = this.lastTargets[this.hoveredTargetIndex];
                if (tg.id) {
                    this.selectedTargetId = tg.id;
                    if (this.onTargetSelect) {
                        this.onTargetSelect(this.selectedTargetId);
                    }
                }
            }
            this.draw();
        }
    }

    private handleMouseLeave() {
        this.hoveredTargetIndex = null;
        if (this.onFloorPoint) {
            this.onFloorPoint(null); // Signal that we are no longer pointing at the floor
        }
        this.draw();
    }

    private hitTestTargets(mousePos: THREE.Vector2) {
        if (!this.targetImageCoords || this.lastTargets.length==0) return;

        let foundIndex: number | null = null;
        // Simple distance check (could be bounding box if we saved the rects)
        // We'll recalculate projection here. For optimization, we could cache projected 2D coords in draw().
        
        // Threshold for "hover" in pixels
        const HIT_RADIUS = 15; 
        foundIndex = this.targetImageCoords.findIndex(screenPos => 
            screenPos && screenPos.distanceTo(mousePos) < HIT_RADIUS
        );
        
        this.hoveredTargetIndex = foundIndex;
    }

    // --- WebRTC ---
    public async connect(streamPath: string) {
        // MediaMTX WHEP endpoint (standard WebRTC playback port is 8889)
        const whepUrl = `http://localhost:8889/${streamPath}/whep`;

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
    public setVirtualCamera(vCam: THREE.PerspectiveCamera) {
        this.virtualCamera = vCam;
    }

    // Called by main.ts on telemetry update
    public renderTargetsOverlay(targets: nf.telemetry.ITargetList) {
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

    // Main Draw Loop
    private draw() {
        // Clear frame
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Targets
        this.targetImageCoords.forEach((screenPos, i) => {
            if (screenPos) {
                const target = this.lastTargets[i]
                const isHovered = (i === this.hoveredTargetIndex);
                const isSelected = ((target.id ?? '') === this.selectedTargetId);
                const size = 20; 

                // Default Style
                let strokeColor = '#00FF00';
                let lineWidth = 2;

                if (isSelected) {
                    strokeColor = '#FFA500'; // Orange
                    lineWidth = 3;
                    // Fill translucent
                    this.ctx.fillStyle = 'rgba(255, 165, 0, 0.3)';
                    this.ctx.fillRect(screenPos.x - size/2, screenPos.y - size/2, size, size);
                } else if (isHovered) {
                    strokeColor = '#00FFFF'; // Cyan
                    lineWidth = 3;
                }

                // Stroke
                this.ctx.strokeStyle = strokeColor;
                this.ctx.lineWidth = lineWidth;
                this.ctx.strokeRect(screenPos.x - size/2, screenPos.y - size/2, size, size);

                // Label
                if (target.id) {
                    const label = target.id.substring(0, 8);
                    this.ctx.fillStyle = strokeColor;
                    this.ctx.fillText(label, screenPos.x + size/2 + 5, screenPos.y);
                }
            }
        });
    }
}