import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * 3D人脸渲染器
 */
export class FaceRenderer {
    constructor(canvasElement) {
        this.canvasElement = canvasElement;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.faceMesh = null;
        this.faceMaterial = null;
        this.originalVertices = null;
        this.isInitialized = false;
        
        // 面部参数
        this.parameters = {
            faceWidth: 50,
            faceLength: 50,
            chinShape: 50,
            eyeSize: 50,
            eyeSpacing: 50,
            noseSize: 50,
            noseHeight: 50,
            mouthSize: 50,
            lipThickness: 50,
            skinColor: '#FFE0BD'
        };
        
        this.init();
    }

    init() {
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f0f23);
        
        // 创建相机
        const aspect = this.canvasElement.clientWidth / this.canvasElement.clientHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.z = 5;
        
        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvasElement,
            antialias: true 
        });
        this.renderer.setSize(this.canvasElement.clientWidth, this.canvasElement.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // 创建控制器
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        // 添加灯光
        this.addLights();
        
        // 创建基础人脸模型
        this.createFaceMesh();
        
        this.isInitialized = true;
        
        // 开始渲染循环
        this.animate();
        
        // 窗口大小调整
        window.addEventListener('resize', this.onResize.bind(this));
        
        console.log('3D渲染器初始化成功');
    }

    addLights() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // 主方向光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);
        
        // 辅光源
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
        fillLight.position.set(-5, 0, 5);
        this.scene.add(fillLight);
        
        // 点光源
        const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
        pointLight.position.set(0, 5, 5);
        this.scene.add(pointLight);
    }

    createFaceMesh() {
        // 创建人脸几何体 - 使用球体作为基础模型
        const geometry = new THREE.SphereGeometry(2, 64, 64);
        
        // 创建材质
        this.faceMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(this.parameters.skinColor),
            roughness: 0.5,
            metalness: 0.1,
            side: THREE.FrontSide
        });
        
        // 创建网格
        this.faceMesh = new THREE.Mesh(geometry, this.faceMaterial);
        this.scene.add(this.faceMesh);
        
        // 保存原始顶点数据
        this.originalVertices = geometry.attributes.position.array.slice();
        
        // 创建基础面部特征
        this.createFacialFeatures();
    }

    createFacialFeatures() {
        // 创建眼睛
        this.createEyes();
        
        // 创建鼻子
        this.createNose();
        
        // 创建嘴巴
        this.createMouth();
    }

    createEyes() {
        const eyeGeometry = new THREE.SphereGeometry(0.15, 32, 32);
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        
        // 左眼
        this.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        this.leftEye.position.set(-0.4, 0.3, 1.5);
        this.scene.add(this.leftEye);
        
        const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.08, 32, 32), pupilMaterial);
        leftPupil.position.set(-0.4, 0.3, 1.6);
        this.scene.add(leftPupil);
        
        // 右眼
        this.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        this.rightEye.position.set(0.4, 0.3, 1.5);
        this.scene.add(this.rightEye);
        
        const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.08, 32, 32), pupilMaterial);
        rightPupil.position.set(0.4, 0.3, 1.6);
        this.scene.add(rightPupil);
    }

    createNose() {
        const noseGeometry = new THREE.ConeGeometry(0.1, 0.4, 32);
        const noseMaterial = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color(this.parameters.skinColor),
            roughness: 0.5,
            metalness: 0.1
        });
        
        this.nose = new THREE.Mesh(noseGeometry, noseMaterial);
        this.nose.position.set(0, 0, 1.7);
        this.nose.rotation.x = Math.PI;
        this.scene.add(this.nose);
    }

    createMouth() {
        const mouthGeometry = new THREE.PlaneGeometry(0.5, 0.15);
        const mouthMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFF6B6B,
            roughness: 0.3,
            metalness: 0.1,
            side: THREE.DoubleSide
        });
        
        this.mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        this.mouth.position.set(0, -0.4, 1.7);
        this.scene.add(this.mouth);
    }

    updateFromLandmarks(landmarks) {
        if (!landmarks || landmarks.length === 0) return;
        
        // 从MediaPipe关键点更新面部形状
        const positions = this.faceMesh.geometry.attributes.position;
        
        // 更新顶点位置（简化实现，实际项目中需要更复杂的映射）
        for (let i = 0; i < positions.count; i++) {
            const originalX = this.originalVertices[i * 3];
            const originalY = this.originalVertices[i * 3 + 1];
            const originalZ = this.originalVertices[i * 3 + 2];
            
            positions.setXYZ(i, originalX, originalY, originalZ);
        }
        
        positions.needsUpdate = true;
        this.faceMesh.geometry.computeVertexNormals();
    }

    updateParameter(parameter, value) {
        this.parameters[parameter] = value;
        this.updateFaceShape();
    }

    updateFaceShape() {
        if (!this.faceMesh || !this.originalVertices) return;
        
        const positions = this.faceMesh.geometry.attributes.position;
        const faceWidthFactor = (this.parameters.faceWidth - 50) / 50;
        const faceLengthFactor = (this.parameters.faceLength - 50) / 50;
        const chinFactor = (this.parameters.chinShape - 50) / 50;
        
        for (let i = 0; i < positions.count; i++) {
            const originalX = this.originalVertices[i * 3];
            const originalY = this.originalVertices[i * 3 + 1];
            const originalZ = this.originalVertices[i * 3 + 2];
            
            // 应用脸型调整
            let newX = originalX * (1 + faceWidthFactor * 0.3);
            let newY = originalY * (1 + faceLengthFactor * 0.3);
            let newZ = originalZ;
            
            // 下巴形状调整
            if (originalY < -0.5) {
                newX *= (1 - chinFactor * 0.2);
                newY *= (1 + chinFactor * 0.3);
            }
            
            positions.setXYZ(i, newX, newY, newZ);
        }
        
        positions.needsUpdate = true;
        this.faceMesh.geometry.computeVertexNormals();
        
        // 更新五官
        this.updateFacialFeatures();
    }

    updateFacialFeatures() {
        // 更新眼睛
        const eyeScale = 0.8 + (this.parameters.eyeSize - 50) / 100;
        const eyeSpacing = (this.parameters.eyeSpacing - 50) / 100;
        
        this.leftEye.scale.set(eyeScale, eyeScale, eyeScale);
        this.rightEye.scale.set(eyeScale, eyeScale, eyeScale);
        
        this.leftEye.position.x = -0.4 - eyeSpacing * 0.2;
        this.rightEye.position.x = 0.4 + eyeSpacing * 0.2;
        
        // 更新鼻子
        const noseScale = 0.8 + (this.parameters.noseSize - 50) / 100;
        const noseHeight = 1.7 + (this.parameters.noseHeight - 50) / 100;
        
        this.nose.scale.set(noseScale, noseScale, noseScale);
        this.nose.position.z = noseHeight;
        
        // 更新嘴巴
        const mouthScale = 0.8 + (this.parameters.mouthSize - 50) / 100;
        const lipScale = 0.8 + (this.parameters.lipThickness - 50) / 100;
        
        this.mouth.scale.set(mouthScale, lipScale, 1);
    }

    updateSkinColor(color) {
        this.parameters.skinColor = color;
        this.faceMaterial.color.set(new THREE.Color(color));
        this.nose.material.color.set(new THREE.Color(color));
    }

    onResize() {
        const width = this.canvasElement.clientWidth;
        const height = this.canvasElement.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    getParameters() {
        return { ...this.parameters };
    }

    setParameters(params) {
        Object.assign(this.parameters, params);
        this.updateFaceShape();
        this.updateSkinColor(this.parameters.skinColor);
    }

    reset() {
        this.parameters = {
            faceWidth: 50,
            faceLength: 50,
            chinShape: 50,
            eyeSize: 50,
            eyeSpacing: 50,
            noseSize: 50,
            noseHeight: 50,
            mouthSize: 50,
            lipThickness: 50,
            skinColor: '#FFE0BD'
        };
        
        this.updateFaceShape();
        this.updateSkinColor(this.parameters.skinColor);
    }
}