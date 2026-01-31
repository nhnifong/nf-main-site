import * as THREE from 'three';
import { nf } from '../generated/proto_bundle.js';
import { projectFloorToPixels, projectPixelsToFloor, TargetColors } from '../utils.ts';
import { TargetListManager } from './target_list_manager.ts' 

const TARGET_SIZE = 20; // visual size of target squares on a side
const HALF_SIZE = TARGET_SIZE / 2;

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
    private gripperPredictions: nf.telemetry.IGripCamPredictions | null = null;
    
    // New Item State
    private newItemImageCoords: THREE.Vector2 | null = null;
    private newItemIsHovered: boolean = false;

    // Dragging State
    private isDragging: boolean = false;
    private draggedTargetId: string | null = null;
    private draggedCurrentPos: THREE.Vector2 | null = null; // Screen coords
    private dragStartScreenPos: THREE.Vector2 | null = null;
    private readonly DRAG_THRESHOLD = 5; // pixels

    // Callbacks
    public onFloorPoint: ((point: THREE.Vector3 | null) => void) | null = null;
    public sendFn: ((items: Array<nf.control.ControlItem>) => void) | null = null;
    
    // Helper for 3D projection
    public virtualCamera: THREE.PerspectiveCamera | null = null;

    constructor(container: HTMLElement, tlm: TargetListManager | null = null) {
        this.container = container;
        this.targetListManager = tlm; // set to null for gripper video
        
        // Find video and canvas elements
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
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
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

        // Check for Drag Initiation (Threshold check)
        if (this.dragStartScreenPos && !this.isDragging) {
            const dist = imagePos.distanceTo(this.dragStartScreenPos);
            if (dist > this.DRAG_THRESHOLD) {
                this.isDragging = true;
                // dragging has officially started, update current pos immediately
                this.draggedCurrentPos = imagePos;
            }
        }

        // if already dragging
        if (this.isDragging && this.draggedTargetId) {
            this.draggedCurrentPos = imagePos;
            this.draw(); // Update visuals immediately
            return; // Skip hover effects and floor projection while dragging
        }

        // Project to Floor
        if (this.virtualCamera) {
            const floorPoints = projectPixelsToFloor([normPos], this.virtualCamera);
            if (floorPoints.length == 1 && this.onFloorPoint) {
                this.onFloorPoint(floorPoints[0]);
            }
        }

        // Hit test targets
        this.hitTestTargets(imagePos);
        // Hit test new item
        this.hitTestNewItem(imagePos);
        // Redraw (cursor, hover states)
        this.draw();
    }

    private handleMouseDown(e: MouseEvent) {
        if (!this.targetListManager) return;

        if (this.newItemIsHovered && this.newItemImageCoords) {
            // user has clicked again on a newly placed item, confirming that we should create it.
            const rect = this.canvas.getBoundingClientRect();
            const normPos = new THREE.Vector2(this.newItemImageCoords.x / rect.width, this.newItemImageCoords.y / rect.height);
            // Send message to robot
            if (this.sendFn) {
                const item = nf.control.ControlItem.create({
                    addCamTarget: {
                        anchorNum: this.anchorNum,
                        imgNormX: normPos.x,
                        imgNormY: normPos.y,
                    }
                })
                this.sendFn([item]);
            }
            // clear these
            this.newItemIsHovered = false;
            this.newItemImageCoords = null;
        } else {
            // hitTestTargets has already updated the hover state in the manager during mousemove
            const hoveredId = this.targetListManager.getHoveredId();

            if (hoveredId) {
                this.targetListManager.setSelectedId(hoveredId);
                
                // Prepare for potential drag
                this.draggedTargetId = hoveredId;
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                this.dragStartScreenPos = new THREE.Vector2(x, y);
                this.isDragging = false; // Wait for move threshold
            } else {
                // Clicked on background
                this.targetListManager.setSelectedId(null);

                // Add new item here?
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const imagePos = new THREE.Vector2(x, y);
                this.newItemImageCoords = imagePos;
                this.newItemIsHovered = true;
            }
        }
        this.draw();
    }

    private handleMouseUp() {
        if (this.isDragging && this.draggedTargetId && this.draggedCurrentPos) {
            
            const rect = this.canvas.getBoundingClientRect();
            // Clamp within canvas to avoid negative coords or > 1
            const clampedX = Math.max(0, Math.min(this.draggedCurrentPos.x, rect.width));
            const clampedY = Math.max(0, Math.min(this.draggedCurrentPos.y, rect.height));

            const normPos = new THREE.Vector2(clampedX / rect.width, clampedY / rect.height);

            if (this.sendFn) {
                // this.onTargetMoved(this.draggedTargetId, normPos);
                const item = nf.control.ControlItem.create({
                    addCamTarget: {
                        anchorNum: this.anchorNum,
                        imgNormX: normPos.x,
                        imgNormY: normPos.y,
                        targetId: this.draggedTargetId, // when set, this is a move command
                    }
                })
                this.sendFn([item]);
            }
        }

        // Reset drag state
        this.isDragging = false;
        this.draggedTargetId = null;
        this.draggedCurrentPos = null;
        this.dragStartScreenPos = null;
        this.draw();
    }

    private handleMouseLeave() {
        if (this.onFloorPoint) {
            this.onFloorPoint(null); 
        }
        
        // Reset drag if mouse leaves canvas
        if (this.isDragging || this.dragStartScreenPos) {
            this.isDragging = false;
            this.draggedTargetId = null;
            this.draggedCurrentPos = null;
            this.dragStartScreenPos = null;
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
        
        const foundIndex = this.targetImageCoords.findIndex((screenPos, i) => {
            if (!screenPos) return false;
            
            // Skip hit testing for the item currently being dragged (it's under the cursor anyway)
            if (this.isDragging && this.lastTargets[i].id === this.draggedTargetId) return true;

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

    private hitTestNewItem(mousePos: THREE.Vector2) {
        if (!this.newItemImageCoords) return;

        const dx = Math.abs(this.newItemImageCoords.x - mousePos.x);
        const dy = Math.abs(this.newItemImageCoords.y - mousePos.y);
        this.newItemIsHovered = dx <= HALF_SIZE && dy <= HALF_SIZE;
    }

    // --- WebRTC ---
    public async connect(streamPath: string) {
        // MediaMTX WHEP endpoint
        let whepUrl = `https://media.neufangled.com:8889/${streamPath}/whep`;
        if (window.location.host.includes("localhost")) {
            whepUrl = `http://localhost:8889/${streamPath}/whep`;
        }

        try {
            console.log('Connecting to: ' + streamPath);

            this.peerConnection = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });

            this.peerConnection.ontrack = (event) => {
                if (event.track.kind === 'video') {
                    this.video.srcObject = event.streams[0];
                }
            };

            this.peerConnection.addTransceiver('video', { direction: 'recvonly' });

            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);

            const response = await fetch(whepUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/sdp' },
                body: offer.sdp
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status} ${response.statusText}`);
            }

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

    public setVirtualCamera(vCam: THREE.PerspectiveCamera) {
        this.virtualCamera = vCam;
    }

    // Called by main.ts on telemetry update to provide latest list of targets
    public updateList(targets: nf.telemetry.ITargetList) {
        if (targets.targets) {
            this.lastTargets = targets.targets;

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

    public setGripperPredictions(data: nf.telemetry.IGripCamPredictions) {
      // Feedback on the inference that was done on the gripper camera.
      // should be shown with appropriate overlays on the camera feed
      this.gripperPredictions = data;
      this.draw();
    }

    // Main draw loop of the canvas that shows targets over the video
    private draw() {
        // Clear frame
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (!this.video.srcObject) { return; }

        if (this.targetListManager) { 
            // drawing for anchor cams.

            const currentHoverId = this.targetListManager.getHoveredId();
            const currentSelectedId = this.targetListManager.getSelectedId();

            // Draw Targets
            this.targetImageCoords.forEach((screenPos, i) => {
                const target = this.lastTargets[i];
                const isDraggingThis = (this.isDragging && target.id === this.draggedTargetId);
                
                // If dragging this specific target, override position with draggedCurrentPos
                let renderPos = screenPos;
                if (isDraggingThis && this.draggedCurrentPos) {
                    renderPos = this.draggedCurrentPos;
                }

                if (renderPos) {
                    const isHovered = (target.id === currentHoverId);
                    const isSelected = (target.id === currentSelectedId);

                    // color the stroke according to it's status in the robot's queue
                    let strokeColor = TargetColors.seen;
                    if (target.status == nf.telemetry.TargetStatus.TARGETSTATUS_SELECTED) {
                        strokeColor = TargetColors.movingTo;
                    } else if (target.status == nf.telemetry.TargetStatus.TARGETSTATUS_PICKED_UP) {
                        strokeColor = TargetColors.grasped;
                    }

                    let lineWidth = 2;

                    // apply fill color according to mouse hover/select status
                    if (isSelected || isDraggingThis) {
                        this.ctx.fillStyle = 'rgba(255, 165, 0, 0.7)';
                        this.ctx.fillRect(renderPos.x - HALF_SIZE, renderPos.y - HALF_SIZE, TARGET_SIZE, TARGET_SIZE);
                    } else if (isHovered) {
                        this.ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
                        this.ctx.fillRect(renderPos.x - HALF_SIZE, renderPos.y - HALF_SIZE, TARGET_SIZE, TARGET_SIZE);
                    }

                    // Stroke
                    this.ctx.strokeStyle = strokeColor;
                    this.ctx.lineWidth = lineWidth;
                    this.ctx.strokeRect(renderPos.x - HALF_SIZE, renderPos.y - HALF_SIZE, TARGET_SIZE, TARGET_SIZE);

                    // Label
                    if (target.id) {
                        const label = target.id.substring(0, 8);
                        this.ctx.fillStyle = strokeColor;
                        this.ctx.fillText(label, renderPos.x + HALF_SIZE + 5, renderPos.y);
                    }
                }
            });

            if (this.newItemImageCoords) {
                const x = this.newItemImageCoords.x;
                const y = this.newItemImageCoords.y;
                
                if (this.newItemIsHovered) {
                    this.ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
                    this.ctx.fillRect(this.newItemImageCoords.x - HALF_SIZE, this.newItemImageCoords.y - HALF_SIZE, TARGET_SIZE, TARGET_SIZE);
                }

                this.ctx.lineWidth = 2;
                this.ctx.strokeStyle = '#00FF00';
                this.ctx.strokeRect(x - HALF_SIZE, y - HALF_SIZE, TARGET_SIZE, TARGET_SIZE);

                const label1 = "Click again";
                const label2 = "to add new";
                this.ctx.fillStyle = '#00FF00';
                this.ctx.fillText(label1, x + HALF_SIZE + 5, y);
                this.ctx.fillText(label2, x + HALF_SIZE + 5, y + 10);
            }
        } else if (this.gripperPredictions) {
            // gripper overlays

            const pred = this.gripperPredictions;
            const w = this.canvas.width;
            const h = this.canvas.height;
            const cx = w / 2;
            const cy = h / 2;

            // 1. Calculate Predicted Target Position
            // Assuming moveX/moveY are normalized displacements
            const moveX = pred.moveX ?? 0;
            const moveY = pred.moveY ?? 0;
            const targetX = cx + (moveX * w);
            const targetY = cy + (moveY * h);

            // 2. Motion Vector (Green Arrow)
            this.ctx.beginPath();
            this.ctx.moveTo(cx, cy);
            this.ctx.lineTo(targetX, targetY);
            this.ctx.strokeStyle = '#00FF00';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            // Arrowhead
            const arrowAngle = Math.atan2(targetY - cy, targetX - cx);
            const headLen = 15;
            this.ctx.beginPath();
            this.ctx.moveTo(targetX, targetY);
            this.ctx.lineTo(
                targetX - headLen * Math.cos(arrowAngle - Math.PI / 6),
                targetY - headLen * Math.sin(arrowAngle - Math.PI / 6)
            );
            this.ctx.lineTo(
                targetX - headLen * Math.cos(arrowAngle + Math.PI / 6),
                targetY - headLen * Math.sin(arrowAngle + Math.PI / 6)
            );
            this.ctx.lineTo(targetX, targetY);
            this.ctx.fillStyle = '#00FF00';
            this.ctx.fill();

            // 3. Ideal Grip Angle (Capital "I" shape)
            const gripAngle = pred.gripAngle ?? 0;
            const gripLen = 50; 
            const capWidth = 12;

            this.ctx.save();
            this.ctx.translate(targetX, targetY);
            // Rotate so that 0 radians is Vertical (Up). 
            // In Canvas, 0 is Right (X-axis). -PI/2 brings it to Up (-Y axis).
            this.ctx.rotate(gripAngle - Math.PI / 2);

            this.ctx.strokeStyle = '#00FFFF'; // Cyan
            this.ctx.lineWidth = 4;

            // Main Bar
            this.ctx.beginPath();
            this.ctx.moveTo(0, -gripLen/2);
            this.ctx.lineTo(0, gripLen/2);
            this.ctx.stroke();

            // Caps
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            // Top Cap
            this.ctx.moveTo(-capWidth, -gripLen/2);
            this.ctx.lineTo(capWidth, -gripLen/2);
            // Bottom Cap
            this.ctx.moveTo(-capWidth, gripLen/2);
            this.ctx.lineTo(capWidth, gripLen/2);
            this.ctx.stroke();
            this.ctx.restore();

            // 4. Probability Bars (Right Side)
            const barW = 12;
            const barH = 120;
            const margin = 25;
            const barX = w - margin - barW;
            const gap = 30;

            // -- Prob Target In View (Yellow) --
            // Top half of right side
            const pView = Math.max(0, Math.min(1, pred.probTargetInView ?? 0));
            const viewY = cy - barH - (gap / 2);

            this.ctx.strokeStyle = '#FFF';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(barX, viewY, barW, barH); // Outline

            // Fill (Bottom up)
            this.ctx.fillStyle = '#FFFF00';
            const viewFillH = barH * pView;
            this.ctx.fillRect(barX, viewY + (barH - viewFillH), barW, viewFillH);
            
            // Label
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = '12px monospace';
            this.ctx.textAlign = 'right';
            this.ctx.fillText("TARGET", barX - 5, viewY + barH/2);


            // -- Prob Holding (Black with White outline) --
            // Bottom half of right side
            const pHold = Math.max(0, Math.min(1, pred.probHolding ?? 0));
            const holdY = cy + (gap / 2);

            this.ctx.strokeStyle = '#FFF';
            this.ctx.strokeRect(barX, holdY, barW, barH); // Outline

            // Fill (Bottom up)
            this.ctx.fillStyle = '#000000';
            const holdFillH = barH * pHold;
            this.ctx.fillRect(barX, holdY + (barH - holdFillH), barW, holdFillH);

            // Label
            this.ctx.fillStyle = '#FFF';
            this.ctx.fillText("GRASP", barX - 5, holdY + barH/2);
        }
    }
}