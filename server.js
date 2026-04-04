const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const PARAMETERS_FILE = path.join(DATA_DIR, 'parameters.json');

app.use(express.json());
app.use(express.static(__dirname));

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(PARAMETERS_FILE)) {
    fs.writeFileSync(PARAMETERS_FILE, JSON.stringify({}, null, 2));
}

function loadParametersData() {
    try {
        const data = fs.readFileSync(PARAMETERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading parameters data:', error);
        return {};
    }
}

function saveParametersData(data) {
    try {
        fs.writeFileSync(PARAMETERS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving parameters data:', error);
        return false;
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/save-parameters', (req, res) => {
    try {
        const { userId, parameters, timestamp } = req.body;
        
        if (!userId || !parameters) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields: userId and parameters are required' 
            });
        }

        const allParameters = loadParametersData();
        allParameters[userId] = {
            parameters: parameters,
            timestamp: timestamp || Date.now(),
            updatedAt: new Date().toISOString()
        };

        if (saveParametersData(allParameters)) {
            res.json({ 
                success: true, 
                message: 'Parameters saved successfully',
                userId: userId
            });
        } else {
            res.status(500).json({ 
                success: false, 
                error: 'Failed to save parameters' 
            });
        }
    } catch (error) {
        console.error('Error in save-parameters:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

app.get('/api/load-parameters', (req, res) => {
    try {
        const { userId } = req.query;
        
        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                error: 'userId is required' 
            });
        }

        const allParameters = loadParametersData();
        const userData = allParameters[userId];

        if (userData) {
            res.json({
                success: true,
                parameters: userData.parameters,
                timestamp: userData.timestamp,
                updatedAt: userData.updatedAt
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'No parameters found for this user'
            });
        }
    } catch (error) {
        console.error('Error in load-parameters:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   FaceMold Server is running!                             ║
║                                                           ║
║   Local:    http://localhost:${PORT}                      ║
║                                                           ║
║   Press Ctrl+C to stop the server                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
});
