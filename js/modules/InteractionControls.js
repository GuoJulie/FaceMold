class InteractionControls {
    constructor(renderer, camera) {
        this.renderer = renderer;
        this.camera = camera;
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.rotationSpeed = 0.01;
        this.zoomSpeed = 0.1;
        this.minDistance = 2;
        this.maxDistance = 10;
    }

    init() {
        this.renderer.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.renderer.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.renderer.domElement.addEventListener('mouseleave', this.onMouseUp.bind(this));
        this.renderer.domElement.addEventListener('wheel', this.onWheel.bind(this));
        
        this.renderer.domElement.addEventListener('touchstart', this.onTouchStart.bind(this));
        this.renderer.domElement.addEventListener('touchmove', this.onTouchMove.bind(this));
        this.renderer.domElement.addEventListener('touchend', this.onTouchEnd.bind(this));
    }

    onMouseDown(event) {
        this.isDragging = true;
        this.previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    }

    onMouseMove(event) {
        if (!this.isDragging) return;

        const deltaMove = {
            x: event.clientX - this.previousMousePosition.x,
            y: event.clientY - this.previousMousePosition.y
        };

        this.camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), deltaMove.x * this.rotationSpeed);
        
        const up = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(
            new THREE.Vector3().subVectors(this.camera.position, new THREE.Vector3(0, 0, 0)).normalize(),
            up
        ).normalize();
        
        this.camera.position.applyAxisAngle(right, deltaMove.y * this.rotationSpeed);
        
        this.camera.lookAt(0, 0, 0);
        this.previousMousePosition = { x: event.clientX, y: event.clientY };
    }

    onMouseUp() {
        this.isDragging = false;
    }

    onWheel(event) {
        event.preventDefault();
        
        const direction = new THREE.Vector3().subVectors(
            this.camera.position,
            new THREE.Vector3(0, 0, 0)
        ).normalize();
        
        const zoomAmount = event.deltaY * this.zoomSpeed * 0.01;
        const newPosition = this.camera.position.clone().add(direction.multiplyScalar(zoomAmount));
        const distance = newPosition.length();
        
        if (distance >= this.minDistance && distance <= this.maxDistance) {
            this.camera.position.copy(newPosition);
        }
    }

    onTouchStart(event) {
        if (event.touches.length === 1) {
            this.isDragging = true;
            this.previousMousePosition = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
        }
    }

    onTouchMove(event) {
        if (!this.isDragging || event.touches.length !== 1) return;

        const deltaMove = {
            x: event.touches[0].clientX - this.previousMousePosition.x,
            y: event.touches[0].clientY - this.previousMousePosition.y
        };

        this.camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), deltaMove.x * this.rotationSpeed);
        
        const up = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(
            new THREE.Vector3().subVectors(this.camera.position, new THREE.Vector3(0, 0, 0)).normalize(),
            up
        ).normalize();
        
        this.camera.position.applyAxisAngle(right, deltaMove.y * this.rotationSpeed);
        
        this.camera.lookAt(0, 0, 0);
        this.previousMousePosition = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
        };
    }

    onTouchEnd() {
        this.isDragging = false;
    }

    setRotationSpeed(speed) {
        this.rotationSpeed = speed;
    }

    setZoomSpeed(speed) {
        this.zoomSpeed = speed;
    }

    setZoomLimits(min, max) {
        this.minDistance = min;
        this.maxDistance = max;
    }
}
