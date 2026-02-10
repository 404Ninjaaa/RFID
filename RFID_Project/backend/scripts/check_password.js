const mongoose = require('mongoose');
const Character = require('../src/models/Character');
const bcrypt = require('bcryptjs');
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

const checkPassword = async () => {
    await connectDB();
    try {
        const char = await Character.findOne({ name: 'Jia Li' }).select('+passwordHash');
        if (!char) {
            console.log('User not found');
            return;
        }

        console.log(`Checking password for ${char.name} (ID: ${char.id})`);
        console.log('Stored Hash:', char.passwordHash ? 'Present' : 'MISSING');

        if (char.passwordHash) {
            const isMatch = await bcrypt.compare('password123', char.passwordHash);
            console.log('Match with "password123":', isMatch);
        } else {
            console.log('No password hash set!');

            // Auto-fix if missing
            const newHash = await bcrypt.hash('password123', 10);
            await Character.updateOne({ id: char.id }, { passwordHash: newHash });
            console.log('FIX APPLIED: Reset password to "password123"');
        }

    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
};

checkPassword();
