
const prisma = require("../../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { escapeHTML } = require("../../utils/escape-html.util");

const {
    generateOTP,
    hashOTP,
    generateOTPExpiry,
    verifyOTP,
} = require("../../utils/otp.util");


const {
    generateRefreshToken,
    hashRefreshToken,
    generateRefreshTokenExpiry,
} = require("../../utils/refresh-token.util");

const { sendEmail } = require("../../services/email.service");
const {
    generateResetAuthorizationToken,
    hashResetAuthorizationToken,
    generateResetAuthorizationExpiry,
} = require("../../utils/password-reset.util");

const registerUserService = async (userData) => {
    const { name, email, password } = userData;

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new Error("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expiresAt = generateOTPExpiry();

    let newUser;

    try {
        newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                emailVerification: {
                    create: {
                        otpHash,
                        expiresAt,
                    },
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                emailVerified: true,
                createdAt: true,
            },
        });
    } catch (error) {
        if (error.code === "P2002") {
            throw new Error("Email already registered");
        }

        throw error;
    }

    // Send OTP after database creation succeeds
    try {
        await sendEmail({
            to: email,
            subject: "Verify Your Email - Project Management App",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Email Verification</h2>
                    <p>Hello ${escapeHTML(name)},</p>
                    <p>Your email verification OTP is:</p>
                    <h1 style="letter-spacing: 6px;">${otp}</h1>
                    <p>This OTP is valid for 10 minutes.</p>
                    <p>Please do not share this OTP with anyone.</p>
                </div>
            `,
        });
    } catch (error) {
        console.error("OTP email sending failed:", error.message);

        throw new Error(
            "User registered, but verification email could not be sent. Please request a new OTP."
        );
    }

    return newUser;
};

const verifyEmailService = async ({ email, otp }) => {
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            emailVerification: true,
        },
    });

    console.log("EMAIL VERIFIED:", user?.emailVerified);
    console.log("EMAIL VERIFICATION:", user?.emailVerification);

    if (!user || user.emailVerified || !user.emailVerification) {
        throw new Error("Invalid or expired verification code");
    }

    const verification = user.emailVerification;

    // Check expiration
    if (verification.expiresAt <= new Date()) {
        throw new Error("OTP has expired");
    }

    // Check maximum attempts
    if (verification.attempts >= 5) {
        throw new Error("Maximum OTP attempts exceeded");
    }

    // Compare submitted OTP with stored hash
    const isValid = await verifyOTP(otp, verification.otpHash);

    if (!isValid) {
        await prisma.emailVerification.update({
            where: { userId: user.id },
            data: {
                attempts: {
                    increment: 1,
                },
            },
        });

        throw new Error("Invalid OTP");
    }

    // Update user and remove used OTP atomically
    await prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
            },
        });

        await tx.emailVerification.delete({
            where: { userId: user.id },
        });
    });

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: true,
    };
};

const resendOTPService = async ({ email }) => {
    // 1. Find user and verification record
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            emailVerification: true,
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    if (user.emailVerified) {
        throw new Error("Email already verified");
    }

    if (!user.emailVerification) {
        throw new Error("Verification record not found");
    }

    const verification = user.emailVerification;

    // 2. Check 60-second resend cooldown
    const currentTime = new Date();
    const cooldownTime = 60 * 1000;

    const timeSinceLastSent =
        currentTime.getTime() - verification.lastSentAt.getTime();

    if (timeSinceLastSent < cooldownTime) {
        throw new Error("Please wait before requesting another OTP");
    }

    // 3. Generate new OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expiresAt = generateOTPExpiry();

    // 4. Send email first
    try {
        await sendEmail({
            to: email,
            subject: "Your New Verification OTP",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Email Verification</h2>
                    <p>Hello ${escapeHTML(user.name)},</p>
                    <p>Your new verification OTP is:</p>
                    <h1 style="letter-spacing: 6px;">${otp}</h1>
                    <p>This OTP is valid for 10 minutes.</p>
                    <p>Please do not share this OTP with anyone.</p>
                </div>
            `,
        });
    } catch (error) {
        console.error("Resend OTP email failed:", error.message);
        throw new Error("Unable to send OTP email. Please try again later.");
    }

    // 5. Update database after successful email sending
    await prisma.emailVerification.update({
        where: {
            userId: user.id,
        },
        data: {
            otpHash,
            expiresAt,
            attempts: 0,
            lastSentAt: currentTime,
        },
    });

    return {
        email: user.email,
        message: "New OTP sent successfully",
    };
};

