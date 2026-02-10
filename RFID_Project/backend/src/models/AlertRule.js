const mongoose = require('mongoose');

const AlertRuleSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: String,
    type: { type: String, enum: ['error_rate', 'unauthorized_access', 'keyword_match'] },
    threshold: Number,
    interval: Number,
    keyword: String,
    action: { type: String, default: 'notify' },
    active: { type: Boolean, default: true },
    lastTriggered: Number
});

module.exports = mongoose.model('AlertRule', AlertRuleSchema);
