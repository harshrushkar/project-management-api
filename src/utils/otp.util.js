const crypto = require("crypto");
const bcrypt = require("bcrypt");

const generateOTP = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

const hashOTP = async (otp) => {
    return await bcrypt.hash(otp, 10);
};
const verifyOTP = async (otp, hashedOTP) => {
    return await bcrypt.compare(otp, hashedOTP);
};

const generateOTPExpiry = () => {
    const expiry = new Date();

    expiry.setMinutes(expiry.getMinutes() + 10);

    return expiry;
};
module.exports = {
    generateOTP,
    hashOTP,
    verifyOTP,
    generateOTPExpiry

};