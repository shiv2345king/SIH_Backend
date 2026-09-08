import Environment from "../models/environmentModel.js";
import Station from "../models/stationModel.js";

const createError = (
    statusCode,
    message
) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const getStationByCode = async (
    stationCode
) => {
    const station =
        await Station.findOne({
            code: stationCode
                .trim()
                .toUpperCase(),
            isActive: true
        });

    if (!station) {
        throw createError(
            404,
            "Station not found"
        );
    }

    return station;
};

const hasStationAccess = (
    user,
    stationCode
) => {
    // NCPOR Operator can view all stations
    if (
        user.role ===
        "NCPOR Operator"
    ) {
        return true;
    }

    // Logistics Manager works centrally
    if (
        user.role ===
        "Logistics Manager"
    ) {
        return true;
    }

    // Station Manager can access
    // only their assigned station
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
            stationCode
                .trim()
                .toUpperCase()
        );
    }

    return false;
};

/*
    Convert the database's camelCase
    structure into the snake_case
    structure expected by the frontend.
*/
const formatEnvironment = (
    environment
) => {
    if (!environment) {
        return null;
    }

    const env =
        environment.toObject
            ? environment.toObject()
            : environment;

    return {
        _id: env._id,

        station_id:
            env.station?.code ||
            "",

        station_name:
            env.station?.name ||
            "",

        timestamp:
            env.timestamp,

        polling_interval_seconds:
            env.pollingIntervalSeconds,

        exterior_conditions: {
            temperature: {
                outside_temperature_c:
                    env.exteriorConditions
                        ?.temperature
                        ?.outsideTemperatureC,

                temperature_trend:
                    env.exteriorConditions
                        ?.temperature
                        ?.temperatureTrend,

                temperature_rate_of_change_c_per_hour:
                    env.exteriorConditions
                        ?.temperature
                        ?.temperatureRateOfChangeCPerHour,

                thresholds: {
                    extreme_cold_c:
                        env.exteriorConditions
                            ?.temperature
                            ?.thresholds
                            ?.extremeColdC,

                    severe_cold_c:
                        env.exteriorConditions
                            ?.temperature
                            ?.thresholds
                            ?.severeColdC,

                    warning_cold_c:
                        env.exteriorConditions
                            ?.temperature
                            ?.thresholds
                            ?.warningColdC
                },

                alerts: {
                    is_extreme_cold:
                        env.exteriorConditions
                            ?.temperature
                            ?.alerts
                            ?.isExtremeCold,

                    is_severe_cold:
                        env.exteriorConditions
                            ?.temperature
                            ?.alerts
                            ?.isSevereCold,

                    is_warning_cold:
                        env.exteriorConditions
                            ?.temperature
                            ?.alerts
                            ?.isWarningCold
                }
            },

            wind: {
                wind_speed_kmh:
                    env.exteriorConditions
                        ?.wind
                        ?.windSpeedKmh,

                wind_gust_kmh:
                    env.exteriorConditions
                        ?.wind
                        ?.windGustKmh,

                wind_direction:
                    env.exteriorConditions
                        ?.wind
                        ?.windDirection,

                wind_direction_degrees:
                    env.exteriorConditions
                        ?.wind
                        ?.windDirectionDegrees,

                wind_trend:
                    env.exteriorConditions
                        ?.wind
                        ?.windTrend,

                thresholds: {
                    blizzard_threshold_kmh:
                        env.exteriorConditions
                            ?.wind
                            ?.thresholds
                            ?.blizzardThresholdKmh,

                    severe_wind_threshold_kmh:
                        env.exteriorConditions
                            ?.wind
                            ?.thresholds
                            ?.severeWindThresholdKmh,

                    warning_wind_threshold_kmh:
                        env.exteriorConditions
                            ?.wind
                            ?.thresholds
                            ?.warningWindThresholdKmh
                },

                alerts: {
                    is_blizzard_condition:
                        env.exteriorConditions
                            ?.wind
                            ?.alerts
                            ?.isBlizzardCondition,

                    is_severe_wind:
                        env.exteriorConditions
                            ?.wind
                            ?.alerts
                            ?.isSevereWind,

                    is_warning_wind:
                        env.exteriorConditions
                            ?.wind
                            ?.alerts
                            ?.isWarningWind
                }
            },

            visibility: {
                visibility_meters:
                    env.exteriorConditions
                        ?.visibility
                        ?.visibilityMeters,

                visibility_trend:
                    env.exteriorConditions
                        ?.visibility
                        ?.visibilityTrend,

                thresholds: {
                    whiteout_meters:
                        env.exteriorConditions
                            ?.visibility
                            ?.thresholds
                            ?.whiteoutMeters,

                    severe_visibility_meters:
                        env.exteriorConditions
                            ?.visibility
                            ?.thresholds
                            ?.severeVisibilityMeters,

                    poor_visibility_meters:
                        env.exteriorConditions
                            ?.visibility
                            ?.thresholds
                            ?.poorVisibilityMeters
                },

                alerts: {
                    is_whiteout:
                        env.exteriorConditions
                            ?.visibility
                            ?.alerts
                            ?.isWhiteout,

                    is_severe_visibility_low:
                        env.exteriorConditions
                            ?.visibility
                            ?.alerts
                            ?.isSevereVisibilityLow
                }
            }
        },

        weather_phenomena: {
            blizzard: {
                blizzard_warning:
                    env.weatherPhenomena
                        ?.blizzard
                        ?.blizzardWarning,

                blizzard_active:
                    env.weatherPhenomena
                        ?.blizzard
                        ?.blizzardActive,

                blizzard_trigger_conditions: {
                    wind_speed_kmh:
                        env.weatherPhenomena
                            ?.blizzard
                            ?.blizzardTriggerConditions
                            ?.windSpeedKmh,

                    wind_threshold:
                        env.weatherPhenomena
                            ?.blizzard
                            ?.blizzardTriggerConditions
                            ?.windThreshold,

                    visibility_meters:
                        env.weatherPhenomena
                            ?.blizzard
                            ?.blizzardTriggerConditions
                            ?.visibilityMeters,

                    visibility_threshold:
                        env.weatherPhenomena
                            ?.blizzard
                            ?.blizzardTriggerConditions
                            ?.visibilityThreshold,

                    both_conditions_met:
                        env.weatherPhenomena
                            ?.blizzard
                            ?.blizzardTriggerConditions
                            ?.bothConditionsMet
                },

                estimated_blizzard_duration_hours:
                    env.weatherPhenomena
                        ?.blizzard
                        ?.estimatedBlizzardDurationHours,

                field_teams_affected_count:
                    env.weatherPhenomena
                        ?.blizzard
                        ?.fieldTeamsAffectedCount
            },

            precipitation: {
                precipitation_type:
                    env.weatherPhenomena
                        ?.precipitation
                        ?.precipitationType,

                precipitation_rate_mm_per_hour:
                    env.weatherPhenomena
                        ?.precipitation
                        ?.precipitationRateMmPerHour,

                snow_accumulation_today_mm:
                    env.weatherPhenomena
                        ?.precipitation
                        ?.snowAccumulationTodayMm,

                total_snow_depth_on_ground_cm:
                    env.weatherPhenomena
                        ?.precipitation
                        ?.totalSnowDepthOnGroundCm
            },

            atmospheric: {
                atmospheric_pressure_mb:
                    env.weatherPhenomena
                        ?.atmospheric
                        ?.atmosphericPressureMb,

                pressure_trend:
                    env.weatherPhenomena
                        ?.atmospheric
                        ?.pressureTrend,

                humidity_percent:
                    env.weatherPhenomena
                        ?.atmospheric
                        ?.humidityPercent,

                uv_index:
                    env.weatherPhenomena
                        ?.atmospheric
                        ?.uvIndex,

                ozone_level_dobson_units:
                    env.weatherPhenomena
                        ?.atmospheric
                        ?.ozoneLevelDobsonUnits
            }
        },

        solar_conditions: {
            solar_radiation_w_m2:
                env.solarConditions
                    ?.solarRadiationWM2,

            solar_radiation_trend:
                env.solarConditions
                    ?.solarRadiationTrend,

            seasonal_phase:
                env.solarConditions
                    ?.seasonalPhase,

            daylight_hours:
                env.solarConditions
                    ?.daylightHours,

            solar_panel_efficiency_percent:
                env.solarConditions
                    ?.solarPanelEfficiencyPercent
        },

        interconnections_with_other_systems: {
            impact_on_energy: {
                wind_supporting_generation:
                    env.interconnectionsWithOtherSystems
                        ?.impactOnEnergy
                        ?.windSupportingGeneration,

                solar_supporting_generation:
                    env.interconnectionsWithOtherSystems
                        ?.impactOnEnergy
                        ?.solarSupportingGeneration,

                solar_output_contribution_kw:
                    env.interconnectionsWithOtherSystems
                        ?.impactOnEnergy
                        ?.solarOutputContributionKw
            },

            impact_on_operations: {
                outdoor_operations_possible:
                    env.interconnectionsWithOtherSystems
                        ?.impactOnOperations
                        ?.outdoorOperationsPossible,

                field_team_safety_status:
                    env.interconnectionsWithOtherSystems
                        ?.impactOnOperations
                        ?.fieldTeamSafetyStatus,

                recommendations:
                    env.interconnectionsWithOtherSystems
                        ?.impactOnOperations
                        ?.recommendations
            },

            impact_on_infrastructure: {
                snow_loading_on_roof:
                    env.interconnectionsWithOtherSystems
                        ?.impactOnInfrastructure
                        ?.snowLoadingOnRoof,

                structural_risk:
                    env.interconnectionsWithOtherSystems
                        ?.impactOnInfrastructure
                        ?.structuralRisk,

                heating_demand:
                    env.interconnectionsWithOtherSystems
                        ?.impactOnInfrastructure
                        ?.heatingDemand
            }
        },

        emergency_scenarios: {
            scenario_blizzard_lockdown: {
                likelihood:
                    env.emergencyScenarios
                        ?.scenarioBlizzardLockdown
                        ?.likelihood,

                trigger_threshold_wind:
                    env.emergencyScenarios
                        ?.scenarioBlizzardLockdown
                        ?.triggerThresholdWind,

                trigger_threshold_visibility:
                    env.emergencyScenarios
                        ?.scenarioBlizzardLockdown
                        ?.triggerThresholdVisibility,

                current_status:
                    env.emergencyScenarios
                        ?.scenarioBlizzardLockdown
                        ?.currentStatus,

                estimated_effect:
                    env.emergencyScenarios
                        ?.scenarioBlizzardLockdown
                        ?.estimatedEffect
            },

            scenario_extreme_cold: {
                likelihood:
                    env.emergencyScenarios
                        ?.scenarioExtremeCold
                        ?.likelihood,

                trigger_threshold_temp:
                    env.emergencyScenarios
                        ?.scenarioExtremeCold
                        ?.triggerThresholdTemp,

                current_status:
                    env.emergencyScenarios
                        ?.scenarioExtremeCold
                        ?.currentStatus,

                estimated_effect:
                    env.emergencyScenarios
                        ?.scenarioExtremeCold
                        ?.estimatedEffect
            }
        },

        alerts_local:
            env.alertsLocal || [],

        system_health_score:
            env.systemHealthScore,

        overall_weather_risk:
            env.overallWeatherRisk
    };
};

