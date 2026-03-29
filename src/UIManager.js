/**
 * UI管理器 - 处理用户界面交互
 */
export class UIManager {
    constructor(faceRenderer, faceCapture) {
        this.faceRenderer = faceRenderer;
        this.faceCapture = faceCapture;
        this.dataSync = null;
        
        this.initControls();
        this.initEventListeners();
    }

    initControls() {
        // 初始化滑块
        this.initSlider('face-width');
        this.initSlider('face-length');
        this.initSlider('chin-shape');
        this.initSlider('eye-size');
        this.initSlider('eye-spacing');
        this.initSlider('nose-size');
        this.initSlider('nose-height');
        this.initSlider('mouth-size');
        this.initSlider('lip-thickness');
        
        // 初始化肤色选择器
        this.initColorPicker();
    }

    initSlider(id) {
        const slider = document.getElementById(id);
        const valueSpan = document.getElementById(`${id}-value`);
        
        if (slider && valueSpan) {
            slider.addEventListener('input', (e) => {
                valueSpan.textContent = e.target.value;
                
                // 转换为驼峰命名
                const paramName = id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
                this.faceRenderer.updateParameter(paramName, parseInt(e.target.value));
                
                // 同步数据
                if (this.dataSync) {
                    this.dataSync.updateParameter(paramName, parseInt(e.target.value));
                }
            });
        }
    }

    initColorPicker() {
        const colorOptions = document.querySelectorAll('.color-option');
        const colorValue = document.getElementById('skin-color-value');
        
        const colorNames = {
            '#FFE0BD': '白皙',
            '#FFC8A0': '自然',
            '#E6B89C': '小麦色',
            '#D4A574': '古铜色',
            '#B8860B': '深色'
        };
        
        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                // 移除其他选项的active状态
                colorOptions.forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                
                const color = option.dataset.color;
                colorValue.textContent = colorNames[color] || color;
                
                this.faceRenderer.updateSkinColor(color);
                
                // 同步数据
                if (this.dataSync) {
                    this.dataSync.updateParameter('skinColor', color);
                }
            });
        });
        
        // 设置默认选中
        const defaultOption = document.querySelector('.color-option[data-color="#FFE0BD"]');
        if (defaultOption) {
            defaultOption.classList.add('active');
        }
    }

    initEventListeners() {
        // 捕获按钮
        const captureBtn = document.getElementById('capture-btn');
        if (captureBtn) {
            captureBtn.addEventListener('click', () => {
                const landmarks = this.faceCapture.getFaceLandmarks();
                if (landmarks) {
                    this.faceRenderer.updateFromLandmarks(landmarks);
                    console.log('人脸数据已捕获并应用到3D模型');
                } else {
                    console.log('未检测到人脸数据');
                }
            });
        }
        
        // 重置按钮
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.faceRenderer.reset();
                this.resetUI();
                console.log('所有参数已重置');
            });
        }
        
        // 保存按钮
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                if (this.dataSync) {
                    this.dataSync.saveToServer();
                }
            });
        }
    }

    resetUI() {
        // 重置所有滑块
        const sliders = document.querySelectorAll('input[type="range"]');
        sliders.forEach(slider => {
            slider.value = 50;
            const valueSpan = document.getElementById(`${slider.id}-value`);
            if (valueSpan) {
                valueSpan.textContent = '50';
            }
        });
        
        // 重置肤色选择器
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(o => o.classList.remove('active'));
        const defaultOption = document.querySelector('.color-option[data-color="#FFE0BD"]');
        if (defaultOption) {
            defaultOption.classList.add('active');
        }
        const colorValue = document.getElementById('skin-color-value');
        if (colorValue) {
            colorValue.textContent = '白皙';
        }
    }

    setDataSync(dataSync) {
        this.dataSync = dataSync;
    }

    updateUI(params) {
        // 更新UI从参数
        for (const [key, value] of Object.entries(params)) {
            if (key === 'skinColor') {
                // 更新肤色
                const colorOptions = document.querySelectorAll('.color-option');
                colorOptions.forEach(o => o.classList.remove('active'));
                const option = document.querySelector(`.color-option[data-color="${value}"]`);
                if (option) {
                    option.classList.add('active');
                }
            } else {
                // 更新滑块
                const id = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                const slider = document.getElementById(id);
                const valueSpan = document.getElementById(`${id}-value`);
                
                if (slider && valueSpan) {
                    slider.value = value;
                    valueSpan.textContent = value;
                }
            }
        }
    }
}