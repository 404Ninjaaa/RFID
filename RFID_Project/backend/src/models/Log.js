const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    timestamp: { type: Date, default: Date.now, index: true, expires: '30d' }, // Auto-delete logs after 30 days
    text: String,
    type: { type: String, enum: ['info', 'success', 'error', 'warning', 'access_granted', 'access_denied', 'system_alert'] },
    user: { type: Number, ref: 'Character' },
    metadata: {
        item: String,
        userAgent: String,
        sessionId: String,
        zone: String,
        device: String,
        details: mongoose.Schema.Types.Mixed
    }
});

module.exports = mongoose.model('Log', LogSchema);
