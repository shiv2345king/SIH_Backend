import { Schema, model } from "mongoose";

const requirementSchema = new Schema(
    {
        requirementNumber: {
            type: String,
            required: [true, "Requirement number is required"],
            unique: true,
            trim: true,
            uppercase: true,
        },

        title: {
            type: String,
            required: [true, "Requirement title is required"],
            trim: true,
        },

        description: {
            type: String,
            trim: true,
            default: "",
        },

        category: {
            type: String,
            required: [true, "Requirement category is required"],
            enum: [
                "Food",
                "Medical",
                "Scientific Equipment",
                "Fuel",
                "Maintenance",
                "General",
            ],
            trim: true,
        },

        quantity: {
            type: Number,
            required: [true, "Requirement quantity is required"],
            min: [1, "Quantity must be at least 1"],
        },

        unit: {
            type: String,
            required: [true, "Requirement unit is required"],
            enum: [
                "unit",
                "kg",
                "g",
                "litre",
                "box",
                "packet",
            ],
            default: "unit",
            trim: true,
            lowercase: true,
        },

        priority: {
            type: String,
            enum: [
                "LOW",
                "MEDIUM",
                "HIGH",
                "CRITICAL",
            ],
            default: "MEDIUM",
            uppercase: true,
        },

        station: {
            type: Schema.Types.ObjectId,
            ref: "Station",
            required: [true, "Station is required"],
        },

        status: {
            type: String,
            enum: [
                "PENDING",
                "PROCESSING",
                "FULFILLED",
                "REJECTED",
                "CANCELLED",
            ],
            default: "PENDING",
        },

        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Created by user is required"],
        },

        processedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        processedAt: {
            type: Date,
            default: null,
        },

        fulfilledAt: {
            type: Date,
            default: null,
        },

        rejectionReason: {
            type: String,
            trim: true,
            default: "",
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

/* ============================================================
   INDEXES
   ============================================================ */

/*
 * Requirement number must be unique.
 * The unique:true field already creates a unique index,
 * so an additional requirementNumber index is unnecessary.
 */

requirementSchema.index({
    station: 1,
    createdAt: -1,
});

requirementSchema.index({
    station: 1,
    status: 1,
});

requirementSchema.index({
    createdBy: 1,
    createdAt: -1,
});

requirementSchema.index({
    isActive: 1,
    createdAt: -1,
});

/* ============================================================
   MODEL
   ============================================================ */

const Requirement = model(
    "Requirement",
    requirementSchema
);

export default Requirement;