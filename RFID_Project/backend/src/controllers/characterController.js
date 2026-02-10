const Character = require('../models/Character');
const bcrypt = require('bcryptjs');

const { generateId } = require('../utils/helpers');

const getCharacters = async (req, res) => {
    try {
        const characters = await Character.find();
        res.json(characters);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const createCharacter = async (req, res) => {
    const { name, role, rfidCode, pin } = req.body;
    if (!name || !role || !rfidCode) {
        return res.status(400).json({ message: 'Name, Role, and RFID Code are required.' });
    }

    try {
        const charData = { ...req.body };

        // Ensure ID presence
        if (!charData.id) {
            charData.id = generateId();
        }

        if (pin && pin.length >= 4) {
            charData.pinHash = await bcrypt.hash(pin, 10);
            delete charData.pin;
        }

        if (req.body.password && req.body.password.length >= 4) {
            charData.passwordHash = await bcrypt.hash(req.body.password, 10);
            delete charData.password;
        }

        const character = new Character(charData);
        const newCharacter = await character.save();
        res.status(201).json(newCharacter);
    } catch (err) {
        // Handle duplicate key error (E11000) gracefully
        if (err.code === 11000) {
            if (err.keyPattern.rfidCode) {
                return res.status(400).json({ message: 'Error: RFID Code already assigned to another user.' });
            }
            if (err.keyPattern.id) {
                // Retry once with new ID if collision (rare)
                try {
                    const retryData = { ...req.body, id: generateId() };
                    // ... (hashing logic reuse would be needed, but simplified for now)
                    // Better to just let user retry or keep simple.
                    return res.status(400).json({ message: 'ID Collision. Please try again.' });
                } catch (retryErr) { }
            }
        }
        res.status(400).json({ message: err.message });
    }
};

const updateCharacter = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const updates = { ...req.body };

        if (updates.pin) {
            if (updates.pin.length >= 4) {
                updates.pinHash = await bcrypt.hash(updates.pin, 10);
            }
            delete updates.pin;
        }

        if (updates.password) {
            if (updates.password.length >= 4) {
                updates.passwordHash = await bcrypt.hash(updates.password, 10);
            }
            delete updates.password;
        }

        const updatedChar = await Character.findOneAndUpdate({ id }, updates, { new: true });
        if (!updatedChar) return res.status(404).json({ message: 'Character not found' });
        res.json(updatedChar);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const deleteCharacter = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        // Find existing to check for system flag
        const existing = await Character.findOne({ id });
        if (!existing) return res.status(404).json({ message: 'Character not found' });

        // Use isSystem flag if present, otherwise fallback to ID check (Phase 2 will fully enhance this)
        if (existing.isSystem === true || id <= 5) {
            return res.status(403).json({ message: 'Cannot delete default system personnel.' });
        }

        await Character.findOneAndDelete({ id });
        res.json({ message: 'Character deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getCharacters,
    createCharacter,
    updateCharacter,
    deleteCharacter
};
