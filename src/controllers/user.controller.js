import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import {
    sendOtp,
    verifyOtp,
} from "../services/otp.service.js";
import {
    startSimulation,
} from "../services/simulation.service.js";

/* ============================================================
   ERROR HELPER
   ============================================================ */

const createError = (
    statusCode,
    message
) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

/* ============================================================
   TOKEN HELPERS
   ============================================================ */

const generateRefreshAccessToken = async (
    userId
) => {
    const user = await User.findById(userId);

    if (!user) {
        throw createError(
            404,
            "User with id does not exist"
        );
    }

    if (!user.isActive) {
        throw createError(
            403,
            "User account is inactive"
        );
    }

    const accessToken =
        user.generateAccessToken();

    const refreshToken =
        user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({
        validateBeforeSave: false,
    });

    return {
        accessToken,
        refreshToken,
    };
};

/* ============================================================
   COOKIE OPTIONS

   Development:
   sameSite = "lax"

   Production:
   sameSite = "none"
   secure = true

   This is required because frontend and backend are hosted
   on different origins (Vercel + Render).
   ============================================================ */

const cookieOptions = {
    httpOnly: true,
    secure:
        process.env.NODE_ENV === "production",
    sameSite:
        process.env.NODE_ENV === "production"
            ? "none"
            : "lax",
};

const otpCookieOptions = {
    httpOnly: true,
    secure:
        process.env.NODE_ENV === "production",
    sameSite:
        process.env.NODE_ENV === "production"
            ? "none"
            : "lax",
    maxAge: 10 * 60 * 1000,
};

const passwordResetCookieOptions = {
    httpOnly: true,
    secure:
        process.env.NODE_ENV === "production",
    sameSite:
        process.env.NODE_ENV === "production"
            ? "none"
            : "lax",
    maxAge: 10 * 60 * 1000,
};

/* ============================================================
   OTP SESSION TOKEN
   ============================================================ */

const generateOtpSessionToken = (
    userId,
    purpose = "OTP_VERIFICATION"
) => {
    if (!process.env.OTP_TOKEN_SECRET) {
        throw new Error(
            "OTP_TOKEN_SECRET is not configured"
        );
    }

    return jwt.sign(
        {
            _id: userId,
            purpose,
        },
        process.env.OTP_TOKEN_SECRET,
        {
            expiresIn:
                process.env.OTP_TOKEN_EXPIRY ||
                "10m",
        }
    );
};

const verifyOtpSessionToken = (
    token,
    expectedPurpose
) => {
    try {
        if (!process.env.OTP_TOKEN_SECRET) {
            throw new Error(
                "OTP_TOKEN_SECRET is not configured"
            );
        }

        const decoded = jwt.verify(
            token,
            process.env.OTP_TOKEN_SECRET
        );

        if (
            decoded.purpose !==
            expectedPurpose
        ) {
            throw createError(
                401,
                "Invalid OTP verification session"
            );
        }

        return decoded;
    } catch (error) {
        if (error.statusCode) {
            throw error;
        }

        throw createError(
            401,
            "OTP verification session is invalid or expired"
        );
    }
};

/* ============================================================
   BACKWARD-COMPATIBLE OTP HELPERS
   ============================================================ */

const generateOtpVerificationToken = (
    userId
) => {
    return generateOtpSessionToken(
        userId,
        "OTP_VERIFICATION"
    );
};

const verifyOtpVerificationToken = (
    token
) => {
    return verifyOtpSessionToken(
        token,
        "OTP_VERIFICATION"
    );
};

/* ============================================================
   AUTHENTICATION COOKIES
   ============================================================ */

const setAuthenticationCookies = (
    res,
    accessToken,
    refreshToken
) => {
    return res
        .cookie(
            "accessToken",
            accessToken,
            cookieOptions
        )
        .cookie(
            "refreshToken",
            refreshToken,
            cookieOptions
        );
};

/* ============================================================
   REFRESH ACCESS TOKEN
   ============================================================ */

const refreshAccessToken = async (
    req,
    res
) => {
    const incomingRefreshToken =
        req.cookies?.refreshToken ||
        req.body?.refreshToken;

    if (!incomingRefreshToken) {
        throw createError(
            401,
            "Unauthorized request"
        );
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(
            decodedToken?._id
        ).select(
            "+refreshToken"
        );

        if (!user) {
            throw createError(
                401,
                "Invalid refresh token"
            );
        }

        if (!user.isActive) {
            throw createError(
                403,
                "User account is inactive"
            );
        }

        if (
            incomingRefreshToken !==
            user.refreshToken
        ) {
            throw createError(
                401,
                "Refresh token is expired or has already been used"
            );
        }

        const {
            accessToken,
            refreshToken,
        } =
            await generateRefreshAccessToken(
                user._id
            );

        return setAuthenticationCookies(
            res,
            accessToken,
            refreshToken
        )
            .status(200)
            .json({
                message:
                    "Access token refreshed successfully",
            });
    } catch (error) {
        if (error.statusCode) {
            throw error;
        }

        throw createError(
            401,
            "Invalid or expired refresh token"
        );
    }
};

