import { FaceCapture } from './FaceCapture.js';
import { FaceRenderer } from './FaceRenderer.js';
import { UIManager } from './UIManager.js';
import { DataSync } from './DataSync.js';

/**
 * FaceMold应用主入口
 */
class FaceMoldApp {
    constructor() {
        this.faceCapture = null;
        this.faceRenderer = null;
        this.uiManager = null;
        this.dataSync = null;
        
        this.init();
    }

    async init() {
        try {
            console.log('FaceMold 3D人脸可视化组件初始化中...');
            
            // 获取DOM元素
            const videoElement = document.getElementById('video');
            const videoCanvas = document.getElementById('video-canvas');
            const threeCanvas = document.getElementById('three-canvas');
            
            // 初始化3D渲染器
            this.faceRenderer = new FaceRenderer(threeCanvas);
            
            // 初始化数据同步
            this.dataSync = new DataSync(this.faceRenderer);
            
            // 初始化UI管理器
            this.uiManager = new UIManager(this.faceRenderer, null);
            this.uiManager.setDataSync(this.dataSync);
            
            // 尝试初始化人脸捕捉
            try {
                this.faceCapture = new FaceCapture(videoElement, videoCanvas);
                const captureInit = await this.faceCapture.init();
                
                if (captureInit) {
                    this.faceCapture.onFaceDetected = (landmarks) => {
                        this.faceRenderer.updateFromLandmarks(landmarks);
                    };
                    this.uiManager.faceCapture = this.faceCapture;
                    console.log('人脸捕捉系统已激活');
                }
            } catch (captureError) {
                console.warn('人脸捕捉系统初始化失败，将使用默认3D模型:', captureError.message);
            }
            
            // 从服务器加载参数
            const serverParams = await this.dataSync.loadFromServer();
            if (serverParams) {
                this.uiManager.updateUI(serverParams);
            }
            
            console.log('FaceMold 3D人脸可视化组件初始化完成！');
            console.log('使用说明:');
            console.log('- 鼠标拖拽: 旋转视角');
            console.log('- 滚轮: 缩放');
            console.log('- 滑块: 调整脸型和五官参数');
            console.log('- 肤色选择: 点击颜色块');
            console.log('- 按钮: 捕获、重置、保存');
            
        } catch (error) {
            console.error('FaceMold初始化失败:', error);
        }
    }
}

// 页面加载完成后初始化应用
window.addEventListener('DOMContentLoaded', () => {
    new FaceMoldApp();
});