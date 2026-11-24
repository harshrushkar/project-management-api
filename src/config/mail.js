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

module.exports = transporter;