import * as THREE from 'three';

/**
 * Renders a video stream (feed 3 — orthographic color projection) as a texture
 * on a flat quad lying on the floor, centered at the origin.
 *
 * Coordinate mapping:
 *   image +X  →  Three.js +X
 *   image +Y (up / toward image top)  →  Three.js +Z
 *
 * Achieved by rotating a PlaneGeometry (XY plane, flipY=true texture) by
 * +90° around the X axis, which maps local +Y → world +Z.
 */
export class FloorProjection {
    private video: HTMLVideoElement;
    private img: HTMLImageElement;
    private material: THREE.MeshBasicMaterial;
    private mesh: THREE.Mesh;
    private peerConnection: RTCPeerConnection | null = null;
    private isLocalMode = false;

    constructor(scene: THREE.Scene, sizeMeters: number = 5, yOffset: number = 0.001) {
        this.video = document.createElement('video');
        this.video.autoplay = true;
        this.video.muted = true;
        this.video.playsInline = true;
        this.video.style.display = 'none';
        document.body.appendChild(this.video);

        this.img = document.createElement('img');
        this.img.crossOrigin = 'anonymous';
        this.img.style.display = 'none';
        document.body.appendChild(this.img);

        const videoTexture = new THREE.VideoTexture(this.video);
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;

        this.material = new THREE.MeshBasicMaterial({
            map: videoTexture,
            side: THREE.DoubleSide,
        });

        const geometry = new THREE.PlaneGeometry(sizeMeters, sizeMeters);
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.y = yOffset;
        this.mesh.visible = false;
        scene.add(this.mesh);
    }

    public connectLocal(uri: string) {
        this.peerConnection?.close();
        this.peerConnection = null;
        this.video.srcObject = null;

        const imgTexture = new THREE.Texture(this.img);
        imgTexture.minFilter = THREE.LinearFilter;
        imgTexture.magFilter = THREE.LinearFilter;
        imgTexture.generateMipmaps = false;
        this.material.map = imgTexture;
        this.material.needsUpdate = true;

        const separator = uri.includes('?') ? '&' : '?';
        this.img.src = `${uri}${separator}t=${Date.now()}`;
        this.img.onload = () => {
            this.mesh.visible = true;
        };
        this.isLocalMode = true;
    }

    public async connectWebRTC(streamPath: string, ticket?: string) {
        this.isLocalMode = false;
        this.img.src = '';

        let whepUrl = `https://media.neufangled.com:8889/${streamPath}/whep`;
        if (window.location.host.includes('localhost')) {
            whepUrl = `http://localhost:8889/${streamPath}/whep`;
        }
        const sep = (u: string) => u.includes('?') ? '&' : '?';
        if (ticket) whepUrl += `${sep(whepUrl)}ticket=${encodeURIComponent(ticket)}`;
        if (window.location.host.includes('nf-site-monolith-staging')) {
            whepUrl += `${sep(whepUrl)}staging=1`;
        }

        const videoTexture = new THREE.VideoTexture(this.video);
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;
        this.material.map = videoTexture;
        this.material.needsUpdate = true;

        try {
            if (this.peerConnection) this.peerConnection.close();
            this.peerConnection = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
            });
            this.peerConnection.ontrack = (event) => {
                if (event.track.kind === 'video') {
                    this.video.srcObject = event.streams[0];
                    this.mesh.visible = true;
                }
            };
            this.peerConnection.addTransceiver('video', { direction: 'recvonly' });

            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);

            const response = await fetch(whepUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/sdp' },
                body: offer.sdp,
            });
            if (!response.ok) throw new Error(`WHEP ${response.status}`);
            await this.peerConnection.setRemoteDescription({
                type: 'answer',
                sdp: await response.text(),
            });
        } catch (err) {
            console.error('FloorProjection WebRTC error:', err);
        }
    }

    // Call once per animation frame — needed to push MJPEG img frames to the GPU.
    public update() {
        if (this.isLocalMode && this.mesh.visible) {
            (this.material.map as THREE.Texture).needsUpdate = true;
        }
    }

    public setOffline() {
        this.peerConnection?.close();
        this.peerConnection = null;
        this.video.srcObject = null;
        this.img.src = '';
        this.isLocalMode = false;
        this.mesh.visible = false;
    }
}
