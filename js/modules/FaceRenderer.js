class FaceRenderer {
    constructor(containerElement) {
        this.container = containerElement;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.faceMesh = null;
        this.wireframeMesh = null;
        this.originalVertices = [];
        this.currentVertices = [];
        this.landmarks = null;
        this.landmarkPoints = null;
        this.parameters = this.getDefaultParameters();
        this.animationId = null;
        this.faceGeometry = null;
    }

    getDefaultParameters() {
        return {
            faceWidth: 1.0,
            faceLength: 1.0,
            chinWidth: 1.0,
            eyeSize: 1.0,
            eyeDistance: 1.0,
            eyeHeight: 1.0,
            noseWidth: 1.0,
            noseHeight: 1.0,
            noseBridge: 1.0,
            mouthWidth: 1.0,
            mouthHeight: 1.0,
            lipThickness: 1.0,
            skinColor: 0.5
        };
    }

    init() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.z = 5;

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 10;

        this.addLights();
        this.createBaseFaceMesh();

        window.addEventListener('resize', this.onWindowResize.bind(this));
        this.animate();
    }

    addLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight2.position.set(-5, 3, -5);
        this.scene.add(directionalLight2);

        const rimLight = new THREE.DirectionalLight(0xffeedd, 0.3);
        rimLight.position.set(0, -5, -5);
        this.scene.add(rimLight);
    }

    createBaseFaceMesh() {
        const geometry = new THREE.SphereGeometry(1.5, 64, 64);
        
        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);
            
            const faceScaleY = 1.2;
            const faceScaleX = 0.9;
            const faceScaleZ = 0.85;
            
            positions.setXYZ(i, x * faceScaleX, y * faceScaleY, z * faceScaleZ);
        }
        
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshPhongMaterial({
            color: this.getSkinColor(0.5),
            shininess: 50,
            specular: 0x333333,
            flatShading: false
        });

        this.faceMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.faceMesh);
        
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true,
            transparent: true,
            opacity: 0.1
        });
        this.wireframeMesh = new THREE.Mesh(geometry, wireframeMaterial);
        this.scene.add(this.wireframeMesh);

        this.originalVertices = [];
        const pos = geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            this.originalVertices.push({
                x: pos.getX(i),
                y: pos.getY(i),
                z: pos.getZ(i)
            });
        }
        this.currentVertices = JSON.parse(JSON.stringify(this.originalVertices));
        this.faceGeometry = geometry;
    }

    getSkinColor(value) {
        const colors = [
            0xffdbac,
            0xf0d5be,
            0xe5b88a,
            0xd4a574,
            0xc68642,
            0x8d5524
        ];
        
        const index = Math.floor(value * (colors.length - 1));
        const t = (value * (colors.length - 1)) % 1;
        
        if (index >= colors.length - 1) return colors[colors.length - 1];
        
        const c1 = new THREE.Color(colors[index]);
        const c2 = new THREE.Color(colors[index + 1]);
        return c1.lerp(c2, t);
    }

    setLandmarks(landmarks) {
        this.landmarks = landmarks;
        this.landmarkPoints = this.normalizeLandmarks(landmarks);
        this.updateFaceMeshFromLandmarks();
    }

    normalizeLandmarks(landmarks) {
        if (!landmarks || landmarks.length === 0) return null;
        
        const points = [];
        
        let centerX = 0, centerY = 0, centerZ = 0;
        for (const lm of landmarks) {
            centerX += lm.x;
            centerY += lm.y;
            centerZ += lm.z;
        }
        centerX /= landmarks.length;
        centerY /= landmarks.length;
        centerZ /= landmarks.length;
        
        let maxDist = 0;
        for (const lm of landmarks) {
            const dx = lm.x - centerX;
            const dy = lm.y - centerY;
            const dz = lm.z - centerZ;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist > maxDist) maxDist = dist;
        }
        
        const scale = 1.5 / maxDist;
        
        for (const lm of landmarks) {
            points.push({
                x: (lm.x - centerX) * scale * 1.5,
                y: -(lm.y - centerY) * scale * 1.5,
                z: -(lm.z - centerZ) * scale * 1.2
            });
        }
        
        return points;
    }

    updateFaceMeshFromLandmarks() {
        if (!this.faceMesh || !this.landmarkPoints) return;

        const positions = this.faceMesh.geometry.attributes.position;
        
        for (let i = 0; i < positions.count; i++) {
            let vertex = { ...this.originalVertices[i] };
            
            vertex = this.applyLandmarkDeformation(vertex);
            
            vertex = this.applyFaceShapeDeformation(vertex);
            vertex = this.applyEyeDeformation(vertex);
            vertex = this.applyNoseDeformation(vertex);
            vertex = this.applyMouthDeformation(vertex);
            
            positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        
        positions.needsUpdate = true;
        this.faceMesh.geometry.computeVertexNormals();
        
        if (this.wireframeMesh) {
            this.wireframeMesh.geometry.attributes.position.needsUpdate = true;
            this.wireframeMesh.geometry.computeVertexNormals();
        }
        
        this.faceMesh.material.color = this.getSkinColor(this.parameters.skinColor);
    }

    applyLandmarkDeformation(vertex) {
        if (!this.landmarkPoints) return vertex;
        
        const result = { ...vertex };
        const influenceRadius = 0.5;
        const blendFactor = 0.6;
        
        let totalWeight = 0;
        let weightedX = 0, weightedY = 0, weightedZ = 0;
        
        const importantLandmarks = [
            10, 152, 234, 454,
            33, 133, 362, 263,
            1, 2, 98, 327,
            13, 14, 78, 308,
            168, 197, 4, 5, 200, 201, 202,
            21, 54, 63, 103, 105, 107
        ];
        
        for (const idx of importantLandmarks) {
            if (idx >= this.landmarkPoints.length) continue;
            
            const lm = this.landmarkPoints[idx];
            const dist = this.distance(vertex, lm);
            
            if (dist < influenceRadius) {
                const weight = Math.pow(1 - dist / influenceRadius, 2);
                totalWeight += weight;
                weightedX += lm.x * weight;
                weightedY += lm.y * weight;
                weightedZ += lm.z * weight;
            }
        }
        
        if (totalWeight > 0) {
            const avgX = weightedX / totalWeight;
            const avgY = weightedY / totalWeight;
            const avgZ = weightedZ / totalWeight;
            
            result.x = vertex.x * (1 - blendFactor) + avgX * blendFactor;
            result.y = vertex.y * (1 - blendFactor) + avgY * blendFactor;
            result.z = vertex.z * (1 - blendFactor) + avgZ * blendFactor;
        }
        
        return result;
    }

    setParameters(parameters) {
        this.parameters = { ...this.parameters, ...parameters };
        this.updateFaceMeshFromLandmarks();
    }

    applyFaceShapeDeformation(vertex) {
        const { faceWidth, faceLength, chinWidth } = this.parameters;
        
        const distFromCenter = Math.sqrt(vertex.x * vertex.x + vertex.y * vertex.y);
        const normalizedY = (vertex.y + 1.5) / 3;
        
        let widthFactor = faceWidth;
        if (vertex.y < 0) {
            const chinInfluence = -vertex.y / 1.5;
            widthFactor = faceWidth * (1 - chinInfluence) + chinWidth * chinInfluence;
        }
        
        vertex.x *= widthFactor;
        vertex.y *= faceLength;
        
        return vertex;
    }

    applyEyeDeformation(vertex) {
        const { eyeSize, eyeDistance, eyeHeight } = this.parameters;
        
        let leftEyeCenter = { x: -0.4, y: 0.3, z: 1.2 };
        let rightEyeCenter = { x: 0.4, y: 0.3, z: 1.2 };
        
        if (this.landmarkPoints) {
            if (this.landmarkPoints[33] && this.landmarkPoints[133]) {
                leftEyeCenter = {
                    x: (this.landmarkPoints[33].x + this.landmarkPoints[133].x) / 2,
                    y: (this.landmarkPoints[33].y + this.landmarkPoints[133].y) / 2,
                    z: (this.landmarkPoints[33].z + this.landmarkPoints[133].z) / 2
                };
            }
            if (this.landmarkPoints[362] && this.landmarkPoints[263]) {
                rightEyeCenter = {
                    x: (this.landmarkPoints[362].x + this.landmarkPoints[263].x) / 2,
                    y: (this.landmarkPoints[362].y + this.landmarkPoints[263].y) / 2,
                    z: (this.landmarkPoints[362].z + this.landmarkPoints[263].z) / 2
                };
            }
        }
        
        const distToLeftEye = this.distance(vertex, leftEyeCenter);
        const distToRightEye = this.distance(vertex, rightEyeCenter);
        
        const eyeInfluenceRadius = 0.5;
        
        if (distToLeftEye < eyeInfluenceRadius) {
            const influence = 1 - distToLeftEye / eyeInfluenceRadius;
            vertex.x = leftEyeCenter.x + (vertex.x - leftEyeCenter.x) * (1 + influence * (eyeSize - 1));
            vertex.y = leftEyeCenter.y + (vertex.y - leftEyeCenter.y) * (1 + influence * (eyeSize - 1));
            vertex.y += influence * (eyeHeight - 1) * 0.2;
            vertex.x -= influence * (eyeDistance - 1) * 0.1;
        }
        
        if (distToRightEye < eyeInfluenceRadius) {
            const influence = 1 - distToRightEye / eyeInfluenceRadius;
            vertex.x = rightEyeCenter.x + (vertex.x - rightEyeCenter.x) * (1 + influence * (eyeSize - 1));
            vertex.y = rightEyeCenter.y + (vertex.y - rightEyeCenter.y) * (1 + influence * (eyeSize - 1));
            vertex.y += influence * (eyeHeight - 1) * 0.2;
            vertex.x += influence * (eyeDistance - 1) * 0.1;
        }
        
        return vertex;
    }

    applyNoseDeformation(vertex) {
        const { noseWidth, noseHeight, noseBridge } = this.parameters;
        
        let noseTip = { x: 0, y: -0.1, z: 1.4 };
        let noseBridgeLine = { x: 0, y: 0.3, z: 1.2 };
        
        if (this.landmarkPoints) {
            if (this.landmarkPoints[1]) {
                noseTip = { ...this.landmarkPoints[1] };
            }
            if (this.landmarkPoints[168]) {
                noseBridgeLine = { ...this.landmarkPoints[168] };
            }
        }
        
        const distToNoseTip = this.distance(vertex, noseTip);
        const distToNoseBridge = this.distance(vertex, noseBridgeLine);
        
        const noseInfluenceRadius = 0.4;
        
        if (distToNoseTip < noseInfluenceRadius) {
            const influence = 1 - distToNoseTip / noseInfluenceRadius;
            vertex.x *= 1 + influence * (noseWidth - 1);
            vertex.z = noseTip.z + (vertex.z - noseTip.z) * (1 + influence * (noseHeight - 1));
        }
        
        if (distToNoseBridge < noseInfluenceRadius && vertex.y > noseTip.y) {
            const influence = 1 - distToNoseBridge / noseInfluenceRadius;
            vertex.z = noseBridgeLine.z + (vertex.z - noseBridgeLine.z) * (1 + influence * (noseBridge - 1));
        }
        
        return vertex;
    }

    applyMouthDeformation(vertex) {
        const { mouthWidth, mouthHeight, lipThickness } = this.parameters;
        
        let mouthCenter = { x: 0, y: -0.5, z: 1.2 };
        
        if (this.landmarkPoints && this.landmarkPoints[13]) {
            mouthCenter = { ...this.landmarkPoints[13] };
        }
        
        const distToMouth = this.distance(vertex, mouthCenter);
        const mouthInfluenceRadius = 0.5;
        
        if (distToMouth < mouthInfluenceRadius) {
            const influence = 1 - distToMouth / mouthInfluenceRadius;
            vertex.x = mouthCenter.x + (vertex.x - mouthCenter.x) * (1 + influence * (mouthWidth - 1));
            vertex.y = mouthCenter.y + (vertex.y - mouthCenter.y) * (1 + influence * (mouthHeight - 1));
            
            if (Math.abs(vertex.y - mouthCenter.y) < 0.15) {
                vertex.z = mouthCenter.z + (vertex.z - mouthCenter.z) * (1 + influence * (lipThickness - 1));
            }
        }
        
        return vertex;
    }

    distance(p1, p2) {
        return Math.sqrt(
            Math.pow(p1.x - p2.x, 2) +
            Math.pow(p1.y - p2.y, 2) +
            Math.pow(p1.z - p2.z, 2)
        );
    }

    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        this.animationId = requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}