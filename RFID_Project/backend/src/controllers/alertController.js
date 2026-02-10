const AlertRule = require('../models/AlertRule');
const { createSystemLog } = require('./logController');

const getAlerts = async (req, res) => {
    try {
        const alerts = await AlertRule.find();
        res.json(alerts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const createAlert = async (req, res) => {
    const { name, type, threshold } = req.body;
    if (!name || !type || threshold === undefined) {
        return res.status(400).json({ message: 'Name, Type, and Threshold are required.' });
    }
    const alert = new AlertRule(req.body);
    try {
        const newAlert = await alert.save();
        res.status(201).json(newAlert);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const updateAlert = async (req, res) => {
    try {
        const updatedAlert = await AlertRule.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
        res.json(updatedAlert);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const deleteAlert = async (req, res) => {
    try {
        await AlertRule.findOneAndDelete({ id: req.params.id });
        res.json({ message: 'Alert deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const resetSystem = async (req, res) => {
    try {
        const Log = require('../models/Log');
        const Character = require('../models/Character'); // Import Character model

        // Clear all logs to reset Threat Level logic
        await Log.deleteMany({});

        // Reset rules
        await AlertRule.updateMany({}, { active: true, lastTriggered: 0 });

        // Reset Characters: Move to "Invalid" (0,0) to trigger frontend footpath logic, and unregister
        await Character.updateMany({}, { isRegistered: false, position: { x: 0, y: 0 } });

        // Log the reset action (this will be the first new log)
        await createSystemLog('SYSTEM RESET COMPLETE. Logs cleared. Protocols restored.', 'success', { action: 'manual_reset' });

        res.json({ success: true, message: 'System reset and logs cleared.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getAlerts,
    createAlert,
    updateAlert,
    deleteAlert,
    resetSystem
};
