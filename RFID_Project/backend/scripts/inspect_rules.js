const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Connection Error:', err);
        process.exit(1);
    }
};

const AlertRuleSchema = new mongoose.Schema({}, { strict: false });
const AlertRule = mongoose.model('AlertRule', AlertRuleSchema);

const listRules = async () => {
    await connectDB();
    const rules = await AlertRule.find({});
    console.log('--- ALL ALERT RULES ---');
    rules.forEach(r => {
        console.log(`ID: ${r.id} | Name: "${r.name}" | Type: ${r.type} | Keyword: "${r.keyword}" | Active: ${r.active}`);
    });
    console.log('-----------------------');
    process.exit();
};

listRules();