/* ============================================================
   REGISTER USER
   ============================================================ */

const registerUser = async (
    req,
    res
) => {
    const {
        role,
        station,
        email,
        name,
        password,
    } = req.body || {};

    if (
        !name?.trim() ||
        !email?.trim() ||
        !role?.trim() ||
        !password?.trim()
    ) {
        throw createError(
            400,
            "Name, email, role and password are required"
        );
    }

    const validRoles = [
        "NCPOR Operator",
        "Station Manager",
        "Logistics Manager",
    ];

    if (!validRoles.includes(role)) {
        throw createError(
            400,
            "Invalid role"
        );
    }

    if (
        role !== "NCPOR Operator" &&
        !station
    ) {
        throw createError(
            400,
            "Station is required for this role"
        );
    }

    if (
        role === "NCPOR Operator" &&
        station
    ) {
        throw createError(
            400,
            "NCPOR Operator cannot be assigned to a station"
        );
    }

    const normalizedStation =
        station
            ?.trim()
            .toUpperCase();

    if (
        normalizedStation &&
        ![
            "MAITRI",
            "BHARATI",
        ].includes(
            normalizedStation
        )
    ) {
        throw createError(
            400,
            "Invalid station. Use MAITRI or BHARATI"
        );
    }

    const normalizedEmail =
        email
            .trim()
            .toLowerCase();

    const existedUser =
        await User.findOne({
            $or: [
                {
                    name: name.trim(),
                },
                {
                    email: normalizedEmail,
                },
            ],
        });

    if (existedUser) {
        throw createError(
            409,
            "User with this name or email already exists"
        );
    }

    const user =
        await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password,
            role,
            station:
                role ===
                "NCPOR Operator"
                    ? undefined
                    : normalizedStation,
            authProvider:
                "LOCAL",
        });

    const otpSessionToken =
        generateOtpVerificationToken(
            user._id
        );

    await sendOtp(user._id);

    return res
        .cookie(
            "otpVerificationToken",
            otpSessionToken,
            otpCookieOptions
        )
        .status(201)
        .json({
            message:
                "User registered successfully. OTP sent for verification.",
            requiresOtp: true,
            userId: user._id,
        });
};

/* ============================================================
   LOGIN
   ============================================================ */

const loginUser = async (
    req,
    res
) => {
    const {
        name,
        email,
        username,
        password,
    } = req.body || {};

    const loginName =
        name || username;

    if (
        (!loginName && !email) ||
        !password
    ) {
        throw createError(
            400,
            "Name/email and password are required"
        );
    }

    const conditions = [];

    if (loginName) {
        conditions.push({
            name: loginName.trim(),
        });
    }

    if (email) {
        conditions.push({
            email: email
                .trim()
                .toLowerCase(),
        });
    }

    const user =
        await User.findOne({
            $or: conditions,
        }).select(
            "+password"
        );

    if (!user) {
        throw createError(
            404,
            "User not found"
        );
    }

    if (!user.isActive) {
        throw createError(
            403,
            "User account is inactive"
        );
    }

    if (
        user.authProvider ===
            "GOOGLE" &&
        !user.password
    ) {
        throw createError(
            400,
            "This account uses Google login. Please continue with Google."
        );
    }

    const isPasswordValid =
        await user.isPasswordCorrect(
            password
        );

    if (!isPasswordValid) {
        throw createError(
            401,
            "Invalid credentials"
        );
    }

    const otpSessionToken =
        generateOtpVerificationToken(
            user._id
        );

    await sendOtp(user._id);

    return res
        .cookie(
            "otpVerificationToken",
            otpSessionToken,
            otpCookieOptions
        )
        .status(200)
        .json({
            message:
                "Credentials verified. OTP sent successfully.",
            requiresOtp: true,
        });
};

/* ============================================================
   VERIFY LOGIN OTP
   ============================================================ */

