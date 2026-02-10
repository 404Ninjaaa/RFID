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

const listUsers = async () => {
    await connectDB();
    try {
        const chars = await Character.find({});
        console.log('--- DB CHARACTERS ---');
        chars.forEach(c => {
            console.log(`ID: ${c.id}, Name: "${c.name}", Role: ${c.role}`);
        });
    } catch (err) {
        console.error('List failed:', err);
    } finally {
        await mongoose.disconnect();
    }
};

listUsers();
