const mongoose = require('mongoose');

const CharacterSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: String,
    role: String,
    rfidCode: { type: String, unique: true },
    avatar: String,
    pinHash: { type: String, select: false },
    passwordHash: { type: String, select: false }, // New Password Field

    // Persistence Fields
    position: {
        x: { type: Number },
        y: { type: Number }
    },
    isRegistered: { type: Boolean, default: false },
    lastKnownZone: { type: String, default: 'Unknown' },
    // System protection flag
    isSystem: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Character', CharacterSchema);