const verifyLoginOtp = async (
    req,
    res
) => {
    const otp =
        req.body?.otp;

    if (!otp) {
        throw createError(
            400,
            "OTP is required"
        );
    }

    const otpSessionToken =
        req.cookies?.otpVerificationToken ||
        req.body?.otpVerificationToken;

    if (!otpSessionToken) {
        throw createError(
            401,
            "OTP verification session not found"
        );
    }

    const decoded =
        verifyOtpVerificationToken(
            otpSessionToken
        );

    await verifyOtp(
        decoded._id,
        otp
    );

    const {
        accessToken,
        refreshToken,
    } =
        await generateRefreshAccessToken(
            decoded._id
        );

    const loggedInUser =
        await User.findById(
            decoded._id
        ).select(
            "-password -refreshToken -otp"
        );

    if (!loggedInUser) {
        throw createError(
            404,
            "User not found"
        );
    }

    /* ========================================================
       AUTO START SIMULATION FOR STATION MANAGER

       After successful OTP verification:
       - Start station telemetry simulation
       - Environment data
       - Energy data
       - Infrastructure data
       - Master alerts
       ======================================================== */

    if (
        loggedInUser.role ===
        "Station Manager"
    ) {
        if (
            loggedInUser.station
        ) {
            try {
                const simulationResult =
                    await startSimulation(
                        loggedInUser.station
                    );

                console.log(
                    "Station Manager simulation started:",
                    simulationResult
                );
            } catch (
                simulationError
            ) {
                console.error(
                    "Failed to auto-start station simulation:",
                    simulationError.message
                );
            }
        } else {
            console.warn(
                "Station Manager has no assigned station. Simulation was not started."
            );
        }
    }

    return res
        .cookie(
            "accessToken",
            accessToken,
            cookieOptions
        )
        .cookie(
            "refreshToken",
            refreshToken,
            cookieOptions
        )
        .clearCookie(
            "otpVerificationToken",
            otpCookieOptions
        )
        .status(200)
        .json({
            message:
                "OTP verified. User logged in successfully.",
            user: loggedInUser,
        });
};

/* ============================================================
   RESEND LOGIN OTP
   ============================================================ */

const resendLoginOtp = async (
    req,
    res
) => {
    const otpSessionToken =
        req.cookies?.otpVerificationToken ||
        req.body?.otpVerificationToken;

    if (!otpSessionToken) {
        throw createError(
            401,
            "OTP verification session not found"
        );
    }

    const decoded =
        verifyOtpVerificationToken(
            otpSessionToken
        );

    const result =
        await sendOtp(
            decoded._id
        );

    return res
        .status(200)
        .json({
            message:
                "OTP resent successfully",
            ...result,
        });
};

/* ============================================================
   FORGOT PASSWORD
   ============================================================ */

const forgotPassword = async (
    req,
    res
) => {
    const email =
        req.body?.email
            ?.trim()
            .toLowerCase();

    if (!email) {
        throw createError(
            400,
            "Email is required"
        );
    }

    const user =
        await User.findOne({
            email,
        });

    if (
        user &&
        user.isActive &&
        user.authProvider ===
            "LOCAL"
    ) {
        const passwordResetToken =
            generateOtpSessionToken(
                user._id,
                "PASSWORD_RESET"
            );

        await sendOtp(
            user._id
        );

        return res
            .cookie(
                "passwordResetToken",
                passwordResetToken,
                passwordResetCookieOptions
            )
            .status(200)
            .json({
                message:
                    "If the account exists, password recovery instructions and an OTP have been sent.",
                requiresOtp: true,
            });
    }

    return res
        .status(200)
        .json({
            message:
                "If the account exists, password recovery instructions and an OTP have been sent.",
            requiresOtp: true,
        });
};

/* ============================================================
   RESET PASSWORD USING OTP
   ============================================================ */

const resetPassword = async (
    req,
    res
) => {
    try {
        const {
            otp,
            newPassword,
        } = req.body || {};

        if (!otp?.trim()) {
            throw createError(
                400,
                "OTP is required"
            );
        }

        if (!newPassword) {
            throw createError(
                400,
                "New password is required"
            );
        }

        if (
            newPassword.length < 6
        ) {
            throw createError(
                400,
                "Password must contain at least 6 characters"
            );
        }

        const passwordResetToken =
            req.cookies?.passwordResetToken ||
            req.body?.passwordResetToken;

        if (!passwordResetToken) {
            throw createError(
                401,
                "Password reset session not found"
            );
        }

        const decoded =
            verifyOtpSessionToken(
                passwordResetToken,
                "PASSWORD_RESET"
            );

        const user =
            await User.findById(
                decoded._id
            ).select(
                "+password +refreshToken +otp"
            );

        if (!user) {
            throw createError(
                404,
                "User not found"
            );
        }

        if (!user.isActive) {
            throw createError(
                403,
                "User account is inactive"
            );
        }

        if (
            user.authProvider !==
            "LOCAL"
        ) {
            throw createError(
                400,
                "Password reset is not available for Google-authenticated accounts"
            );
        }

        await verifyOtp(
            user._id,
            otp
        );

        user.password =
            newPassword;

        user.refreshToken =
            undefined;

        await user.save({
            validateModifiedOnly:
                true,
        });

        return res
            .clearCookie(
                "passwordResetToken",
                passwordResetCookieOptions
            )
            .status(200)
            .json({
                message:
                    "Password reset successfully. Please login again.",
            });
    } catch (error) {
        console.error(
            "Reset password error:",
            error
        );

        return res
            .status(
                error?.statusCode ||
                    500
            )
            .json({
                message:
                    error?.message ||
                    "Failed to reset password",
            });
    }
};

