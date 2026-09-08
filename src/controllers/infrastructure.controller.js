import Infrastructure from "../models/infrastructureModel.js";

const createError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const canAccessStation = (user, stationId) => {
    // NCPOR Operator can access all stations
    if (user.role === "NCPOR Operator") {
        return true;
    }

    // Station Manager can access only assigned station
    if (!user.station) {
        return false;
    }

    return (
        user.station
            .trim()
            .toUpperCase() ===
        stationId
            .trim()
            .toUpperCase()
    );
};

/*
    CREATE INFRASTRUCTURE
    Station Manager only.
*/
const createInfrastructure = async (req, res) => {
    try {
        if (req.user.role !== "Station Manager") {
            throw createError(
                403,
                "Only Station Manager can create infrastructure data"
            );
        }

        const data = req.body || {};

        const stationId = data.station_id
            ?.trim()
            .toUpperCase();

        if (!stationId) {
            throw createError(
                400,
                "station_id is required"
            );
        }

        if (
            !canAccessStation(
                req.user,
                stationId
            )
        ) {
            throw createError(
                403,
                "You do not have access to this station"
            );
        }

        if (!data.station_name) {
            throw createError(
                400,
                "station_name is required"
            );
        }

        if (
            !data.modules ||
            !data.modules.living_quarters ||
            !data.modules.main_lab ||
            !data.modules.storage_module
        ) {
            throw createError(
                400,
                "Infrastructure modules data is required"
            );
        }

        if (
            !data.systems ||
            !data.systems.hvac_main ||
            !data.systems.hvac_backup
        ) {
            throw createError(
                400,
                "Infrastructure systems data is required"
            );
        }

        if (!data.structural_health) {
            throw createError(
                400,
                "Structural health data is required"
            );
        }

        const infrastructure =
            await Infrastructure.create({
                ...data,
                station_id: stationId
            });

        return res
            .status(201)
            .json({
                message:
                    "Infrastructure data created successfully",
                data: infrastructure
            });
    } catch (error) {
        console.error(
            "Create infrastructure error:",
            error
        );

        return res
            .status(error.statusCode || 500)
            .json({
                message:
                    error.message ||
                    "Failed to create infrastructure data"
            });
    }
};

/*
    GET LATEST INFRASTRUCTURE
*/
const getLatestInfrastructure = async (req, res) => {
    try {
        const requestedStation =
            req.query.station_id;

        let filter = {};

        if (requestedStation) {
            const stationId =
                requestedStation
                    .trim()
                    .toUpperCase();

            if (
                !canAccessStation(
                    req.user,
                    stationId
                )
            ) {
                throw createError(
                    403,
                    "You do not have access to this station"
                );
            }

            filter.station_id = stationId;
        } else if (
            req.user.role !==
            "NCPOR Operator"
        ) {
            if (!req.user.station) {
                throw createError(
                    403,
                    "User is not assigned to any station"
                );
            }

            filter.station_id =
                req.user.station
                    .trim()
                    .toUpperCase();
        }

        const infrastructure =
            await Infrastructure
                .findOne(filter)
                .sort({
                    timestamp: -1
                })
                .lean();

        if (!infrastructure) {
            throw createError(
                404,
                "Infrastructure data not found"
            );
        }

        return res
            .status(200)
            .json({
                message:
                    "Latest infrastructure data fetched successfully",
                data: infrastructure
            });
    } catch (error) {
        console.error(
            "Get infrastructure error:",
            error
        );

        return res
            .status(error.statusCode || 500)
            .json({
                message:
                    error.message ||
                    "Failed to fetch infrastructure data"
            });
    }
};

/*
    GET INFRASTRUCTURE HISTORY
*/
const getInfrastructureHistory = async (
    req,
    res
) => {
    try {
        const requestedStation =
            req.query.station_id;

        const filter = {};

        if (requestedStation) {
            const stationId =
                requestedStation
                    .trim()
                    .toUpperCase();

            if (
                !canAccessStation(
                    req.user,
                    stationId
                )
            ) {
                throw createError(
                    403,
                    "You do not have access to this station"
                );
            }

            filter.station_id = stationId;
        } else if (
            req.user.role !==
            "NCPOR Operator"
        ) {
            if (!req.user.station) {
                throw createError(
                    403,
                    "User is not assigned to any station"
                );
            }

            filter.station_id =
                req.user.station
                    .trim()
                    .toUpperCase();
        }

        let limit =
            Number(req.query.limit) || 100;

        limit = Math.max(
            1,
            Math.min(limit, 500)
        );

        const infrastructure =
            await Infrastructure
                .find(filter)
                .sort({
                    timestamp: -1
                })
                .limit(limit)
                .lean();

        return res
            .status(200)
            .json({
                message:
                    "Infrastructure history fetched successfully",
                count: infrastructure.length,
                infrastructure
            });
    } catch (error) {
        console.error(
            "Get infrastructure history error:",
            error
        );

        return res
            .status(error.statusCode || 500)
            .json({
                message:
                    error.message ||
                    "Failed to fetch infrastructure history"
            });
    }
};

/*
    UPDATE INFRASTRUCTURE
    Station Manager only.
*/
const updateInfrastructure = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const infrastructure =
            await Infrastructure.findById(id);

        if (!infrastructure) {
            throw createError(
                404,
                "Infrastructure data not found"
            );
        }

        if (
            req.user.role !==
            "Station Manager"
        ) {
            throw createError(
                403,
                "Only Station Manager can update infrastructure data"
            );
        }

        if (
            !canAccessStation(
                req.user,
                infrastructure.station_id
            )
        ) {
            throw createError(
                403,
                "You do not have access to this station"
            );
        }

        const allowedFields = [
            "timestamp",
            "polling_interval_seconds",
            "modules",
            "systems",
            "airlocks",
            "structural_health",
            "alerts_local",
            "system_health_score",
            "system_health_trend"
        ];

        let updated = false;

        for (const field of allowedFields) {
            if (
                req.body[field] !==
                undefined
            ) {
                infrastructure[field] =
                    req.body[field];

                updated = true;
            }
        }

        if (!updated) {
            throw createError(
                400,
                "No valid fields provided for update"
            );
        }

        await infrastructure.save();

        return res
            .status(200)
            .json({
                message:
                    "Infrastructure data updated successfully",
                data: infrastructure
            });
    } catch (error) {
        console.error(
            "Update infrastructure error:",
            error
        );

        return res
            .status(error.statusCode || 500)
            .json({
                message:
                    error.message ||
                    "Failed to update infrastructure data"
            });
    }
};

export {
    createInfrastructure,
    getLatestInfrastructure,
    getInfrastructureHistory,
    updateInfrastructure
};