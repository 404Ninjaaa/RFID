const Character = require('../models/Character');
const Log = require('../models/Log');
const { DOORS } = require('../config/constants');
const { createSystemLog } = require('./logController');
const bcrypt = require('bcryptjs');

// --- NEW Secure Access Control ---
const requestAccess = async (req, res) => {
    const { rfidCode, doorId, pin, password } = req.body;

    if (!rfidCode || !doorId) {
        return res.status(400).json({ success: false, message: 'Missing RFID or Door ID' });
    }

    try {
        // 1. Identify User
        const char = await Character.findOne({ rfidCode }).select('+pinHash +passwordHash');
        if (!char) {
            await createSystemLog(`Access Denied: Unknown RFID ${rfidCode}`, 'access_denied', { doorId, rfid: rfidCode });
            return res.status(404).json({ success: false, message: 'Invalid Card', unknown: true });
        }

        // 2. Identify Door
        const door = DOORS[doorId];
        if (!door) {
            return res.status(404).json({ success: false, message: 'Invalid Door ID' });
        }

        // 3. Check Permissions
        const requiredRoles = door.requiredRoles || [];
        const hasRole = requiredRoles.includes(char.role);

        if (!hasRole) {
            await createSystemLog(`Access Denied: ${char.name} at ${door.name}`, 'access_denied', { doorId, userId: char.id, role: char.role }, char.id);
            return res.status(403).json({ success: false, message: 'Access Denied: Insufficient Clearance' });
        }

        // 4. Authentication Type Check (Password vs PIN)
        if (door.authType === 'password') {
            // PASSWORD CHECK (Main Entrance)
            if (!password) {
                return res.json({
                    success: false,
                    requirePassword: true,
                    message: 'Password Required',
                    character: { name: char.name, role: char.role, id: char.id }
                });
            }

            if (!char.passwordHash) {
                await createSystemLog(`Auth Failed: No Password setup for ${char.name}`, 'error', { doorId, userId: char.id }, char.id);
                return res.status(403).json({ success: false, message: 'Account Setup Required (No Password)' });
            }

            const passValid = await bcrypt.compare(password, char.passwordHash);
            if (!passValid) {
                await createSystemLog(`Auth Failed: Invalid Password for ${char.name}`, 'access_denied', { doorId, userId: char.id }, char.id);
                return res.status(401).json({ success: false, message: 'Invalid Password' });
            }

        } else if (door.authType === 'pin') {
            // PIN CHECK (High Security Internal)
            if (!pin) {
                return res.json({
                    success: false,
                    requirePin: true,
                    message: 'PIN Required',
                    character: { name: char.name, role: char.role, id: char.id }
                });
            }

            if (!char.pinHash) {
                await createSystemLog(`MFA Failed: No PIN setup for ${char.name}`, 'error', { doorId, userId: char.id }, char.id);
                return res.status(403).json({ success: false, message: 'Account Setup Required (No PIN)' });
            }

            const pinValid = await bcrypt.compare(pin, char.pinHash);
            if (!pinValid) {
                await createSystemLog(`MFA Failed: Invalid PIN for ${char.name}`, 'access_denied', { doorId, userId: char.id }, char.id);
                return res.status(401).json({ success: false, message: 'Invalid PIN' });
            }
        }

        // 5. Grant Access
        await createSystemLog(`Access Granted: ${char.name} at ${door.name}`, 'access_granted', { doorId, userId: char.id });

        // Auto-Register at Main Entrance (Config Enabled)
        let registrationMessage = '';
        if (door.isRegistrationPoint && !char.isRegistered) {
            await Character.updateOne({ id: char.id }, { isRegistered: true });
            registrationMessage = ' (Registration Confirmed)';
            await createSystemLog(`Registration Complete: ${char.name} is now active.`, 'success', { action: 'register', userId: char.id });
        }

        return res.json({
            success: true,
            message: 'Access Granted' + registrationMessage,
            user: {
                id: char.id,
                name: char.name,
                role: char.role,
                isRegistered: (doorId === 1 && !char.isRegistered) ? true : char.isRegistered
            }
        });

    } catch (err) {
        console.error('Access Request Error:', err);
        res.status(500).json({ success: false, message: 'Internal System Error' });
    }
};

module.exports = {
    requestAccess
};
