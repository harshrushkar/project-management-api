const express = require("express");
const { registerUser, verifyEmail, resendOTP, loginUser, getProfile, refreshToken, logoutUser, forgotPassword, verifyResetOTP, resetPassword } = require("./auth.controller");
const {
    registerValidation,
    verifyEmailValidation,
    validateRequest,
    resendOTPValidation,
    loginValidation,
    refreshTokenValidation,
    forgotPasswordValidation,
    verifyResetOTPValidation,
    resetPasswordValidation
} = require("./auth.validation");
const { authenticateUser } = require("../../middleware/auth.middleware");

const router = express.Router();

router.post(
    "/register",
    registerValidation,
    validateRequest,
    registerUser
);

router.post(
    "/verify-email",
    verifyEmailValidation,
    validateRequest,
    verifyEmail
);

router.post(
    "/resend-otp",
    resendOTPValidation,
    validateRequest,
    resendOTP
);

router.post(
    "/login",
    loginValidation,
    validateRequest,
    loginUser
);

router.get(
    "/profile",
    authenticateUser,
    getProfile
);

router.post(
    "/refresh-token",
    refreshTokenValidation,
    validateRequest,
    refreshToken
);

router.post(
    "/logout",
    refreshTokenValidation,
    validateRequest,
    logoutUser
);

router.post(
    "/forgot-password",
    forgotPasswordValidation,
    validateRequest,
    forgotPassword
);

router.post(
    "/verify-reset-otp",
    verifyResetOTPValidation,
    validateRequest,
    verifyResetOTP
);

router.post(
    "/reset-password",
    resetPasswordValidation,
    validateRequest,
    resetPassword
);

module.exports = router;