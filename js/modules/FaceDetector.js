class FaceDetector {
    constructor(videoElement, canvasElement) {
        this.video = videoElement;
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.faceMesh = null;
        this.camera = null;
        this.onFaceDetected = null;
        this.isRunning = false;
    }

    async init() {
        try {
            this.faceMesh = new FaceMesh({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
                }
            });

            this.faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            this.faceMesh.onResults(this.onResults.bind(this));

            this.camera = new Camera(this.video, {
                onFrame: async () => {
                    await this.faceMesh.send({ image: this.video });
                },
                width: 640,
                height: 480
            });

            return true;
        } catch (error) {
            console.error('FaceDetector initialization failed:', error);
            return false;
        }
    }

    async start() {
        try {
            await this.camera.start();
            this.isRunning = true;
            return true;
        } catch (error) {
            console.error('Failed to start camera:', error);
            return false;
        }
    }

    stop() {
        if (this.camera) {
            this.camera.stop();
            this.isRunning = false;
        }
    }

    onResults(results) {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(results.image, 0, 0, this.canvas.width, this.canvas.height);

        if (results.multiFaceLandmarks) {
            for (const landmarks of results.multiFaceLandmarks) {
                this.drawLandmarks(landmarks);
                
                if (this.onFaceDetected) {
                    this.onFaceDetected(landmarks);
                }
            }
        }
        
        this.ctx.restore();
    }

    drawLandmarks(landmarks) {
        this.ctx.fillStyle = '#00FF00';
        this.ctx.strokeStyle = '#00FF00';
        this.ctx.lineWidth = 1;

        for (let i = 0; i < landmarks.length; i++) {
            const x = landmarks[i].x * this.canvas.width;
            const y = landmarks[i].y * this.canvas.height;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 1, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }

    getNormalizedLandmarks(landmarks) {
        const normalized = [];
        for (const landmark of landmarks) {
            normalized.push({
                x: landmark.x * 2 - 1,
                y: -landmark.y * 2 + 1,
                z: landmark.z
            });
        }
        return normalized;
    }
}
