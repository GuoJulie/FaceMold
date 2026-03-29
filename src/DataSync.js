/**
 * 数据同步模块 - 处理客户端与服务端的数据同步
 */
export class DataSync {
    constructor(faceRenderer) {
        this.faceRenderer = faceRenderer;
        this.serverUrl = 'http://localhost:3001/api'; // 服务端API地址
        this.userId = this.getUserId();
        this.localStorageKey = 'faceMoldParams';
        
        // 初始化本地存储
        this.initLocalStorage();
    }

    getUserId() {
        // 从localStorage获取用户ID，如果不存在则创建一个
        let userId = localStorage.getItem('faceMoldUserId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('faceMoldUserId', userId);
        }
        return userId;
    }

    initLocalStorage() {
        // 检查是否有本地存储的参数
        const savedParams = localStorage.getItem(this.localStorageKey);
        if (savedParams) {
            try {
                const params = JSON.parse(savedParams);
                this.faceRenderer.setParameters(params);
                console.log('从本地存储加载参数成功');
            } catch (error) {
                console.error('解析本地存储参数失败:', error);
            }
        }
    }

    updateParameter(parameter, value) {
        // 更新本地存储
        const params = this.faceRenderer.getParameters();
        params[parameter] = value;
        this.saveToLocalStorage(params);
        
        // 延迟同步到服务器（避免频繁请求）
        this.debounceServerSync();
    }

    saveToLocalStorage(params) {
        localStorage.setItem(this.localStorageKey, JSON.stringify(params));
    }

    debounceServerSync() {
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
        }
        
        this.syncTimeout = setTimeout(() => {
            this.syncToServer();
        }, 1000); // 1秒延迟
    }

    async syncToServer() {
        const params = this.faceRenderer.getParameters();
        
        try {
            const response = await fetch(`${this.serverUrl}/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': this.userId
                },
                body: JSON.stringify(params)
            });
            
            if (response.ok) {
                console.log('参数同步到服务器成功');
            } else {
                console.error('同步到服务器失败:', response.statusText);
            }
        } catch (error) {
            console.error('同步到服务器失败:', error);
        }
    }

    async saveToServer() {
        const params = this.faceRenderer.getParameters();
        
        try {
            const response = await fetch(`${this.serverUrl}/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': this.userId
                },
                body: JSON.stringify({
                    timestamp: Date.now(),
                    parameters: params
                })
            });
            
            if (response.ok) {
                console.log('参数保存到服务器成功');
                alert('参数保存成功！');
            } else {
                console.error('保存到服务器失败:', response.statusText);
                alert('保存失败，请稍后重试');
            }
        } catch (error) {
            console.error('保存到服务器失败:', error);
            alert('保存失败，请稍后重试');
        }
    }

    async loadFromServer() {
        try {
            const response = await fetch(`${this.serverUrl}/load`, {
                method: 'GET',
                headers: {
                    'X-User-ID': this.userId
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.parameters) {
                    this.faceRenderer.setParameters(data.parameters);
                    this.saveToLocalStorage(data.parameters);
                    console.log('从服务器加载参数成功');
                    return data.parameters;
                }
            } else {
                console.error('从服务器加载失败:', response.statusText);
            }
        } catch (error) {
            console.error('从服务器加载失败:', error);
        }
        
        return null;
    }

    async getSavedRecords() {
        try {
            const response = await fetch(`${this.serverUrl}/records`, {
                method: 'GET',
                headers: {
                    'X-User-ID': this.userId
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('获取保存记录成功:', data);
                return data;
            } else {
                console.error('获取保存记录失败:', response.statusText);
            }
        } catch (error) {
            console.error('获取保存记录失败:', error);
        }
        
        return [];
    }
}