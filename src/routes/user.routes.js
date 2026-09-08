import { Router } from "express";

import {
    registerUser,
    loginUser,
    logoutUser,
    getUserById,
    getCurrentUser,
    refreshAccessToken,
    googleOAuthCallback,
    verifyLoginOtp,
    resendLoginOtp,
    forgotPassword,
    resetPassword,
    updatePassword
} from "../controllers/user.controller.js";

import {
    verifyJwt
} from "../middlewares/auth.middleware.js";

import passport from "passport";

const router = Router();

/* ============================================================
   PUBLIC AUTH ROUTES
   ============================================================ */

router.post(
    "/register",
    registerUser
);

router.post(
    "/login",
    loginUser
);

router.post(
    "/verify-otp",
    verifyLoginOtp
);

router.post(
    "/resend-otp",
    resendLoginOtp
);

router.post(
    "/refresh-token",
    refreshAccessToken
);

/* ============================================================
   PASSWORD RECOVERY
   ============================================================ */

/*
 * Request password recovery OTP.
 *
 * Body:
 * {
 *     email
 * }
 */
router.post(
    "/forgot-password",
    forgotPassword
);

/*
 * Complete password reset using OTP.
 *
 * Body:
 * {
 *     otp,
 *     newPassword
 * }
 *
 * passwordResetToken is stored in an HTTP-only cookie.
 */
router.post(
    "/reset-password",
    resetPassword
);

/* ============================================================
   GOOGLE AUTHENTICATION
   ============================================================ */

router.get(
    "/google",
    passport.authenticate(
        "google",
        {
            scope: [
                "profile",
                "email"
            ],
            session: false
        }
    )
);

router.get(
    "/google/callback",
    passport.authenticate(
        "google",
        {
            session: false,
            failureRedirect:
                `${process.env.FRONTEND_URL}/login?error=google_auth_failed`
        }
    ),
    googleOAuthCallback
);

/* ============================================================
   PROTECTED AUTH ROUTES
   ============================================================ */

router.post(
    "/logout",
    verifyJwt,
    logoutUser
);

router.get(
    "/current-user",
    verifyJwt,
    getCurrentUser
);

/*
 * Authenticated password change.
 *
 * Body:
 * {
 *     currentPassword,
 *     newPassword
 * }
 */
router.patch(
    "/update-password",
    verifyJwt,
    updatePassword
);

router.get(
    "/:id",
    verifyJwt,
    getUserById
);

export default router;