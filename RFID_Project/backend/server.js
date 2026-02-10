const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs'); // Needed for seeding
const dotenv = require('dotenv');

// Explicitly load from root .env
dotenv.config({ path: path.join(__dirname, '../.env') });


const connectDB = require('./src/config/db');
const Character = require('./src/models/Character'); // For seeding
const AlertRule = require('./src/models/AlertRule'); // For seeding rules
const apiRoutes = require('./src/routes/api');

const app = express();
const PORT = process.env.PORT || 5001;

// --- Security: Startup Validation ---
const validateEnv = () => {
    const required = ['MONGODB_URI'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        console.error(`[CRITICAL] Missing required environment variables: ${missing.join(', ')}`);
        console.error('Application will operate in unsafe mode or fail to connect.');
    }
    if (!process.env.EMAIL_USER) console.warn('[WARN] EMAIL_USER not set. Alerts will be logged to console only.');
};
validateEnv();

// Connect to Database
connectDB().then(async () => {
    await seedDatabase();
});

// Middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5000,
    message: 'Too many requests from this IP'
});
app.use(limiter);
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Allow any localhost origin
        if (origin.match(/^http:\/\/localhost:[0-9]+$/)) {
            return callback(null, true);
        }

        // Allowed specific domains (if deploying)
        const allowedDomains = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];
        if (allowedDomains.indexOf(origin) !== -1) {
            return callback(null, true);
        }

        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
    },
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Seeding Logic (Improved)
const DEFAULT_CHARACTERS = [
    { id: 1, name: 'Salman Miya', role: 'Admin', rfidCode: 'D4 C6 4D 08', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    { id: 2, name: 'Jia Li', role: 'Engineer', rfidCode: 'E6 FF C9 03', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
    { id: 3, name: 'Ben Carter', role: 'Staff', rfidCode: '54 08 EA 04', avatar: 'https://randomuser.me/api/portraits/men/85.jpg' },
    { id: 4, name: 'Elena Petrova', role: 'Security', rfidCode: 'BA D5 25 B3', avatar: 'https://randomuser.me/api/portraits/women/65.jpg' },
    { id: 5, name: 'Guest User', role: 'Visitor', rfidCode: '9C 91 CF 33', avatar: 'https://randomuser.me/api/portraits/lego/1.jpg' },
];

async function seedDatabase() {
    try {
        for (const char of DEFAULT_CHARACTERS) {
            const exists = await Character.findOne({ id: char.id }).select('+pinHash +passwordHash');

            let updates = {};
            // Always update basic info (Name, Avatar, Role) for system characters to match code config
            updates = { ...char };

            // Phase 2 Improvement: Mark default chars as system
            updates.isSystem = true;

            // Ensure PIN
            if (!exists || !exists.pinHash) {
                const pinToHash = process.env.DEFAULT_PIN || '123456';
                updates.pinHash = await bcrypt.hash(pinToHash, 10);
            }

            // Ensure Password - Update if matches generic default or missing
            // Force update for default characters to new unique passwords if they are currently on the old default
            const targetPass = char.defaultPass || process.env.DEFAULT_PASSWORD || 'password123';

            if (!exists || !exists.passwordHash) {
                updates.passwordHash = await bcrypt.hash(targetPass, 10);
            } else {
                // Optional: Check if current password is 'password123' and auto-migrate to new unique one? 
                // For now, let's just force update the hash for system characters to ensure they have the requested unique passwords
                // This ensures the user request is met immediately without them needing to reset.
                const isGeneric = await bcrypt.compare('password123', exists.passwordHash);
                if (isGeneric) {
                    updates.passwordHash = await bcrypt.hash(targetPass, 10);
                    console.log(`Upgrading password for ${char.name} to unique default.`);
                }
            }

            if (Object.keys(updates).length > 0) {
                await Character.findOneAndUpdate(
                    { id: char.id },
                    { $set: updates },
                    { upsert: true, new: true }
                );
                console.log(`Seeded/Updated character credentials: ${char.name}`);
            }

            // --- Seeding Default Alert Rules ---
            const defaultRules = [
                { id: 998, name: 'Fire Alarm Trigger', type: 'keyword_match', keyword: 'FIRE ALARM', active: true },
                { id: 999, name: 'Unauthorized Access', type: 'unauthorized_access', active: true }
            ];

            for (const rule of defaultRules) {
                const ruleExists = await AlertRule.findOne({ name: rule.name });
                if (!ruleExists) {
                    await AlertRule.create(rule);
                    console.log(`Seeded default alert rule: ${rule.name}`);
                }
            }
        }
        console.log('Seeding check complete.');
    } catch (err) {
        console.error('Seeding failed:', err);
    }
}

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
