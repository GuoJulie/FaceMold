class FaceMoldApp {
    constructor() {
        this.faceDetector = null;
        this.faceRenderer = null;
        this.interactionControls = null;
        this.parameterManager = null;
        this.dataStorage = null;
        this.currentLandmarks = null;
        this.userId = 'guest_' + Math.random().toString(36).substr(2, 9);
        
        this.init();
    }

    async init() {
        console.log('Initializing FaceMold App...');
        
        this.initModules();
        this.bindEvents();
        
        console.log('FaceMold App initialized successfully!');
    }

    initModules() {
        const video = document.getElementById('video');
        const detectionCanvas = document.getElementById('detectionCanvas');
        const rendererContainer = document.getElementById('rendererContainer');
        
        this.faceDetector = new FaceDetector(video, detectionCanvas);
        
        this.faceRenderer = new FaceRenderer(rendererContainer);
        this.faceRenderer.init();
        
        this.interactionControls = new InteractionControls(
            this.faceRenderer.renderer,
            this.faceRenderer.camera
        );
        this.interactionControls.init();
        
        this.parameterManager = new ParameterManager();
        this.parameterManager.init();
        this.parameterManager.onParameterChange = this.onParameterChange.bind(this);
        
        this.dataStorage = new DataStorage();
    }

    bindEvents() {
        const startCameraBtn = document.getElementById('startCameraBtn');
        const captureBtn = document.getElementById('captureBtn');
        const saveBtn = document.getElementById('saveBtn');
        const loadBtn = document.getElementById('loadBtn');
        
        startCameraBtn.addEventListener('click', this.startCamera.bind(this));
        captureBtn.addEventListener('click', this.captureFace.bind(this));
        saveBtn.addEventListener('click', this.saveParameters.bind(this));
        loadBtn.addEventListener('click', this.loadParameters.bind(this));
        
        this.faceDetector.onFaceDetected = this.onFaceDetected.bind(this);
    }

    async startCamera() {
        const startCameraBtn = document.getElementById('startCameraBtn');
        const captureBtn = document.getElementById('captureBtn');
        
        startCameraBtn.textContent = '启动中...';
        startCameraBtn.disabled = true;
        
        const initialized = await this.faceDetector.init();
        if (initialized) {
            const started = await this.faceDetector.start();
            if (started) {
                startCameraBtn.textContent = '摄像头已开启';
                captureBtn.disabled = false;
            } else {
                startCameraBtn.textContent = '开启摄像头';
                startCameraBtn.disabled = false;
                alert('无法启动摄像头，请检查权限设置');
            }
        } else {
            startCameraBtn.textContent = '开启摄像头';
            startCameraBtn.disabled = false;
            alert('初始化人脸检测失败');
        }
    }

    onFaceDetected(landmarks) {
        this.currentLandmarks = landmarks;
        this.faceRenderer.setLandmarks(landmarks);
    }

    captureFace() {
        if (this.currentLandmarks) {
            this.faceRenderer.setLandmarks(this.currentLandmarks);
            alert('人脸已捕捉！可以开始调整参数了');
        } else {
            alert('未检测到人脸，请确保摄像头已开启且您的脸部在画面中');
        }
    }

    onParameterChange(parameters) {
        this.faceRenderer.setParameters(parameters);
    }

    async saveParameters() {
        const parameters = this.parameterManager.getParameters();
        
        const result = await this.dataStorage.saveParameters(parameters, this.userId);
        
        if (result.local) {
            alert('参数已保存到本地！');
        } else {
            alert('本地保存失败');
        }
        
        if (result.server.success) {
            console.log('参数已保存到服务器');
        } else {
            console.log('服务器保存失败（这是正常的，如果没有后端服务器）');
        }
    }

    async loadParameters() {
        const parameters = await this.dataStorage.loadParameters(this.userId);
        
        if (parameters) {
            this.parameterManager.setParameters(parameters);
            alert('参数已加载！');
        } else {
            alert('没有找到已保存的参数');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FaceMoldApp();
});
