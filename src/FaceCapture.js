/**
 * 人脸捕获模块 - 使用MediaPipe Face Mesh
 */
export class FaceCapture {
    constructor(videoElement, canvasElement) {
        this.videoElement = videoElement;
        this.canvasElement = canvasElement;
        this.canvasCtx = canvasElement.getContext('2d');
        this.faceMesh = null;
        this.camera = null;
        this.faceLandmarks = null;
        this.onFaceDetected = null;
        this.isCapturing = false;
    }

    async init() {
        try {
            // 初始化Face Mesh
            this.faceMesh = new FaceMesh({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1668520077/${file}`;
                }
            });

            this.faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            this.faceMesh.onResults(this.onResults.bind(this));

            // 初始化相机
            this.camera = new Camera(this.videoElement, {
                onFrame: async () => {
                    await this.faceMesh.send({ image: this.videoElement });
                },
                width: 640,
                height: 480
            });

            await this.camera.start();
            this.isCapturing = true;
            console.log('人脸捕获系统初始化成功');
            
            return true;
        } catch (error) {
            console.error('人脸捕获系统初始化失败:', error);
            return false;
        }
    }

    onResults(results) {
        this.canvasElement.width = this.videoElement.videoWidth;
        this.canvasElement.height = this.videoElement.videoHeight;
        
        this.canvasCtx.save();
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            this.faceLandmarks = results.multiFaceLandmarks[0];
            
            // 绘制关键点
            this.drawConnectors(this.faceLandmarks);
            
            // 触发回调
            if (this.onFaceDetected) {
                this.onFaceDetected(this.faceLandmarks);
            }
        }
        
        this.canvasCtx.restore();
    }

    drawConnectors(landmarks) {
        // 绘制面部轮廓
        this.canvasCtx.strokeStyle = '#00FF00';
        this.canvasCtx.lineWidth = 1;
        this.canvasCtx.lineCap = 'round';
        
        const connections = FACEMESH_TESSELATION;
        for (const [start, end] of connections) {
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];
            
            this.canvasCtx.beginPath();
            this.canvasCtx.moveTo(
                startPoint.x * this.canvasElement.width,
                startPoint.y * this.canvasElement.height
            );
            this.canvasCtx.lineTo(
                endPoint.x * this.canvasElement.width,
                endPoint.y * this.canvasElement.height
            );
            this.canvasCtx.stroke();
        }
        
        // 绘制关键点
        this.canvasCtx.fillStyle = '#FF0000';
        for (const landmark of landmarks) {
            this.canvasCtx.beginPath();
            this.canvasCtx.arc(
                landmark.x * this.canvasElement.width,
                landmark.y * this.canvasElement.height,
                1, 0, 2 * Math.PI
            );
            this.canvasCtx.fill();
        }
    }

    getFaceLandmarks() {
        return this.faceLandmarks;
    }

    stop() {
        if (this.camera) {
            this.camera.stop();
        }
        this.isCapturing = false;
    }
}