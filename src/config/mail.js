const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

console.log("SMTP CONFIG:", {
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    emailUserConfigured: !!process.env.EMAIL_USER,
    emailPassConfigured: !!process.env.EMAIL_PASS,
});

transporter.verify((error, success) => {
    if (error) {
        console.error("SMTP VERIFY FAILED:", error.message);
    } else {
        console.log("SMTP SERVER READY");
    }
});

module.exports = transporter;