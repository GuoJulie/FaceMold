# FaceMold

## 项目简介

FaceMold 是一个轻量化的3D人脸可视化交互组件，专为游戏捏脸场景设计。它基于 MediaPipe 捕捉人脸关键点，使用 Three.js 进行3D渲染，支持实时调整五官参数。

## 最新更新 (2026-04-05)

### 核心Bug修复

**问题描述：** 原项目渲染出的是诡异球状物体而非完整3D人脸。

**修复内容：**

1. **重构3D人脸模型生成算法** (`js/modules/FaceRenderer.js:83-190`)
   - 替换了简单球体为基于数学函数生成的真实人脸网格
   - 增加了鼻子、额头、下巴、眼睛、嘴巴等面部特征的几何细节
   - 使用40x40网格创建更高分辨率的人脸模型

2. **优化MediaPipe关键点映射** (`js/modules/FaceRenderer.js:284-330`)
   - 增加了更多重要的面部关键点（共36个）
   - 调整了关键点影响半径和混合因子
   - 改进了关键点归一化算法

3. **保留完整交互功能**
   - 鼠标拖拽旋转视角
   - 滚轮缩放
   - 所有参数调整（脸型、眼睛、鼻子、嘴巴、肤色）
   - 实时预览效果

**测试方法：**
- 直接在浏览器中打开 `index.html` 即可测试
- 或使用 `npm start` 启动服务器后访问 `http://localhost:3000`

## 核心功能

- 📷 **实时人脸检测**: 使用PC端摄像头采集人脸数据，通过MediaPipe捕捉关键点
- 🎭 **3D人脸渲染**: 基于Three.js创建可交互的3D人脸模型
- 🎮 **直观交互**: 鼠标拖拽旋转视角，滚轮缩放
- ⚙️ **参数调整**: 实时调整脸型、眼鼻嘴形状、肤色等五官参数
- 💾 **数据存储**: 支持本地存储和服务端存储用户参数，跨设备同步
- 🎯 **模块化设计**: 渲染、交互、逻辑分离，易于扩展和维护

## 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **人脸检测**: MediaPipe Face Mesh
- **3D渲染**: Three.js
- **后端**: Node.js + Express (可选)

## 项目结构

```
FaceMold/
├── index.html                 # 主页面
├── css/
│   └── style.css             # 样式文件
├── js/
│   ├── app.js                # 应用主入口
│   └── modules/
│       ├── FaceDetector.js   # 人脸检测模块
│       ├── FaceRenderer.js   # 3D渲染模块
│       ├── InteractionControls.js  # 交互控制模块
│       ├── ParameterManager.js     # 参数管理模块
│       └── DataStorage.js    # 数据存储模块
├── server.js                 # 后端服务器（可选）
├── package.json              # 项目配置
└── README.md                 # 项目文档
```

## 快速开始

### 方式一：直接打开（前端功能）

直接在浏览器中打开 `index.html` 即可使用前端核心功能。

### 方式二：启动服务器（完整功能）

1. 安装依赖：
```bash
npm install
```

2. 启动服务器：
```bash
npm start
```

3. 在浏览器中访问：`http://localhost:3000`

## 使用说明

### 1. 开启摄像头
点击"开启摄像头"按钮，授权浏览器访问摄像头。

### 2. 捕捉人脸
确保人脸在摄像头画面中，点击"捕捉人脸"按钮，将人脸数据导入3D模型。

### 3. 调整参数
使用右侧面板的滑块调整各项参数：
- **脸型**: 脸宽、脸长、下巴宽度
- **眼睛**: 眼睛大小、眼睛间距、眼睛高度
- **鼻子**: 鼻子宽度、鼻子高度、鼻梁高度
- **嘴巴**: 嘴巴宽度、嘴巴高度、嘴唇厚度
- **肤色**: 选择不同的肤色

### 4. 3D交互
- **旋转视角**: 在3D视图上按住鼠标左键拖拽
- **缩放**: 使用鼠标滚轮

### 5. 保存/加载
- **保存参数**: 将当前参数保存到本地和服务器
- **加载参数**: 加载已保存的参数
- **重置参数**: 恢复默认参数

## API接口

### 保存参数
```
POST /api/save-parameters
Content-Type: application/json

{
  "userId": "user123",
  "parameters": {...},
  "timestamp": 1234567890
}
```

### 加载参数
```
GET /api/load-parameters?userId=user123
```

## 模块说明

### FaceDetector
负责摄像头访问和人脸关键点检测，使用MediaPipe Face Mesh。

### FaceRenderer
基于Three.js的3D人脸渲染，支持参数化变形。

### InteractionControls
处理3D视图的交互，包括旋转、缩放、平移。

### ParameterManager
管理UI控件和参数状态，实时同步到3D渲染。

### DataStorage
数据存储模块，支持：
- LocalStorage本地存储
- 服务端API存储
- JSON导入/导出

## 集成到游戏

FaceMold采用模块化设计，易于嵌入到游戏中：

1. 将前端代码集成到游戏UI系统
2. 通过`ParameterManager`获取/设置参数
3. 使用`DataStorage`同步用户数据
4. 将3D渲染结果导出为纹理或模型数据

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

需要支持WebGL和WebRTC的现代浏览器。

## 许可证

MIT License
