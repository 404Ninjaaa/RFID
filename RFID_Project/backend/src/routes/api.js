const express = require('express');
const router = express.Router();
const { DOORS, MAP_CONFIG, Roles } = require('../config/constants');
const { getCharacters, createCharacter, updateCharacter, deleteCharacter } = require('../controllers/characterController');
const { getLogs, createLog, sendEmail } = require('../controllers/logController');
const { getAlerts, createAlert, updateAlert, deleteAlert, resetSystem } = require('../controllers/alertController');
const { requestAccess } = require('../controllers/accessController');

// --- Configuration ---
router.get('/config', (req, res) => {
    res.json({
        doors: Object.values(DOORS),
        mapConfig: MAP_CONFIG,
        roles: Roles
    });
});

// --- Access Control ---
router.post('/access/request', requestAccess);

// --- Characters ---
router.get('/characters', getCharacters);
router.post('/characters', createCharacter);
router.put('/characters/:id', updateCharacter);
router.delete('/characters/:id', deleteCharacter);

// --- Logs ---
router.get('/logs', getLogs);
router.post('/logs', createLog);

// --- Alerts ---
router.get('/alerts', getAlerts);
router.post('/alerts', createAlert);
router.put('/alerts/:id', updateAlert);
router.delete('/alerts/:id', deleteAlert);

// --- Notifications ---
router.post('/notifications/email', sendEmail);

// --- System ---
router.post('/system/reset', resetSystem);

module.exports = router;
