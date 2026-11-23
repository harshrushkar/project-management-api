const prisma = require("../../config/database");
const { registerUserService, verifyEmailService, resendOTPService, loginUserService, refreshTokenService, logoutUserService, forgotPasswordService, verifyResetOTPService, resetPasswordService } = require("./auth.service");

const registerUser = async (req, res) => {
    try {
        console.log("RAW REQUEST BODY:", req.body);

        const { name, email, password } = req.body;
        const newUser = await registerUserService({
            name,
            email,
            password,
        });

        console.log("EMAIL FROM REQUEST:", req.body.email);
        console.log("EMAIL SENT TO SERVICE:", email);

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: newUser,
        });
    } catch (error) {
        console.error("Registration error:", error);

        if (error.message === "Email already registered") {
            return res.status(409).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const verifiedUser = await verifyEmailService({
            email,
            otp,
        });

        return res.status(200).json({
            success: true,
            message: "Email verified successfully",
            data: verifiedUser,
        });

    } catch (error) {
        console.error("Email verification error:", error.message);

        const clientErrors = [
            "Invalid or expired verification code",
            "OTP has expired",
            "Maximum OTP attempts exceeded",
            "Invalid OTP",
        ];

        if (clientErrors.includes(error.message)) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        const result = await resendOTPService({ email });

        return res.status(200).json({
            success: true,
            message: result.message,
            data: {
                email: result.email,
            },
        });
    } catch (error) {
        console.error("Resend OTP error:", error.message);

        const clientErrors = [
            "User not found",
            "Email already verified",
            "Verification record not found",
            "Please wait before requesting another OTP",
            "Unable to send OTP email. Please try again later.",
        ];

        if (clientErrors.includes(error.message)) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await loginUserService({
            email,
            password,
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: result,
        });

    } catch (error) {
        console.error("Login error:", error.message);

        if (error.message === "Invalid email or password") {
            return res.status(401).json({
                success: false,
                message: error.message,
            });
        }

        if (
            error.message === "Your account is inactive" ||
            error.message === "Please verify your email before logging in"
        ) {
            return res.status(403).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: req.user.id,
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

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: "User account is not available",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile fetched successfully",
            data: user,
        });

    } catch (error) {
        console.error("Get profile error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const refreshToken = async (req, res) => {
    try {
        const { refreshToken: token } = req.body;

        const result = await refreshTokenService({
            refreshToken: token,
        });

        return res.status(200).json({
            success: true,
            message: "Token refreshed successfully",
            data: result,
        });

    } catch (error) {
        console.error("Refresh token error:", error.message);

        const clientErrors = [
            "Invalid refresh token",
            "Refresh token has been revoked",
            "Refresh token has expired",
            "User account is not available",
            "Refresh token has already been used",
        ];

        if (clientErrors.includes(error.message)) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired refresh token",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const logoutUser = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        const result = await logoutUserService({
            refreshToken,
        });

        return res.status(200).json({
            success: true,
            message: result.message,
        });

    } catch (error) {
        console.error("Logout error:", error.message);

        const clientErrors = [
            "Invalid refresh token",
            "Refresh token has already been revoked",
            "Refresh token is invalid or expired",
        ];

        if (clientErrors.includes(error.message)) {
            return res.status(401).json({
                success: false,
                message: "Invalid or already revoked refresh token",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const result = await forgotPasswordService({ email });

        return res.status(200).json({
            success: true,
            message: result.message,
        });

    } catch (error) {
        console.error("Forgot password error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const verifyResetOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const result = await verifyResetOTPService({
            email,
            otp,
        });

        return res.status(200).json({
            success: true,
            message: result.message,
            data: {
                email: result.email,
                resetAuthorizationToken: result.resetAuthorizationToken,
                resetExpiresAt: result.resetExpiresAt,
            },
        });

    } catch (error) {
        console.error("Verify reset OTP error:", error.message);

        const clientErrors = [
            "Invalid or expired reset OTP",
            "Reset OTP has expired",
            "Maximum OTP attempts exceeded",
            "Reset OTP already verified",
            "Invalid reset OTP",
        ];

        if (clientErrors.includes(error.message)) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const result = await resetPasswordService({
            resetAuthorizationToken: req.body.resetAuthorizationToken,
            newPassword: req.body.newPassword,
        });

        return res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        console.error("Reset Password Error:", error.message);

        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};



module.exports = {
    registerUser,
    verifyEmail,
    resendOTP,
    loginUser,
    getProfile,
    refreshToken,
    logoutUser,
    forgotPassword,
    verifyResetOTP,
    resetPassword
};