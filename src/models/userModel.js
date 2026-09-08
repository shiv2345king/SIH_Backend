import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [
                2,
                "Name must contain at least 2 characters"
            ],
            maxlength: [
                100,
                "Name cannot exceed 100 characters"
            ]
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            minlength: [
                6,
                "Password must contain at least 6 characters"
            ],
            select: false
        },

        role: {
            type: String,
            enum: [
                "NCPOR Operator",
                "Station Manager",
                "Logistics Manager"
            ],
            required: [true, "Role is required"]
        },

        station: {
            type: String,
            enum: [
                "MAITRI",
                "BHARATI"
            ],
            default: undefined
        },

        authProvider: {
            type: String,
            enum: [
                "LOCAL",
                "GOOGLE"
            ],
            default: "LOCAL"
        },

        providerId: {
            type: String,
            sparse: true,
            index: true
        },

        isActive: {
            type: Boolean,
            default: true
        },

        isEmailVerified: {
            type: Boolean,
            default: false
        },

        otp: {
            code: {
                type: String,
                select: false,
                default: null
            },

            expiresAt: {
                type: Date,
                select: false,
                default: null
            },

            attempts: {
                type: Number,
                select: false,
                default: 0
            },

            lastSentAt: {
                type: Date,
                select: false,
                default: null
            }
        },

        refreshToken: {
            type: String,
            select: false
        }
    },
    {
        timestamps: true
    }
);

userSchema.pre(
    "validate",
    function () {
        if (
            this.role === "NCPOR Operator" &&
            this.station
        ) {
            throw new Error(
                "NCPOR Operator cannot be assigned to a station"
            );
        }

        if (
            (
                this.role === "Station Manager" ||
                this.role === "Logistics Manager"
            ) &&
            !this.station
        ) {
            throw new Error(
                `${this.role} must be assigned to a station`
            );
        }

        if (
            this.authProvider === "LOCAL" &&
            !this.password
        ) {
            throw new Error(
                "Password is required for local authentication"
            );
        }
    }
);

userSchema.pre(
    "save",
    async function () {
        if (
            !this.isModified("password")
        ) {
            return;
        }

        if (!this.password) {
            return;
        }

        this.password =
            await bcrypt.hash(
                this.password,
                10
            );
    }
);

userSchema.methods.isPasswordCorrect =
    async function (password) {
        if (!this.password) {
            return false;
        }

        return await bcrypt.compare(
            password,
            this.password
        );
    };

userSchema.methods.generateAccessToken =
    function () {
        if (
            !process.env.ACCESS_TOKEN_SECRET
        ) {
            throw new Error(
                "ACCESS_TOKEN_SECRET is not configured"
            );
        }

        if (
            !process.env.ACCESS_TOKEN_EXPIRY
        ) {
            throw new Error(
                "ACCESS_TOKEN_EXPIRY is not configured"
            );
        }

        return jwt.sign(
            {
                _id: this._id,
                name: this.name,
                email: this.email,
                role: this.role,
                station: this.station
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn:
                    process.env.ACCESS_TOKEN_EXPIRY
            }
        );
    };

userSchema.methods.generateRefreshToken =
    function () {
        if (
            !process.env.REFRESH_TOKEN_SECRET
        ) {
            throw new Error(
                "REFRESH_TOKEN_SECRET is not configured"
            );
        }

        if (
            !process.env.REFRESH_TOKEN_EXPIRY
        ) {
            throw new Error(
                "REFRESH_TOKEN_EXPIRY is not configured"
            );
        }

        return jwt.sign(
            {
                _id: this._id
            },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn:
                    process.env.REFRESH_TOKEN_EXPIRY
            }
        );
    };

const User = model(
    "User",
    userSchema
);

export default User;