const loginUserService = async ({ email, password }) => {
    // 1. Find user by email
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new Error("Invalid email or password");
    }

    // 2. Check account status
    if (!user.isActive) {
        throw new Error("Your account is inactive");
    }

    // 3. Check email verification
    if (!user.emailVerified) {
        throw new Error("Please verify your email before logging in");
    }

    // 4. Compare password
    const isPasswordValid = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordValid) {
        throw new Error("Invalid email or password");
    }

    // 5. Generate Access Token
    const accessToken = jwt.sign(
        {
            sub: user.id,
            role: user.role,
        },
        process.env.JWT_ACCESS_SECRET,
        {
            expiresIn: "15m",
        }
    );

    // 6. Generate Refresh Token
    const refreshToken = generateRefreshToken();

    // 7. Hash Refresh Token
    const refreshTokenHash = hashRefreshToken(refreshToken);

    // 8. Generate Refresh Token Expiry
    const refreshTokenExpiry = generateRefreshTokenExpiry();

    // 9. Save hashed Refresh Token in database
    await prisma.refreshToken.create({
        data: {
            tokenHash: refreshTokenHash,
            userId: user.id,
            expiresAt: refreshTokenExpiry,
        },
    });

    // 10. Return both tokens
    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
        accessToken,
        refreshToken,
    };
};

const refreshTokenService = async ({ refreshToken }) => {
    // 1. Hash the received refresh token
    const tokenHash = hashRefreshToken(refreshToken);

    // 2. Find token in database
    const storedToken = await prisma.refreshToken.findUnique({
        where: { tokenHash },
        include: { user: true },
    });

    // 3. Validate token
    if (!storedToken) {
        throw new Error("Invalid refresh token");
    }

    if (storedToken.revokedAt) {
        throw new Error("Refresh token has been revoked");
    }

    if (storedToken.expiresAt <= new Date()) {
        throw new Error("Refresh token has expired");
    }

    // 4. Check user status
    const user = storedToken.user;

    if (!user.isActive || !user.emailVerified) {
        throw new Error("User account is not available");
    }

    // 5. Generate new tokens
    const newAccessToken = jwt.sign(
        {
            sub: user.id,
            role: user.role,
        },
        process.env.JWT_ACCESS_SECRET,
        {
            expiresIn: "15m",
        }
    );

    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = hashRefreshToken(newRefreshToken);
    const newExpiry = generateRefreshTokenExpiry();

    // 6. Rotate tokens atomically
    await prisma.$transaction(async (tx) => {
        const revokeResult = await tx.refreshToken.updateMany({
            where: {
                id: storedToken.id,
                revokedAt: null,
                expiresAt: { gt: new Date() },
            },
            data: {
                revokedAt: new Date(),
            },
        });

        if (revokeResult.count !== 1) {
            throw new Error("Refresh token has already been used");
        }

        await tx.refreshToken.create({
            data: {
                tokenHash: newRefreshTokenHash,
                userId: user.id,
                expiresAt: newExpiry,
            },
        });
    });

    // 7. Return new tokens
    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
    };
};

const logoutUserService = async ({ refreshToken }) => {
    // 1. Hash the received refresh token
    const tokenHash = hashRefreshToken(refreshToken);

    // 2. Find the refresh token in database
    const storedToken = await prisma.refreshToken.findUnique({
        where: { tokenHash },
    });

    if (!storedToken) {
        throw new Error("Invalid refresh token");
    }

    // 3. Check whether token is already revoked
    if (storedToken.revokedAt) {
        throw new Error("Refresh token has already been revoked");
    }

    // 4. Revoke the refresh token
    const result = await prisma.refreshToken.updateMany({
        where: {
            id: storedToken.id,
            revokedAt: null,
            expiresAt: { gt: new Date() },
        },
        data: {
            revokedAt: new Date(),
        },
    });

    if (result.count !== 1) {
        throw new Error("Refresh token is invalid or expired");
    }

    return {
        message: "Logout successful",
    };
};

