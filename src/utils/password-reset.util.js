
const crypto = require("crypto");

// Generate a secure reset authorization token
const generateResetAuthorizationToken = () => {
    return crypto.randomBytes(64).toString("hex");
};

// Hash the reset authorization token
const hashResetAuthorizationToken = (token) => {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
};

// Generate 10-minute authorization expiry
const generateResetAuthorizationExpiry = () => {
    return new Date(Date.now() + 10 * 60 * 1000);
};

module.exports = {
    generateResetAuthorizationToken,
    hashResetAuthorizationToken,
    generateResetAuthorizationExpiry,
};
