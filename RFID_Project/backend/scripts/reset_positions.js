const mongoose = require('mongoose');
const Character = require('../src/models/Character');
require('dotenv').config({ path: '../.env' });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/404ninja');
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB Connection Failed:', err);
        process.exit(1);
    }
};

const resetPositions = async () => {
    await connectDB();
    try {
        // Update all characters to position (0,0)
        // The frontend App.tsx has logic that detects (0,0) and automatically 
        // places them on the footpath and saves the new valid position.
        const result = await Character.updateMany({}, {
            position: { x: 0, y: 0 }
        });

        console.log(`Reset positions for ${result.modifiedCount} characters.`);
    } catch (err) {
        console.error('Reset failed:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
};

resetPositions();
