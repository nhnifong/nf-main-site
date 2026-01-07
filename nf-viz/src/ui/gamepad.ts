import * as THREE from 'three';
import { nf } from '../generated/proto_bundle.js';

export class GamepadController {
    private gamepadIndex: number | null = null;

    // Constants
    private readonly DEADZONE = 0.1; // 10% deadzone
    private readonly GAMEPAD_GRIP_DEG_PER_SEC = 90;
    private readonly GAMEPAD_WINCH_METER_PER_SEC = 0.2;

    // State Tracking
    public seatOrbitMode = true;
    private orbitObj: THREE.Object3D | null = null;
    private robotPosition: { x: number, y: number } | null = null;

    private fingerAngle = 0;
    private lastUpdateT = 0;
    private lastSendT = 0;

    private seenValidTriggers = false;
    
    // Previous Button States (Rising Edge Detection)
    private startWasHeld = false;
    private dpadUpWasHeld = false;
    private dpadLeftWasHeld = false;
    private dpadRightWasHeld = false;
    private selectWasHeld = false;

    // keyboard input state
    private keys = new Set<string>();
    private keyStates: { [code: string]: boolean } = {};

    // Change Detection (Store last "Action" vector: [vx, vy, vz, speed, winch, finger])
    private lastAction = new Float32Array(6); 

    constructor() {
        // Listen for connection events to know which index to poll
        window.addEventListener("gamepadconnected", (e) => {
            console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
                e.gamepad.index, e.gamepad.id,
                e.gamepad.buttons.length, e.gamepad.axes.length);
            
            // Just grab the first one that connects
            if (this.gamepadIndex === null) {
                this.gamepadIndex = e.gamepad.index;
                this.seenValidTriggers = false;

                // Show the explanatory message
                const container = document.getElementById('how-to');
                if (container) {
                    container.textContent = "To activate gamepad, press both analog triggers.";
                }
            }
        });

        window.addEventListener("gamepaddisconnected", (e) => {
            console.log("Gamepad disconnected from index %d", e.gamepad.index);
            if (this.gamepadIndex === e.gamepad.index) {
                this.gamepadIndex = null;
            }
        });

