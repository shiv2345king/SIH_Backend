import { Schema, model } from "mongoose";

const stationSchema = new Schema(
    {
        name: {
            type: String,
            enum: ["MAITRI", "BHARATI"],
            required: [true, "Station name is required"],
            unique: true,
            uppercase: true,
            trim: true
        },

        code: {
            type: String,
            enum: ["MAITRI", "BHARATI"],
            required: [true, "Station code is required"],
            unique: true,
            uppercase: true,
            trim: true
        },

        location: {
            type: {
                type: String,
                enum: ["Point"],
                required: [true, "Location type is required"]
            },

            coordinates: {
                type: [Number],
                required: [true, "Station coordinates are required"],
                validate: {
                    validator: function (coordinates) {
                        return (
                            coordinates.length === 2 &&
                            coordinates[0] >= -180 &&
                            coordinates[0] <= 180 &&
                            coordinates[1] >= -90 &&
                            coordinates[1] <= 90
                        );
                    },
                    message:
                        "Coordinates must be [longitude, latitude]"
                }
            }
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

stationSchema.index({
    location: "2dsphere"
});

const Station = model("Station", stationSchema);

export default Station;