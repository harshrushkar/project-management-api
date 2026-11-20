
const crypto = require("crypto");

// Generate a secure random refresh token
const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString("hex");
};

// Convert refresh token into SHA-256 hash
const hashRefreshToken = (token) => {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
};

// Generate refresh token expiry (7 days)
const generateRefreshTokenExpiry = () => {
    const expiry = new Date();

    expiry.setDate(expiry.getDate() + 7);

    return expiry;
};

module.exports = {
    generateRefreshToken,
    hashRefreshToken,
    generateRefreshTokenExpiry,
};