const forgotPasswordService = async ({ email }) => {
    // 1. Find user by email
    const user = await prisma.user.findUnique({
        where: { email },
    });

    // Don't reveal whether an email exists
    if (!user) {
        return {
            message: "If the account exists, a password reset OTP has been sent.",
        };
    }

    // 2. Generate OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const otpExpiresAt = generateOTPExpiry();

    // 3. Send OTP email first
    try {
        await sendEmail({
            to: email,
            subject: "Password Reset OTP",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Password Reset</h2>
                   <p>Hello ${escapeHTML(user.name)},</p>
                    <p>Your password reset OTP is:</p>
                    <h1 style="letter-spacing: 6px;">${otp}</h1>
                    <p>This OTP is valid for 10 minutes.</p>
                    <p>If you did not request this, please ignore this email.</p>
                </div>
            `,
        });
    } catch (error) {
        console.error("Password reset email failed:", error.message);

        throw new Error("Unable to send password reset email");
    }

    // 4. Save or update PasswordReset record
    await prisma.passwordReset.upsert({
        where: {
            userId: user.id,
        },
        update: {
            otpHash,
            otpExpiresAt,
            attempts: 0,
            isVerified: false,
            verifiedAt: null,
            verifiedExpiresAt: null,
            resetAuthorizationHash: null,
        },
        create: {
            userId: user.id,
            otpHash,
            otpExpiresAt,
        },
    });

    return {
        message: "If the account exists, a password reset OTP has been sent.",
    };
};


const verifyResetOTPService = async ({ email, otp }) => {
    // 1. Find user and password reset record
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            passwordReset: true,
        },
    });

    if (!user || !user.passwordReset) {
        throw new Error("Invalid or expired reset OTP");
    }

    const resetRecord = user.passwordReset;

    // 2. Check whether OTP is expired
    if (resetRecord.otpExpiresAt <= new Date()) {
        throw new Error("Reset OTP has expired");
    }

    // 3. Check maximum attempts
    if (resetRecord.attempts >= 5) {
        throw new Error("Maximum OTP attempts exceeded");
    }

    // 4. Check whether OTP was already verified
    if (resetRecord.isVerified) {
        throw new Error("Reset OTP already verified");
    }

    // 5. Compare submitted OTP with stored hash
    const isValid = await verifyOTP(otp, resetRecord.otpHash);

    if (!isValid) {
        await prisma.passwordReset.update({
            where: { userId: user.id },
            data: {
                attempts: {
                    increment: 1,
                },
            },
        });

        throw new Error("Invalid reset OTP");
    }

    // 6. Generate reset authorization token
    const currentTime = new Date();

    const resetAuthorizationToken =
        generateResetAuthorizationToken();

    const resetAuthorizationHash =
        hashResetAuthorizationToken(resetAuthorizationToken);

    const verifiedExpiresAt =
        generateResetAuthorizationExpiry();

    // 7. Save token hash and verification details
    await prisma.passwordReset.update({
        where: { userId: user.id },
        data: {
            isVerified: true,
            verifiedAt: currentTime,
            verifiedExpiresAt,
            resetAuthorizationHash: null,
        },
    });

    // 8. Return original token to frontend
    return {
        email: user.email,
        resetAuthorizationToken,
        resetExpiresAt: verifiedExpiresAt,
        message: "OTP verified successfully. You can reset your password within 10 minutes.",
    };
};


const resetPasswordService = async ({
    resetAuthorizationToken,
    newPassword,
}) => {
    // 1. Hash the received authorization token
    const resetAuthorizationHash =
        hashResetAuthorizationToken(resetAuthorizationToken);

    // 2. Perform all database operations in one transaction
    await prisma.$transaction(async (tx) => {

        // Find the matching reset record
        const resetRecord = await tx.passwordReset.findUnique({
            where: {
                resetAuthorizationHash,
            },
            include: {
                user: true,
            },
        });

        // 3. Validate authorization token
        if (!resetRecord || !resetRecord.user) {
            throw new Error("Invalid or expired reset authorization token");
        }

        if (!resetRecord.isVerified) {
            throw new Error("OTP verification is required");
        }

        const currentTime = new Date();

        if (
            !resetRecord.verifiedExpiresAt ||
            resetRecord.verifiedExpiresAt <= currentTime
        ) {
            throw new Error("Password reset authorization has expired");
        }

        if (
            !resetRecord.user.isActive ||
            !resetRecord.user.emailVerified
        ) {
            throw new Error("Account is not eligible for password reset");
        }

        // 4. Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 5. Atomically consume the authorization token
        const consumeResult = await tx.passwordReset.updateMany({
            where: {
                id: resetRecord.id,
                resetAuthorizationHash,
                isVerified: true,
                verifiedExpiresAt: {
                    gt: currentTime,
                },
            },
            data: {
                resetAuthorizationHash: null,
                isVerified: false,
            },
        });

        // Only one request can consume this token
        if (consumeResult.count !== 1) {
            throw new Error(
                "Reset authorization token is invalid or already used"
            );
        }

        // 6. Update user's password
        await tx.user.update({
            where: {
                id: resetRecord.userId,
            },
            data: {
                password: hashedPassword,
            },
        });

        // 7. Revoke all active refresh tokens
        await tx.refreshToken.updateMany({
            where: {
                userId: resetRecord.userId,
                revokedAt: null,
            },
            data: {
                revokedAt: currentTime,
            },
        });

        // 8. Delete password reset record
        await tx.passwordReset.delete({
            where: {
                id: resetRecord.id,
            },
        });
    });

    return {
        message: "Password reset successfully. Please log in again.",
    };
};




module.exports = {
    registerUserService,
    verifyEmailService,
    resendOTPService,
    loginUserService,
    refreshTokenService,
    logoutUserService,
    forgotPasswordService,
    verifyResetOTPService,
    resetPasswordService
};