/* ============================================================
   UPDATE PASSWORD
   ============================================================ */

const updatePassword = async (
    req,
    res
) => {
    const {
        currentPassword,
        newPassword,
    } = req.body || {};

    if (!currentPassword) {
        throw createError(
            400,
            "Current password is required"
        );
    }

    if (!newPassword) {
        throw createError(
            400,
            "New password is required"
        );
    }

    if (
        newPassword.length < 6
    ) {
        throw createError(
            400,
            "New password must contain at least 6 characters"
        );
    }

    if (
        currentPassword ===
        newPassword
    ) {
        throw createError(
            400,
            "New password must be different from the current password"
        );
    }

    const user =
        await User.findById(
            req.user._id
        ).select(
            "+password +refreshToken"
        );

    if (!user) {
        throw createError(
            404,
            "User not found"
        );
    }

    if (!user.isActive) {
        throw createError(
            403,
            "User account is inactive"
        );
    }

    if (
        user.authProvider !==
        "LOCAL"
    ) {
        throw createError(
            400,
            "Password update is not available for Google-authenticated accounts"
        );
    }

    const isCurrentPasswordValid =
        await user.isPasswordCorrect(
            currentPassword
        );

    if (!isCurrentPasswordValid) {
        throw createError(
            401,
            "Current password is incorrect"
        );
    }

    user.password =
        newPassword;

    user.refreshToken =
        undefined;

    await user.save();

    return res
        .clearCookie(
            "accessToken",
            cookieOptions
        )
        .clearCookie(
            "refreshToken",
            cookieOptions
        )
        .status(200)
        .json({
            message:
                "Password updated successfully. Please login again.",
        });
};

/* ============================================================
   GOOGLE OAUTH
   ============================================================ */

const googleOAuthCallback =
    async (
        req,
        res
    ) => {
        try {
            const user =
                req.user;

            if (!user) {
                throw createError(
                    401,
                    "Google authentication failed"
                );
            }

            if (!user.isActive) {
                throw createError(
                    403,
                    "User account is inactive"
                );
            }

            const otpSessionToken =
                generateOtpVerificationToken(
                    user._id
                );

            await sendOtp(
                user._id
            );

            return res
                .cookie(
                    "otpVerificationToken",
                    otpSessionToken,
                    otpCookieOptions
                )
                .redirect(
                    `${process.env.FRONTEND_URL}/verify-otp`
                );
        } catch (
            error
        ) {
            console.error(
                "Google OAuth Error:",
                error
            );

            return res.redirect(
                `${process.env.FRONTEND_URL}/login?error=google_auth_failed`
            );
        }
    };

/* ============================================================
   LOGOUT
   ============================================================ */

const logoutUser = async (
    req,
    res
) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,
            },
        }
    );

    return res
        .clearCookie(
            "accessToken",
            cookieOptions
        )
        .clearCookie(
            "refreshToken",
            cookieOptions
        )
        .clearCookie(
            "otpVerificationToken",
            otpCookieOptions
        )
        .clearCookie(
            "passwordResetToken",
            passwordResetCookieOptions
        )
        .status(200)
        .json({
            message:
                "User logged out successfully",
        });
};

/* ============================================================
   GET USER BY ID
   ============================================================ */

const getUserById = async (
    req,
    res
) => {
    const {
        id,
    } = req.params;

    const user =
        await User.findById(
            id
        ).select(
            "-password -refreshToken -otp"
        );

    if (!user) {
        throw createError(
            404,
            "User not found"
        );
    }

    return res
        .status(200)
        .json({
            message:
                "User fetched successfully",
            user,
        });
};

/* ============================================================
   GET CURRENT USER
   ============================================================ */

const getCurrentUser = async (
    req,
    res
) => {
    const user =
        await User.findById(
            req.user._id
        ).select(
            "-password -refreshToken -otp"
        );

    if (!user) {
        throw createError(
            404,
            "User not found"
        );
    }

    return res
        .status(200)
        .json({
            message:
                "Current user fetched successfully",
            user,
        });
};

/* ============================================================
   EXPORTS
   ============================================================ */

export {
    loginUser,
    logoutUser,
    registerUser,
    getUserById,
    getCurrentUser,
    refreshAccessToken,
    googleOAuthCallback,
    verifyLoginOtp,
    resendLoginOtp,
    forgotPassword,
    resetPassword,
    updatePassword,
};