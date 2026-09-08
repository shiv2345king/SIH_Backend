import { Schema, model } from "mongoose";

const logisticsSchema = new Schema(
    {
        shipmentNumber: {
            type: String,
            required: [
                true,
                "Shipment number is required"
            ],
            unique: true,
            uppercase: true,
            trim: true
        },

        requirement: {
            type: Schema.Types.ObjectId,
            ref: "Requirement",
            required: [
                true,
                "Requirement is required"
            ]
        },

        station: {
            type: Schema.Types.ObjectId,
            ref: "Station",
            required: [
                true,
                "Station is required"
            ]
        },

        title: {
            type: String,
            required: [
                true,
                "Shipment title is required"
            ],
            trim: true
        },

        description: {
            type: String,
            trim: true,
            default: ""
        },

        category: {
            type: String,
            enum: [
                "Food",
                "Medical",
                "Scientific Equipment",
                "Fuel",
                "Maintenance",
                "General"
            ],
            required: [
                true,
                "Shipment category is required"
            ]
        },

        quantity: {
            type: Number,
            required: [
                true,
                "Shipment quantity is required"
            ],
            min: [
                1,
                "Quantity must be at least 1"
            ]
        },

        unit: {
            type: String,
            enum: [
                "kg",
                "g",
                "litre",
                "unit",
                "box",
                "packet"
            ],
            default: "unit"
        },

        status: {
            type: String,
            enum: [
                "PREPARING",
                "IN_TRANSIT",
                "ARRIVED",
                "RECEIVED",
                "CANCELLED"
            ],
            default: "PREPARING"
        },

        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [
                true,
                "Shipment creator is required"
            ]
        },

        dispatchedAt: {
            type: Date,
            default: null
        },

        arrivedAt: {
            type: Date,
            default: null
        },

        receivedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        receivedAt: {
            type: Date,
            default: null
        },

        receiptRemarks: {
            type: String,
            trim: true,
            default: ""
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

logisticsSchema.index({
    station: 1,
    status: 1
});

logisticsSchema.index({
    requirement: 1
});

const Logistics = model(
    "Logistics",
    logisticsSchema
);

export default Logistics;