/*
    CREATE ENVIRONMENT
*/
const createEnvironment =
    async (req, res) => {
        try {
            const {
                station,
                timestamp,
                pollingIntervalSeconds,
                exteriorConditions,
                weatherPhenomena,
                solarConditions,
                interconnectionsWithOtherSystems,
                emergencyScenarios,
                alertsLocal,
                systemHealthScore,
                overallWeatherRisk
            } = req.body || {};

            if (!station) {
                throw createError(
                    400,
                    "Station is required"
                );
            }

            const normalizedStation =
                station
                    .trim()
                    .toUpperCase();

            const stationData =
                await getStationByCode(
                    normalizedStation
                );

            if (
                !hasStationAccess(
                    req.user,
                    stationData.code
                )
            ) {
                throw createError(
                    403,
                    "You do not have access to this station"
                );
            }

            if (
                !exteriorConditions ||
                !exteriorConditions.temperature ||
                !exteriorConditions.wind ||
                !exteriorConditions.visibility
            ) {
                throw createError(
                    400,
                    "Exterior environmental conditions are required"
                );
            }

            const environment =
                await Environment.create({
                    station:
                        stationData._id,

                    timestamp:
                        timestamp ||
                        new Date(),

                    pollingIntervalSeconds,

                    exteriorConditions,

                    weatherPhenomena,

                    solarConditions,

                    interconnectionsWithOtherSystems,

                    emergencyScenarios,

                    alertsLocal,

                    systemHealthScore,

                    overallWeatherRisk
                });

            const populatedEnvironment =
                await Environment
                    .findById(
                        environment._id
                    )
                    .populate(
                        "station",
                        "name code"
                    );

            return res
                .status(201)
                .json({
                    message:
                        "Environment data created successfully",

                    data:
                        formatEnvironment(
                            populatedEnvironment
                        )
                });
        } catch (error) {
            console.error(
                "Create environment error:",
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
                        "Failed to create environment data"
                });
        }
    };

