class DataStorage {
    constructor() {
        this.localStorageKey = 'facemold_parameters';
        this.serverUrl = '/api';
    }

    async saveToLocalStorage(parameters) {
        try {
            const data = {
                parameters: parameters,
                timestamp: Date.now(),
                version: '1.0'
            };
            localStorage.setItem(this.localStorageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            return false;
        }
    }

    async loadFromLocalStorage() {
        try {
            const data = localStorage.getItem(this.localStorageKey);
            if (data) {
                const parsed = JSON.parse(data);
                return parsed.parameters;
            }
            return null;
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            return null;
        }
    }

    async saveToServer(parameters, userId = 'guest') {
        try {
            const response = await fetch(`${this.serverUrl}/save-parameters`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: userId,
                    parameters: parameters,
                    timestamp: Date.now()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return { success: true, message: 'Parameters saved to server', data: result };
        } catch (error) {
            console.error('Failed to save to server:', error);
            return { success: false, error: error.message };
        }
    }

    async loadFromServer(userId = 'guest') {
        try {
            const response = await fetch(`${this.serverUrl}/load-parameters?userId=${encodeURIComponent(userId)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result && result.parameters) {
                return result.parameters;
            }
            return null;
        } catch (error) {
            console.error('Failed to load from server:', error);
            return null;
        }
    }

    async saveParameters(parameters, userId = 'guest') {
        const localResult = await this.saveToLocalStorage(parameters);
        const serverResult = await this.saveToServer(parameters, userId);
        
        return {
            local: localResult,
            server: serverResult
        };
    }

    async loadParameters(userId = 'guest') {
        let parameters = await this.loadFromServer(userId);
        
        if (!parameters) {
            parameters = await this.loadFromLocalStorage();
        }
        
        return parameters;
    }

    clearLocalStorage() {
        try {
            localStorage.removeItem(this.localStorageKey);
            return true;
        } catch (error) {
            console.error('Failed to clear localStorage:', error);
            return false;
        }
    }

    exportParameters(parameters) {
        const dataStr = JSON.stringify(parameters, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `facemold_parameters_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    async importParameters(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const parameters = JSON.parse(e.target.result);
                    resolve(parameters);
                } catch (error) {
                    reject(new Error('Invalid JSON file'));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }
}
