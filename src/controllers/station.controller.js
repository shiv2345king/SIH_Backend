import Station from "../models/stationModel.js";

const createError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

/*
    GET ALL STATIONS

    Only NCPOR Operator can access all stations.
*/
const getAllStations = async (req, res) => {
    const stations = await Station.find()
        .sort({ name: 1 });

    return res.status(200).json({
        message: "Stations fetched successfully",
        count: stations.length,
        stations
    });
};


/*
    GET STATION BY CODE

    Example:
    GET /api/v1/stations/MAITRI

    NCPOR Operator:
        Can access any station.

    Station Manager / Logistics Manager:
        Can access only their assigned station.
*/
const getStationByCode = async (req, res) => {
    const { code } = req.params;

    const stationCode = code.trim().toUpperCase();

    const station = await Station.findOne({
        code: stationCode
    });

    if (!station) {
        throw createError(
            404,
            "Station not found"
        );
    }

    /*
        NCPOR Operator has global access.
    */
    if (req.user.role === "NCPOR Operator") {
        return res.status(200).json({
            message: "Station fetched successfully",
            station
        });
    }

    /*
        Station-bound users can only access
        their assigned station.
    */
    if (req.user.station !== station.code) {
        throw createError(
            403,
            "You do not have access to this station"
        );
    }

    return res.status(200).json({
        message: "Station fetched successfully",
        station
    });
};


/*
    CREATE STATION

    Only NCPOR Operator can create stations.
*/
const createStation = async (req, res) => {
    const {
        name,
        code,
        location
    } = req.body || {};

    if (!name || !code || !location) {
        throw createError(
            400,
            "Name, code and location are required"
        );
    }

    const normalizedName =
        name.trim().toUpperCase();

    const normalizedCode =
        code.trim().toUpperCase();

    /*
        Only our supported stations.
    */
    const validStations = [
        "MAITRI",
        "BHARATI"
    ];

    if (!validStations.includes(normalizedName)) {
        throw createError(
            400,
            "Invalid station name"
        );
    }

    if (!validStations.includes(normalizedCode)) {
        throw createError(
            400,
            "Invalid station code"
        );
    }

    if (normalizedName !== normalizedCode) {
        throw createError(
            400,
            "Station name and station code must match"
        );
    }

    if (
        location.type !== "Point" ||
        !Array.isArray(location.coordinates) ||
        location.coordinates.length !== 2
    ) {
        throw createError(
            400,
            "Location must be a GeoJSON Point with [longitude, latitude]"
        );
    }

    const existingStation = await Station.findOne({
        $or: [
            { name: normalizedName },
            { code: normalizedCode }
        ]
    });

    if (existingStation) {
        throw createError(
            409,
            "Station already exists"
        );
    }

    const station = await Station.create({
        name: normalizedName,
        code: normalizedCode,
        location: {
            type: "Point",
            coordinates: location.coordinates
        }
    });

    return res.status(201).json({
        message: "Station created successfully",
        station
    });
};


/*
    UPDATE STATION

    Only NCPOR Operator can update station information.
*/
const updateStation = async (req, res) => {
    const { code } = req.params;

    const stationCode =
        code.trim().toUpperCase();

    const station = await Station.findOne({
        code: stationCode
    });

    if (!station) {
        throw createError(
            404,
            "Station not found"
        );
    }

    const {
        location,
        isActive
    } = req.body || {};

    const updateData = {};

    if (location !== undefined) {
        if (
            location.type !== "Point" ||
            !Array.isArray(location.coordinates) ||
            location.coordinates.length !== 2
        ) {
            throw createError(
                400,
                "Location must be a GeoJSON Point with [longitude, latitude]"
            );
        }

        updateData.location = {
            type: "Point",
            coordinates: location.coordinates
        };
    }

    if (isActive !== undefined) {
        if (typeof isActive !== "boolean") {
            throw createError(
                400,
                "isActive must be a boolean"
            );
        }

        updateData.isActive = isActive;
    }

    if (Object.keys(updateData).length === 0) {
        throw createError(
            400,
            "No valid fields provided for update"
        );
    }

    const updatedStation =
        await Station.findByIdAndUpdate(
            station._id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

    return res.status(200).json({
        message: "Station updated successfully",
        station: updatedStation
    });
};


/*
    DELETE / DEACTIVATE STATION

    We don't physically delete the station.

    Instead, we deactivate it.

    This is safer because vehicles, telemetry,
    alerts and geofence events may reference it.
*/
const deactivateStation = async (req, res) => {
    const { code } = req.params;

    const stationCode =
        code.trim().toUpperCase();

    const station =
        await Station.findOneAndUpdate(
            { code: stationCode },
            {
                $set: {
                    isActive: false
                }
            },
            {
                new: true
            }
        );

    if (!station) {
        throw createError(
            404,
            "Station not found"
        );
    }

    return res.status(200).json({
        message: "Station deactivated successfully",
        station
    });
};


export {
    getAllStations,
    getStationByCode,
    createStation,
    updateStation,
    deactivateStation
};