/*
    GET LATEST ENVIRONMENT
*/
const getEnvironment =
    async (req, res) => {
        try {
            const {
                station
            } = req.query;

            const filter = {};

            if (station) {
                const normalizedStation =
                    station
                        .trim()
                        .toUpperCase();

                if (
                    !hasStationAccess(
                        req.user,
                        normalizedStation
                    )
                ) {
                    throw createError(
                        403,
                        "You do not have access to this station"
                    );
                }

                const stationData =
                    await getStationByCode(
                        normalizedStation
                    );

                filter.station =
                    stationData._id;
            } else if (
                req.user.role !==
                "NCPOR Operator" &&
                req.user.role !==
                "Logistics Manager"
            ) {
                if (
                    !req.user.station
                ) {
                    throw createError(
                        403,
                        "User is not assigned to any station"
                    );
                }

                const stationData =
                    await getStationByCode(
                        req.user.station
                            .trim()
                            .toUpperCase()
                    );

                filter.station =
                    stationData._id;
            }

            const environment =
                await Environment
                    .findOne(filter)
                    .sort({
                        timestamp: -1
                    })
                    .populate(
                        "station",
                        "name code"
                    );

            if (!environment) {
                throw createError(
                    404,
                    "Environment data not found"
                );
            }

            return res
                .status(200)
                .json({
                    message:
                        "Latest environment data fetched successfully",

                    data:
                        formatEnvironment(
                            environment
                        )
                });
        } catch (error) {
            console.error(
                "Get environment error:",
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
                        "Failed to fetch environment data"
                });
        }
    };

