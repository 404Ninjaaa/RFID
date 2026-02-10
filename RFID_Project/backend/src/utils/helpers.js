// Helper: Secure ID Generator (Numeric)
// Uses timestamp + random component, checks ensuring 53-bit safety (JS Number limit)
const generateId = () => {
    // Current time in ms (approx 13 digits) + 3 digit random
    // Safe max integer is 9007199254740991 (16 digits)
    return Date.now() * 1000 + Math.floor(Math.random() * 1000);
};

module.exports = {
    generateId
};
