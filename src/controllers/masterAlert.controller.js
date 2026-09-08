import MasterAlert from "../models/masterAlertModel.js";

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
    if (
        user.role ===
        "NCPOR Operator"
    ) {
        return true;
    }

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

const createMasterAlert =
    async (req, res) => {
        try {
            const data =
                req.body || {};

            const stationId =
                data.station_id
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

            if (!data.station_health) {
                throw createError(
                    400,
                    "station_health is required"
                );
            }

            const masterAlert =
                await MasterAlert.create({
                    ...data,
                    station_id:
                        stationId
                });

            return res.status(201).json({
                message:
                    "Master alert snapshot created successfully",
                masterAlert
            });
        } catch (error) {
            console.error(
                "Create master alert error:",
                error
            );

            return res.status(
                error.statusCode || 500
            ).json({
                message:
                    error.message ||
                    "Failed to create master alert snapshot"
            });
        }
    };

const getLatestMasterAlert =
    async (req, res) => {
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

                filter.station_id =
                    stationId;
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

            const masterAlert =
                await MasterAlert.findOne(
                    filter
                ).sort({
                    timestamp: -1
                });

            if (!masterAlert) {
                throw createError(
                    404,
                    "Master alert data not found"
                );
            }

            return res.status(200).json({
                message:
                    "Latest master alert data fetched successfully",
                masterAlert
            });
        } catch (error) {
            console.error(
                "Get latest master alert error:",
                error
            );

            return res.status(
                error.statusCode || 500
            ).json({
                message:
                    error.message ||
                    "Failed to fetch master alert data"
            });
        }
    };

const getMasterAlertHistory =
    async (req, res) => {
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

                filter.station_id =
                    stationId;
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

            const masterAlerts =
                await MasterAlert.find(
                    filter
                )
                    .sort({
                        timestamp: -1
                    })
                    .limit(limit);

            return res.status(200).json({
                message:
                    "Master alert history fetched successfully",

                count:
                    masterAlerts.length,

                masterAlerts
            });
        } catch (error) {
            console.error(
                "Get master alert history error:",
                error
            );

            return res.status(
                error.statusCode || 500
            ).json({
                message:
                    error.message ||
                    "Failed to fetch master alert history"
            });
        }
    };

const updateMasterAlert =
    async (req, res) => {
        try {
            const {
                id
            } = req.params;

            const masterAlert =
                await MasterAlert.findById(
                    id
                );

            if (!masterAlert) {
                throw createError(
                    404,
                    "Master alert snapshot not found"
                );
            }

            if (
                !canAccessStation(
                    req.user,
                    masterAlert.station_id
                )
            ) {
                throw createError(
                    403,
                    "You do not have access to this station"
                );
            }

            const allowedFields = [
                "timestamp",
                "station_health",
                "active_alerts",
                "emergency_scenarios",
                "interconnected_recommendations",
                "decision_support_dashboard"
            ];

            let updated = false;

            for (
                const field of allowedFields
            ) {
                if (
                    req.body[field] !==
                    undefined
                ) {
                    masterAlert[field] =
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

            await masterAlert.save();

            return res.status(200).json({
                message:
                    "Master alert snapshot updated successfully",

                masterAlert
            });
        } catch (error) {
            console.error(
                "Update master alert error:",
                error
            );

            return res.status(
                error.statusCode || 500
            ).json({
                message:
                    error.message ||
                    "Failed to update master alert snapshot"
            });
        }
    };

export {
    createMasterAlert,
    getLatestMasterAlert,
    getMasterAlertHistory,
    updateMasterAlert
};