const {
    generateOTP,
    hashOTP,
    verifyOTP,
    generateOTPExpiry,
} = require("../src/utils/otp.util");

async function testOTP() {
    const otp = generateOTP();

    console.log("Generated OTP:", otp);

    const hashedOTP = await hashOTP(otp);

    console.log("Hashed OTP:", hashedOTP);

    const isValid = await verifyOTP(otp, hashedOTP);

    console.log("OTP verification:", isValid);

    console.log("OTP expires at:", generateOTPExpiry());
}

testOTP();