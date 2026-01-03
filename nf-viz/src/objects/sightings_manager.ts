import * as THREE from 'three';
import { nf } from '../generated/proto_bundle.js';

export class SightingsManager {
    private scene: THREE.Scene;
    private root: THREE.Group;
    
    // Store active dots
    private dots: { mesh: THREE.Mesh; birthTime: number }[] = [];
    
    // Configuration
    private readonly MAX_AGE = 5.0; // Seconds to live
    private readonly DOT_RADIUS = 0.01; // 1cm dots
    
    // Shared geometry for performance (reuse the same shape 1000 times)
    private sharedGeometry: THREE.SphereGeometry;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.root = new THREE.Group();
        this.scene.add(this.root);

        // Low poly sphere is fine for small dots
        this.sharedGeometry = new THREE.SphereGeometry(this.DOT_RADIUS, 8, 8);
    }

    public update() {
        const now = Date.now() / 1000; // Current time in seconds

        // Iterate backwards so we can safely remove items
        for (let i = this.dots.length - 1; i >= 0; i--) {
            const dot = this.dots[i];
            const age = now - dot.birthTime;

            if (age >= this.MAX_AGE) {
                // Kill it
                this.root.remove(dot.mesh);
                (dot.mesh.material as THREE.Material).dispose(); // Clean up GPU memory
                this.dots.splice(i, 1);
            } else {
                // Fade it
                // Opacity goes from 1.0 down to 0.0
                const opacity = 1.0 - (age / this.MAX_AGE);
                (dot.mesh.material as THREE.MeshBasicMaterial).opacity = opacity;
            }
        }
    }

    public handleSightings(data: nf.telemetry.IGantrySightings) {
        if (!data.sightings) return;

        const now = Date.now() / 1000;

        data.sightings.forEach(vec => {
            const x = vec.x ?? 0;
            const y = vec.y ?? 0;
            const z = vec.z ?? 0;

            // Create Material (Must be unique per dot to allow individual fading)
            const material = new THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: 1.0,
                depthWrite: false // prevents dots from hiding things behind them while transparent
            });

            const mesh = new THREE.Mesh(this.sharedGeometry, material);
            // Coordinate Conversion: Z-up (Robot) -> Y-up (Three)
            mesh.position.set(x, z, -y);

            this.root.add(mesh);
            this.dots.push({ mesh, birthTime: now });
        });
    }
}