import Energy from "../models/energyModel.js";

const createError = (
    statusCode,
    message
) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const canAccessStation = (
    user,
    stationId
) => {
    /*
     * NCPOR Operator
     * Global access
     */
    if (
        user.role ===
        "NCPOR Operator"
    ) {
        return true;
    }

    /*
     * Logistics Manager
     * Centralized role.
     * No station assignment required.
     */
    if (
        user.role ===
        "Logistics Manager"
    ) {
        return true;
    }

    /*
     * Station Manager
     * Can access only assigned station.
     */
    if (
        user.role ===
        "Station Manager"
    ) {
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
    }

    return false;
};

/*
 * CREATE ENERGY DATA
 *
 * Station Manager only.
 */
const createEnergy =
    async (req, res) => {
        try {
            const {
                station_id,
                timestamp,
                polling_interval_seconds,
                generators,
                fuel_system,
                power_distribution,
                battery_system,
                renewable_energy,
                interconnections,
                system_health_score,
                system_health_trend
            } = req.body || {};

            if (!station_id) {
                throw createError(
                    400,
                    "station_id is required"
                );
            }

            const normalizedStationId =
                station_id
                    .trim()
                    .toUpperCase();

            if (
                req.user.role ===
                "Station Manager" &&
                !canAccessStation(
                    req.user,
                    normalizedStationId
                )
            ) {
                throw createError(
                    403,
                    "You do not have access to this station"
                );
            }

            if (
                !generators ||
                !generators.gen_1 ||
                !generators.gen_2
            ) {
                throw createError(
                    400,
                    "Generators data is required"
                );
            }

            if (!fuel_system) {
                throw createError(
                    400,
                    "Fuel system data is required"
                );
            }

            if (!power_distribution) {
                throw createError(
                    400,
                    "Power distribution data is required"
                );
            }

            if (!battery_system) {
                throw createError(
                    400,
                    "Battery system data is required"
                );
            }

            const energy =
                await Energy.create({
                    station_id:
                        normalizedStationId,

                    timestamp:
                        timestamp ||
                        new Date(),

                    polling_interval_seconds:
                        polling_interval_seconds ||
                        2,

                    generators,

                    fuel_system,

                    power_distribution,

                    battery_system,

                    renewable_energy,

                    interconnections,

                    system_health_score,

                    system_health_trend
                });

            return res
                .status(201)
                .json({
                    message:
                        "Energy data created successfully",

                    data:
                        energy
                });
        } catch (error) {
            console.error(
                "Create energy error:",
                error
            );

            return res
                .status(
                    error.statusCode ||
                    500
                )
                .json({
                    message:
                        error.message ||
                        "Failed to create energy data"
                });
        }
    };

/*
 * GET LATEST ENERGY DATA
 *
 * Used directly by the frontend.
 */
const getLatestEnergy =
    async (req, res) => {
        try {
            const requestedStation =
                req.query.station_id;

            let filter = {};

            /*
             * Station was explicitly selected.
             */
            if (
                requestedStation
            ) {
                const normalizedStationId =
                    requestedStation
                        .trim()
                        .toUpperCase();

                if (
                    !canAccessStation(
                        req.user,
                        normalizedStationId
                    )
                ) {
                    throw createError(
                        403,
                        "You do not have access to this station"
                    );
                }

                filter.station_id =
                    normalizedStationId;
            }

            /*
             * Station Manager without
             * station_id in query.
             */
            else if (
                req.user.role ===
                "Station Manager"
            ) {
                if (
                    !req.user.station
                ) {
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

            /*
             * NCPOR Operator and
             * Logistics Manager can
             * access global data.
             */
            const energy =
                await Energy
                    .findOne(filter)
                    .sort({
                        timestamp: -1
                    })
                    .lean();

            if (!energy) {
                throw createError(
                    404,
                    "Energy data not found"
                );
            }

            /*
             * IMPORTANT:
             *
             * Frontend does:
             *
             * const energyData = res.data;
             *
             * Therefore return energy
             * inside data.
             */
            return res
                .status(200)
                .json({
                    message:
                        "Latest energy data fetched successfully",

                    data:
                        energy
                });
        } catch (error) {
            console.error(
                "Get latest energy error:",
                error
            );

            return res
                .status(
                    error.statusCode ||
                    500
                )
                .json({
                    message:
                        error.message ||
                        "Failed to fetch energy data"
                });
        }
    };

/*
 * GET ENERGY HISTORY
 */
const getEnergyHistory =
    async (req, res) => {
        try {
            const requestedStation =
                req.query.station_id;

            const filter = {};

            if (
                requestedStation
            ) {
                const normalizedStationId =
                    requestedStation
                        .trim()
                        .toUpperCase();

                if (
                    !canAccessStation(
                        req.user,
                        normalizedStationId
                    )
                ) {
                    throw createError(
                        403,
                        "You do not have access to this station"
                    );
                }

                filter.station_id =
                    normalizedStationId;
            }

            else if (
                req.user.role ===
                "Station Manager"
            ) {
                if (
                    !req.user.station
                ) {
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
                Number(
                    req.query.limit
                ) || 100;

            limit = Math.max(
                1,
                Math.min(
                    limit,
                    500
                )
            );

            const energy =
                await Energy
                    .find(filter)
                    .sort({
                        timestamp: -1
                    })
                    .limit(limit);

            return res
                .status(200)
                .json({
                    message:
                        "Energy history fetched successfully",

                    count:
                        energy.length,

                    energy
                });
        } catch (error) {
            console.error(
                "Get energy history error:",
                error
            );

            return res
                .status(
                    error.statusCode ||
                    500
                )
                .json({
                    message:
                        error.message ||
                        "Failed to fetch energy history"
                });
        }
    };

/*
 * UPDATE ENERGY
 *
 * Station Manager only.
 */
const updateEnergy =
    async (req, res) => {
        try {
            if (
                req.user.role !==
                "Station Manager"
            ) {
                throw createError(
                    403,
                    "Only Station Manager can update energy data"
                );
            }

            const {
                id
            } = req.params;

            const energy =
                await Energy.findById(
                    id
                );

            if (!energy) {
                throw createError(
                    404,
                    "Energy data not found"
                );
            }

            if (
                !canAccessStation(
                    req.user,
                    energy.station_id
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
                "generators",
                "fuel_system",
                "power_distribution",
                "battery_system",
                "renewable_energy",
                "interconnections",
                "system_health_score",
                "system_health_trend"
            ];

            let updated = false;

            for (
                const field of allowedFields
            ) {
                if (
                    req.body[field] !==
                    undefined
                ) {
                    energy[field] =
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

            await energy.save();

            return res
                .status(200)
                .json({
                    message:
                        "Energy data updated successfully",

                    data:
                        energy
                });
        } catch (error) {
            console.error(
                "Update energy error:",
                error
            );

            return res
                .status(
                    error.statusCode ||
                    500
                )
                .json({
                    message:
                        error.message ||
                        "Failed to update energy data"
                });
        }
    };

export {
    createEnergy,
    getLatestEnergy,
    getEnergyHistory,
    updateEnergy
};