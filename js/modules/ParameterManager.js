class ParameterManager {
    constructor() {
        this.parameters = this.getDefaultParameters();
        this.onParameterChange = null;
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
        this.bindSliders();
        this.bindButtons();
    }

    bindSliders() {
        const sliderIds = [
            'faceWidth', 'faceLength', 'chinWidth',
            'eyeSize', 'eyeDistance', 'eyeHeight',
            'noseWidth', 'noseHeight', 'noseBridge',
            'mouthWidth', 'mouthHeight', 'lipThickness',
            'skinColor'
        ];

        sliderIds.forEach(id => {
            const slider = document.getElementById(id);
            const valueSpan = document.getElementById(id + 'Value');

            if (slider && valueSpan) {
                slider.addEventListener('input', (event) => {
                    const value = parseFloat(event.target.value);
                    valueSpan.textContent = value.toFixed(1);
                    this.parameters[id] = value;
                    this.notifyChange();
                });
            }
        });
    }

    bindButtons() {
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetParameters();
            });
        }
    }

    getParameters() {
        return { ...this.parameters };
    }

    setParameters(newParameters) {
        this.parameters = { ...this.parameters, ...newParameters };
        this.updateUIFromParameters();
        this.notifyChange();
    }

    updateUIFromParameters() {
        for (const [key, value] of Object.entries(this.parameters)) {
            const slider = document.getElementById(key);
            const valueSpan = document.getElementById(key + 'Value');

            if (slider && valueSpan) {
                slider.value = value;
                valueSpan.textContent = value.toFixed(1);
            }
        }
    }

    resetParameters() {
        this.parameters = this.getDefaultParameters();
        this.updateUIFromParameters();
        this.notifyChange();
    }

    notifyChange() {
        if (this.onParameterChange) {
            this.onParameterChange(this.getParameters());
        }
    }
}