/*
    GET ENVIRONMENT HISTORY
*/
const getEnvironmentHistory =
    async (req, res) => {
        try {
            const {
                station
            } = req.query;

            const filter = {};

            if (station) {
                const normalizedStation =
                    station
                        .trim()
                        .toUpperCase();

                if (
                    !hasStationAccess(
                        req.user,
                        normalizedStation
                    )
                ) {
                    throw createError(
                        403,
                        "You do not have access to this station"
                    );
                }

                const stationData =
                    await getStationByCode(
                        normalizedStation
                    );

                filter.station =
                    stationData._id;
            } else if (
                req.user.role !==
                "NCPOR Operator" &&
                req.user.role !==
                "Logistics Manager"
            ) {
                if (
                    !req.user.station
                ) {
                    throw createError(
                        403,
                        "User is not assigned to any station"
                    );
                }

                const stationData =
                    await getStationByCode(
                        req.user.station
                            .trim()
                            .toUpperCase()
                    );

                filter.station =
                    stationData._id;
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

            const environments =
                await Environment
                    .find(filter)
                    .sort({
                        timestamp: -1
                    })
                    .limit(limit)
                    .populate(
                        "station",
                        "name code"
                    );

            return res
                .status(200)
                .json({
                    message:
                        "Environment history fetched successfully",

                    count:
                        environments.length,

                    environments:
                        environments.map(
                            formatEnvironment
                        )
                });
        } catch (error) {
            console.error(
                "Get environment history error:",
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
                        "Failed to fetch environment history"
                });
        }
    };

/*
    UPDATE ENVIRONMENT

    Station Manager only.
*/
const updateEnvironment =
    async (req, res) => {
        try {
            if (
                req.user.role !==
                "Station Manager"
            ) {
                throw createError(
                    403,
                    "Only Station Manager can update environment data"
                );
            }

            const {
                id
            } = req.params;

            const environment =
                await Environment
                    .findById(id)
                    .populate(
                        "station",
                        "name code"
                    );

            if (!environment) {
                throw createError(
                    404,
                    "Environment data not found"
                );
            }

            if (
                !hasStationAccess(
                    req.user,
                    environment.station
                        .code
                )
            ) {
                throw createError(
                    403,
                    "You do not have access to this station"
                );
            }

            const allowedFields = [
                "timestamp",
                "pollingIntervalSeconds",
                "exteriorConditions",
                "weatherPhenomena",
                "solarConditions",
                "interconnectionsWithOtherSystems",
                "emergencyScenarios",
                "alertsLocal",
                "systemHealthScore",
                "overallWeatherRisk"
            ];

            let updated = false;

            for (
                const field of allowedFields
            ) {
                if (
                    req.body[field] !==
                    undefined
                ) {
                    environment[field] =
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

            await environment.save();

            const populatedEnvironment =
                await Environment
                    .findById(
                        environment._id
                    )
                    .populate(
                        "station",
                        "name code"
                    );

            return res
                .status(200)
                .json({
                    message:
                        "Environment data updated successfully",

                    data:
                        formatEnvironment(
                            populatedEnvironment
                        )
                });
        } catch (error) {
            console.error(
                "Update environment error:",
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
                        "Failed to update environment data"
                });
        }
    };

export {
    createEnvironment,
    getEnvironment,
    getEnvironmentHistory,
    updateEnvironment
};