        window.addEventListener('keydown', (e) => this.handleKey(e, true));
        window.addEventListener('keyup', (e) => this.handleKey(e, false));
    }

    private handleKey(e: KeyboardEvent, isDown: boolean) {
        // Don't control robot if user is typing in a text field
        const active = document.activeElement;
        if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
            return;
        }

        if (isDown) {
            this.keys.add(e.code);
        } else {
            this.keys.delete(e.code);
            this.keyStates[e.code] = false; // Reset rising edge state on release
        }
    }

    /**
     * Returns null if no gamepad is active.
     * https://hardwaretester.com/gamepad is really helpful in debugging this
     */
    public getGamepadState() {
        if (this.gamepadIndex === null) return null;

        const gamepads = navigator.getGamepads();
        const gp = gamepads[this.gamepadIndex];

        if (!gp) return null;

        // Find the analog triggers
        let lt = 0.0;
        let rt = 0.0;
        if (gp.axes.length == 6) {
            // firefox
            lt = gp.axes[4]; 
            rt = gp.axes[4];
        } else {
            // chrome
            lt = gp.buttons[6].value;
            rt = gp.buttons[7].value;
        }

        return {
            leftStick: {
                x: this.applyDeadzone(gp.axes[0]), // positive is to the right
                y: this.applyDeadzone(-gp.axes[1]), // positive is up (after the negation)
            },
            rightStick: {
                x: this.applyDeadzone(gp.axes[2]),
                y: this.applyDeadzone(-gp.axes[3])
            },
            buttons: {
                // Standard mappings (0-3)
                a: gp.buttons[0].pressed,
                b: gp.buttons[1].pressed,
                y: gp.buttons[2].pressed, // not always labelled y, but usually at the top
                x: gp.buttons[3].pressed,
                // Bumpers (4-5)
                lb: gp.buttons[4].pressed,
                rb: gp.buttons[5].pressed,
                // Triggers - Value is 0.0 to 1.0
                lt: lt,
                rt: rt,
                // Extras
                select: gp.buttons[8]?.pressed || false, // somtimes also called back
                start: gp.buttons[9]?.pressed || false,
                // D-Pad (Standard Indices 12-15)
                dpadUp: gp.buttons[12]?.pressed || false,
                dpadDown: gp.buttons[13]?.pressed || false,
                dpadLeft: gp.buttons[14]?.pressed || false,
                dpadRight: gp.buttons[15]?.pressed || false
            }
        };
    }

    /**
     * Returns a format identical to getGamepadState but using keyboard input.
     */
    public getKeyboardState() {
        return {
            leftStick: {
                x: (this.keys.has('KeyA') ? -1 : 0) + (this.keys.has('KeyD') ? 1 : 0),
                y: (this.keys.has('KeyS') ? -1 : 0) + (this.keys.has('KeyW') ? 1 : 0)
            },
            rightStick: {
                x: 0,
                y: 0
            },
            buttons: {
                // Standard mappings (0-3)
                a: this.keys.has('Space'),
                b: this.keys.has('ShiftLeft'),
                y: this.keys.has('KeyZ'),
                x: this.keys.has('KeyX'),
                // Bumpers (4-5)
                lb: false,
                rb: false,
                // Triggers - Value is 0.0 to 1.0
                lt: this.keys.has('KeyQ') ? 1 : 0,
                rt: this.keys.has('KeyE') ? 1 : 0,
                // Extras
                select: this.keys.has('Backspace'),
                start: this.keys.has('Enter'),
                // D-Pad (Standard Indices 12-15)
                dpadUp: this.keys.has('Digit1'),
                dpadDown:  this.keys.has('Digit4'),
                dpadLeft: this.keys.has('Digit2'),
                dpadRight: this.keys.has('Digit3')
            }
        };
    }

    private applyDeadzone(value: number): number {
        if (Math.abs(value) < this.DEADZONE) {
            return 0;
        }
        // Optional: Re-map 0.1->1.0 to 0.0->1.0 so you don't "jump" when leaving deadzone
        // But for simple testing, just zeroing it is fine.
        return value;
    }

    // Set an object to use as the orbit center for control inputs
    public setOrbitCenter(orbitObj: THREE.Object3D) {
        this.orbitObj = orbitObj
    }

    public setRobotPosition(x: number, y: number) {
        this.robotPosition = { x, y };
    }

    /**
     * Main control loop logic. Call this every frame.
     * Returns an array of ControlItems to be sent over the network.
     */
    public checkInputsAndCreateControlItems(): Array<nf.control.ControlItem> {
        // first use keyboard input
        let input = this.getKeyboardState();
        const gpInput = this.getGamepadState();

        if (gpInput) {
            // gamepad unlock check  - trigger buttons may return invalid values until pressed.
            if (!this.seenValidTriggers){
                if ((gpInput.buttons.rt > 0 && gpInput.buttons.rt < 1) && (gpInput.buttons.lt > 0 && gpInput.buttons.lt < 1)) {
                    this.seenValidTriggers = true;
                    // Gamepad has been unlocked. Clear the explanatory message
                    const container = document.getElementById('how-to');
                    if (container) {
                        container.textContent = "";
                    }
                }
            } else {
                // have gp input and it's unlocked. merge it with keyboard input
                input = {
                    leftStick: {
                        x: input.leftStick.x + (gpInput?.leftStick.x ?? 0),
                        y: input.leftStick.y + (gpInput?.leftStick.y ?? 0)
                    },
                    rightStick: {
                        x: input.rightStick.x + (gpInput?.rightStick.x ?? 0),
                        y: input.rightStick.y + (gpInput?.rightStick.y ?? 0)
                    },
                    buttons: {
                        a: input.buttons.a || (gpInput?.buttons.a ?? false),
                        b: input.buttons.b || (gpInput?.buttons.b ?? false),
                        x: input.buttons.x || (gpInput?.buttons.x ?? false),
                        y: input.buttons.y || (gpInput?.buttons.y ?? false),
                        lb: input.buttons.lb || (gpInput?.buttons.lb ?? false),
                        rb: input.buttons.rb || (gpInput?.buttons.rb ?? false),
                        lt: Math.max(input.buttons.lt, gpInput?.buttons.lt ?? 0),
                        rt: Math.max(input.buttons.rt, gpInput?.buttons.rt ?? 0),
                        start: input.buttons.start || (gpInput?.buttons.start ?? false),
                        select: input.buttons.select || (gpInput?.buttons.select ?? false),
                        dpadUp: input.buttons.dpadUp || (gpInput?.buttons.dpadUp ?? false),
                        dpadDown: input.buttons.dpadDown || (gpInput?.buttons.dpadDown ?? false),
                        dpadLeft: input.buttons.dpadLeft || (gpInput?.buttons.dpadLeft ?? false),
                        dpadRight: input.buttons.dpadRight || (gpInput?.buttons.dpadRight ?? false),
                    }
                };
            }
        }
        
        const messages: nf.control.ControlItem[] = [];
        const now = Date.now() / 1000;
        const dt = now - this.lastUpdateT;

        // Calculate Vector (Left Stick + Triggers)
        const netTrigger = input.buttons.rt - input.buttons.lt;
        let vx = input.leftStick.x;
        let vy = input.leftStick.y;
        let vz = netTrigger;

        // in orbit mode, lateral movements orbit a given position and
        // forward/back movements move away/towards it.
        if (this.seatOrbitMode && this.orbitObj && this.robotPosition) {

            // get position of orbitObj in x,y plane in robot space
            const p = new THREE.Vector3();
            this.orbitObj.getWorldPosition(p);
            const orbitX = p.x
            const orbitY = -p.z;

            // Vector from orbit position to robot
            const dx = this.robotPosition.x - orbitX;
            const dy = this.robotPosition.y - orbitY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // We can only orbit if we aren't at the exact center.
            if (dist > 1e-6) {
                const rx = dx / dist; // Radial X
                const ry = dy / dist; // Radial Y

                // Tangential Unit Vector (Clockwise Perpendicular: [y, -x])
                const tx = ry; 
                const ty = -rx;

                // Transform Stick Inputs: 
                // Stick X -> Tangential (Orbit)
                // Stick Y -> Radial (In/Out)
                const orbitVx = (vx * tx) + (vy * rx);
                const orbitVy = (vx * ty) + (vy * ry);

                vx = orbitVx;
                vy = orbitVy;
            }
        }

        // Normalize and Calculate Speed
        // (x,y,z) is the direction vector, speed is scalar
        const mag = Math.sqrt(vx*vx + vy*vy + vz*vz);
        let speed = 0;
        
        if (mag > 0) {
            vx /= mag;
            vy /= mag;
            vz /= mag;
            // Scale speed (max 0.25 m/s)
            speed = 0.25 * mag;
        }

        // Finger Control (A/B)
        let gripChange = 0;
        if (input.buttons.a) {
            gripChange = this.GAMEPAD_GRIP_DEG_PER_SEC;
        } else if (input.buttons.b) {
            gripChange = -this.GAMEPAD_GRIP_DEG_PER_SEC;
        }
        
        this.fingerAngle += (gripChange * dt);
        // clamp to [-90, 90]
        this.fingerAngle = Math.max(-90, Math.min(90, this.fingerAngle));

        // Winch Control (X/Y)
        let lineSpeed = 0;
        if (input.buttons.y) {
            lineSpeed = -this.GAMEPAD_WINCH_METER_PER_SEC;
        } else if (input.buttons.x) {
            lineSpeed = this.GAMEPAD_WINCH_METER_PER_SEC;
        }

        // Rising Edge Detectors for Events

        // Start Button -> Episode Start/Stop
        if (input.buttons.start && !this.startWasHeld) {
            messages.push(nf.control.ControlItem.create({
                episodeControl: { events: ['episode_start_stop'] }
            }));
        }
        this.startWasHeld = input.buttons.start;

        // D-Pad Up -> Tighten Lines
        if (input.buttons.dpadUp && !this.dpadUpWasHeld) {
            console.log('Gamepad: Tension Lines');
            messages.push(nf.control.ControlItem.create({
                command: { name: nf.control.Command.COMMAND_TIGHTEN_LINES }
            }));
        }
        this.dpadUpWasHeld = input.buttons.dpadUp;

        // D-Pad Left -> Half Cal
        if (input.buttons.dpadLeft && !this.dpadLeftWasHeld) {
            messages.push(nf.control.ControlItem.create({
                command: { name: nf.control.Command.COMMAND_HALF_CAL }
            }));
        }
        this.dpadLeftWasHeld = input.buttons.dpadLeft;

        // D-Pad Right -> Grasp
        if (input.buttons.dpadRight && !this.dpadRightWasHeld) {
            messages.push(nf.control.ControlItem.create({
                command: { name: nf.control.Command.COMMAND_GRASP }
            }));
        }
        this.dpadRightWasHeld = input.buttons.dpadRight;

        // nothing is mapped to dpad down at the moment

        // Select/back - stop all
        if (input.buttons.select && !this.selectWasHeld) {
            messages.push(nf.control.ControlItem.create({
                command: { name: nf.control.Command.COMMAND_STOP_ALL }
            }));
        }
        this.selectWasHeld = input.buttons.select;


        // Movement Message (Throttled/Changed)
        
        // Construct current action array for comparison: [vx, vy, vz, speed, winch, finger]
        // Note: We only care about direction if magnitude > 0
        const currentAction = [vx, vy, vz, speed, lineSpeed, this.fingerAngle];
        
        const hasChanged = !this.arraysEqual(currentAction, this.lastAction);
        const isMoving = mag > 1e-3;
        const timeSinceSend = now - this.lastSendT;

        // Send a movement if: Data changed OR (we are moving AND it's been > 50ms)
        if (hasChanged || (timeSinceSend > 0.05 && isMoving)) {
            
            messages.push(nf.control.ControlItem.create({
                move: {
                    direction: { x: vx, y: vy, z: vz },
                    speed: speed,
                    finger: this.fingerAngle,
                    winch: lineSpeed
                }
            }));

            // Update state
            for(let i=0; i<6; i++) this.lastAction[i] = currentAction[i];
            this.lastSendT = now;
        }

        this.lastUpdateT = now;
        return messages;
    }

    private arraysEqual(a: number[], b: Float32Array): boolean {
        for (let i = 0; i < a.length; ++i) {
            // Use small epsilon for float comparison
            if (Math.abs(a[i] - b[i]) > 1e-6) return false;
        }
        return true;
    }

}