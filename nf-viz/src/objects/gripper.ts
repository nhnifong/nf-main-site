import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Gripper {
    private scene: THREE.Scene;
    private root: THREE.Group;
    private isLoaded: boolean = false;

    // References to moving parts
    private leftFinger: THREE.Object3D | null = null;
    private rightFinger: THREE.Object3D | null = null;
    private leftLinkage: THREE.Object3D | null = null;
    private rightLinkage: THREE.Object3D | null = null;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.root = new THREE.Group();
        this.scene.add(this.root);

        this.loadModel();
    }

    private async loadModel() {
        const loader = new GLTFLoader();
        
        try {
            // Path relative to the 'public' folder
            const gltf = await loader.loadAsync('/assets/gripper.glb');
            
            // Adjust scale if blender units were meters vs millimeters
            // gltf.scene.scale.set(1, 1, 1); 

            // Find specific moving parts by name defined in Blender
            this.leftFinger = gltf.scene.getObjectByName('FingerLeft') || null;
            this.rightFinger = gltf.scene.getObjectByName('FingerRight') || null;
            this.leftLinkage = gltf.scene.getObjectByName('LinkageLeft') || null;
            this.rightLinkage = gltf.scene.getObjectByName('LinkageRight') || null;

            if (!this.leftFinger) console.warn('Could not find FingerLeft in model');

            // Add the raw model to our wrapper group
            this.root.add(gltf.scene);
            this.isLoaded = true;
            console.log('Gripper loaded successfully');

        } catch (error) {
            console.error('Error loading gripper model:', error);
            // Fallback: Add a wireframe box so we see *something* if loading fails
            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.1, 0.1), 
                new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
            );
            this.root.add(mesh);
        }
    }

    /**
     * Updates the position of the entire gripper assembly
     */
    public setPosition(x: number, y: number, z: number) {
        // We can move the root group even if the model hasn't loaded yet
        this.root.position.set(x, y, z);
    }

    /**
     * Example: Animate the jaws based on a 0-1 open percentage
     */
    public setJawState(openPercent: number) {
        if (!this.isLoaded || !this.leftFinger || !this.rightFinger) return;

        // Example logic: Move fingers along local X axis
        // You'll need to tune these values based on your model's origin
        const maxOpen = 0.05; // 5cm
        const currentX = maxOpen * openPercent;

        this.leftFinger.position.x = -currentX;
        this.rightFinger.position.x = currentX;
    }
}