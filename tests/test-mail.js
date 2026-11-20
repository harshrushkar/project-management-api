require("dotenv").config();

const transporter = require("../src/config/mail");

async function testMail() {
    try {
        await transporter.verify();
        console.log("Gmail SMTP connection successful!");
    } catch (error) {
        console.error("SMTP connection failed:", error.message);
    }
}

testMail();