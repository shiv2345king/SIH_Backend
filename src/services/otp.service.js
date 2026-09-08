import crypto from "crypto";
import User from "../models/userModel.js";

const OTP_EXPIRY_MINUTES = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const MAX_OTP_ATTEMPTS = 5;

const generateOtp = () => {
    return crypto
        .randomInt(0, 1000000)
        .toString()
        .padStart(6, "0");
};

const hashOtp = (otp) => {
    return crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");
};

const sendOtp = async (userId) => {
    const user = await User.findById(userId).select(
        "+otp.code +otp.expiresAt +otp.attempts +otp.lastSentAt"
    );

    if (!user) {
        const error = new Error(
            "User not found"
        );
        error.statusCode = 404;
        throw error;
    }

    if (!user.isActive) {
        const error = new Error(
            "User account is inactive"
        );
        error.statusCode = 403;
        throw error;
    }

    const now = Date.now();

    if (user.otp.lastSentAt) {
        const elapsed =
            (now -
                user.otp.lastSentAt.getTime()) /
            1000;

        if (
            elapsed <
            OTP_RESEND_COOLDOWN_SECONDS
        ) {
            const remaining = Math.ceil(
                OTP_RESEND_COOLDOWN_SECONDS -
                    elapsed
            );

            const error = new Error(
                `Please wait ${remaining} seconds before requesting another OTP`
            );

            error.statusCode = 429;
            throw error;
        }
    }

    const otp = generateOtp();
    const hashedOtp = hashOtp(otp);

    user.otp.code = hashedOtp;
    user.otp.expiresAt = new Date(
        now +
            OTP_EXPIRY_MINUTES *
                60 *
                1000
    );
    user.otp.attempts = 0;
    user.otp.lastSentAt = new Date();

    await user.save({
        validateBeforeSave: false
    });

    try {
        const response = await fetch(
            "https://api.brevo.com/v3/smtp/email",
            {
                method: "POST",
                headers: {
                    "accept":
                        "application/json",
                    "api-key":
                        process.env.BREVO_API_KEY,
                    "content-type":
                        "application/json"
                },
                body: JSON.stringify({
                    sender: {
                        name:
                            process.env
                                .BREVO_SENDER_NAME,
                        email:
                            process.env
                                .BREVO_SENDER_EMAIL
                    },
                    to: [
                        {
                            email:
                                user.email,
                            name:
                                user.name
                        }
                    ],
                    subject:
                        "OTP Verification - Antarctica Monitoring System",
                    htmlContent: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                            <h2>OTP Verification</h2>

                            <p>Hello ${user.name},</p>

                            <p>
                                Your verification code for the
                                Antarctica Monitoring System is:
                            </p>

                            <h1 style="letter-spacing: 8px;">
                                ${otp}
                            </h1>

                            <p>
                                This OTP is valid for
                                ${OTP_EXPIRY_MINUTES} minutes.
                            </p>

                            <p>
                                Do not share this OTP with anyone.
                            </p>

                            <p>
                                If you did not request this OTP,
                                you can safely ignore this email.
                            </p>
                        </div>
                    `
                })
            }
        );

        if (!response.ok) {
            const errorData =
                await response.text();

            console.error(
                "Brevo API error:",
                errorData
            );

            throw new Error(
                "Failed to send OTP"
            );
        }
    } catch (error) {
        user.otp.code = null;
        user.otp.expiresAt = null;
        user.otp.attempts = 0;
        user.otp.lastSentAt = null;

        await user.save({
            validateBeforeSave: false
        });

        throw error;
    }

    return {
        message:
            "OTP sent successfully",
        expiresIn:
            OTP_EXPIRY_MINUTES * 60
    };
};

const verifyOtp = async (
    userId,
    otp
) => {
    const user = await User.findById(userId).select(
        "+otp.code +otp.expiresAt +otp.attempts +otp.lastSentAt"
    );

    if (!user) {
        const error = new Error(
            "User not found"
        );
        error.statusCode = 404;
        throw error;
    }

    if (!user.isActive) {
        const error = new Error(
            "User account is inactive"
        );
        error.statusCode = 403;
        throw error;
    }

    if (!otp) {
        const error = new Error(
            "OTP is required"
        );
        error.statusCode = 400;
        throw error;
    }

    if (!/^\d{6}$/.test(otp.toString())) {
        const error = new Error(
            "OTP must contain 6 digits"
        );
        error.statusCode = 400;
        throw error;
    }

    if (!user.otp.code) {
        const error = new Error(
            "No active OTP found"
        );
        error.statusCode = 400;
        throw error;
    }

    if (
        !user.otp.expiresAt ||
        user.otp.expiresAt < new Date()
    ) {
        user.otp.code = null;
        user.otp.expiresAt = null;
        user.otp.attempts = 0;

        await user.save({
            validateBeforeSave: false
        });

        const error = new Error(
            "OTP has expired"
        );
        error.statusCode = 401;
        throw error;
    }

    if (
        user.otp.attempts >=
        MAX_OTP_ATTEMPTS
    ) {
        user.otp.code = null;
        user.otp.expiresAt = null;
        user.otp.attempts = 0;

        await user.save({
            validateBeforeSave: false
        });

        const error = new Error(
            "Maximum OTP attempts exceeded. Please request a new OTP"
        );

        error.statusCode = 429;
        throw error;
    }

    const hashedOtp = hashOtp(
        otp.toString()
    );

    if (
        hashedOtp !==
        user.otp.code
    ) {
        user.otp.attempts += 1;

        await user.save({
            validateBeforeSave: false
        });

        const remaining =
            MAX_OTP_ATTEMPTS -
            user.otp.attempts;

        const error = new Error(
            `Invalid OTP. ${remaining} attempts remaining`
        );

        error.statusCode = 401;
        throw error;
    }

    user.otp.code = null;
    user.otp.expiresAt = null;
    user.otp.attempts = 0;
    user.otp.lastSentAt = null;
    user.isEmailVerified = true;

    await user.save({
        validateBeforeSave: false
    });

    return {
        message:
            "OTP verified successfully",
        user
    };
};

export {
    generateOtp,
    sendOtp,
    verifyOtp
};