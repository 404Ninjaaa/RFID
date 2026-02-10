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

const deleteDuplicate = async () => {
    await connectDB();
    // Delete the one named "Access Denied Alert" which seems to be the manual/duplicate one
    // Keeping "Unauthorized Access" which matches the seeded default in server.js
    const res = await AlertRule.deleteOne({ name: "Access Denied Alert" });
    console.log(`Deleted ${res.deletedCount} duplicate rule(s).`);
    process.exit();
};

deleteDuplicate();
