const Log = require('../models/Log');
const AlertRule = require('../models/AlertRule');
const Character = require('../models/Character');
const { generateId } = require('../utils/helpers');
const nodemailer = require('nodemailer');

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Email Helper Function
const sendEmailInternal = async (subject, text) => {
    // Check for missing OR mock credentials
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_USER === 'admin@sector7.com') {
        console.log(`[📧 MOCK EMAIL SENT]`);
        console.log(`To: ${process.env.ADMIN_EMAIL || 'Admin'}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${text}`);
        return { success: true, mock: true };
    }
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL || 'salmanzehan123@gmail.com', // Configurable admin
            subject: `[SYSTEM ALERT] ${subject}`,
            text: text
        });
        console.log(`Email sent: ${subject}`);
        return { success: true };
    } catch (error) {
        console.error('Email failed:', error.message);
        return { success: false, error: error.message };
    }
};

// Alert Logic - Optimized
const checkAlertRules = async (newLog) => {
    // Fire and forget (don't await in main thread flow if possible, or keep short)
    try {
        const rules = await AlertRule.find({ active: true }).lean(); // Use lean for speed
        const now = Date.now();

        for (const rule of rules) {
            try {
                // OPTIMIZATION: Skip if triggered too recently (debounce)
                if (rule.lastTriggered && (now - rule.lastTriggered < 60000)) { // 1 minute cool-off
                    continue;
                }

                let triggered = false;

                if (rule.type === 'error_rate' && rule.threshold && rule.interval) {
                    if (newLog.type === 'error') {
                        const cutoff = new Date(now - (rule.interval * 1000));
                        // Optimization: Limit the count query if possible or index properly
                        const recentErrorCount = await Log.countDocuments({
                            type: 'error',
                            timestamp: { $gte: cutoff }
                        });
                        if (recentErrorCount >= rule.threshold) triggered = true;
                    }
                } else if (rule.type === 'unauthorized_access') {
                    if (newLog.type === 'access_denied') {
                        triggered = true;
                    }
                } else if (rule.type === 'keyword_match' && rule.keyword) {
                    if (newLog.text && newLog.text.toLowerCase().includes(rule.keyword.toLowerCase())) {
                        triggered = true;
                    }
                }

                if (triggered) {
                    console.log(`[ALERT TRIGGERED] Rule: ${rule.name}`);

                    // Resolve 'Who'
                    let who = "System Generated"; // Default if no user linked
                    if (newLog.user) {
                        try {
                            const char = await Character.findOne({ id: newLog.user });
                            if (char) {
                                who = `Name: ${char.name}\nRole: ${char.role}\nRFID: ${char.rfidCode}`;
                            }
                        } catch (e) { console.error("Error fetching char for alert", e); }
                    }

                    // Format 'When'
                    const when = new Date(newLog.timestamp || now).toLocaleString("en-US", { timeZone: "Asia/Kathmandu" });

                    // Format Details
                    const details = `
--------------------------------------------------
🚨 SECURITY ALERT: ${rule.name.toUpperCase()}
--------------------------------------------------

WHAT HAPPENED:
${newLog.text}

WHO:
${who}

WHEN:
${when}

--------------------------------------------------
Hexa Access Control System
`;

                    // Async email send - Don't await to keep loop fast, or await if critical
                    // For now, no await to prevent blocking other rules significantly
                    sendEmailInternal(
                        `Security Alert: ${rule.name} `,
                        details
                    ).catch(err => console.error("Failed to send alert email", err));

                    // Update lastTriggered
                    await AlertRule.updateOne({ _id: rule._id }, { lastTriggered: now });
                }
            } catch (ruleErr) {
                console.error(`Error processing rule ${rule.name}:`, ruleErr);
            }
        }
    } catch (err) {
        console.error('Error in checkAlertRules:', err);
    }
};

// Helper: Create and save log
async function createSystemLog(text, type, metadata = {}, userId = null) {
    const log = new Log({
        id: generateId(),
        text,
        type,
        user: userId,
        metadata
    });
    try {
        const saved = await log.save();
        // Trigger alerts in background
        checkAlertRules(saved);
        return saved;
    } catch (e) {
        console.error("Failed to log:", e);
    }
}

const getLogs = async (req, res) => {
    try {
        const logs = await Log.find().sort({ id: -1 }).limit(1000);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const createLog = async (req, res) => {
    const log = new Log(req.body);
    try {
        const newLog = await log.save();
        res.status(201).json(newLog);
        checkAlertRules(newLog);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// --- Notifications ---
const sendEmail = async (req, res) => {
    const { subject, text } = req.body;
    const result = await sendEmailInternal(subject, text);
    if (result.success) {
        res.json({ message: 'Email sent successfully' });
    } else {
        res.status(500).json({ message: 'Failed to send email' });
    }
};

module.exports = {
    createSystemLog,
    getLogs,
    createLog,
    sendEmail
};
