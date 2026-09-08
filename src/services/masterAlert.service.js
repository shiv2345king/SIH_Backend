import Environment from "../models/environmentModel.js";
import Energy from "../models/energyModel.js";
import Infrastructure from "../models/infrastructureModel.js";
import Logistics from "../models/logisticsModel.js";
import MasterAlert from "../models/masterAlertModel.js";
import Station from "../models/stationModel.js";

/* ============================================================
   HELPERS
   ============================================================ */

const getSeverityColor = (severity) => {
    if (severity === "CRITICAL") {
        return "red";
    }

    if (severity === "WARNING") {
        return "yellow";
    }

    return "blue";
};

const calculateOperationalStatus = (score) => {
    if (score < 60) {
        return "RED";
    }

    if (score < 80) {
        return "YELLOW";
    }

    return "GREEN";
};

/* ============================================================
   ENVIRONMENT SCORE

   Environment model uses camelCase internally:
   exteriorConditions.temperature.outsideTemperatureC
   ============================================================ */

const calculateEnvironmentScore = (environment) => {
    let score = 100;

    const temperature =
        environment?.exteriorConditions?.temperature
            ?.outsideTemperatureC;

    const wind =
        environment?.exteriorConditions?.wind
            ?.windSpeedKmh;

    const visibility =
        environment?.exteriorConditions?.visibility
            ?.visibilityMeters;

    if (temperature !== undefined) {
        if (temperature <= -50) {
            score -= 35;
        } else if (temperature <= -40) {
            score -= 20;
        } else if (temperature <= -35) {
            score -= 10;
        }
    }

    if (wind !== undefined) {
        if (wind >= 100) {
            score -= 35;
        } else if (wind >= 75) {
            score -= 20;
        } else if (wind >= 60) {
            score -= 10;
        }
    }

    if (visibility !== undefined) {
        if (visibility <= 500) {
            score -= 35;
        } else if (visibility <= 1000) {
            score -= 20;
        }
    }

    return Math.max(0, score);
};

/* ============================================================
   ENERGY SCORE
   ============================================================ */

const calculateEnergyScore = (energy) => {
    let score = 100;

    const generation =
        energy?.power_distribution?.total_generation_kw || 0;

    const load =
        energy?.power_distribution?.total_load_kw || 0;

    const deficit =
        energy?.power_distribution?.net_power_deficit_kw || 0;

    const battery =
        energy?.battery_system?.current_charge_percent ?? 100;

    const fuel =
        energy?.fuel_system?.primary_tank?.current_level_percent ??
        100;

    const gen1Status =
        energy?.generators?.gen_1?.status;

    if (generation < load) {
        score -= 20;
    }

    if (deficit <= -50) {
        score -= 15;
    }

    if (deficit <= -100) {
        score -= 15;
    }

    if (battery <= 20) {
        score -= 30;
    } else if (battery <= 40) {
        score -= 15;
    }

    if (fuel <= 10) {
        score -= 25;
    } else if (fuel <= 30) {
        score -= 15;
    }

    if (
        gen1Status === "FAULT" ||
        gen1Status === "MAINTENANCE"
    ) {
        score -= 20;
    }

    return Math.max(0, score);
};

/* ============================================================
   INFRASTRUCTURE SCORE
   ============================================================ */

const calculateInfrastructureScore = (infrastructure) => {
    let score = 100;

    const hvacStatus =
        infrastructure?.systems?.hvac_main?.status;

    const structuralIntegrity =
        infrastructure?.structural_health
            ?.structural_integrity_percent ?? 100;

    const snowLoad =
        infrastructure?.structural_health
            ?.snow_load_on_roof_kg ?? 0;

    const snowCritical =
        infrastructure?.structural_health
            ?.snow_load_critical_threshold_kg ?? Infinity;

    const livingQuarters =
        infrastructure?.modules?.living_quarters;

    const mainLab =
        infrastructure?.modules?.main_lab;

    if (hvacStatus === "fault") {
        score -= 25;
    } else if (hvacStatus === "degraded") {
        score -= 10;
    }

    if (structuralIntegrity < 80) {
        score -= 30;
    } else if (structuralIntegrity < 90) {
        score -= 15;
    }

    if (snowLoad >= snowCritical) {
        score -= 25;
    }

    if (
        livingQuarters?.status === "fault" ||
        livingQuarters?.status === "offline"
    ) {
        score -= 15;
    }

    if (
        mainLab?.status === "fault" ||
        mainLab?.status === "offline"
    ) {
        score -= 15;
    }

    return Math.max(0, score);
};

/* ============================================================
   LOGISTICS SCORE

   Logistics contains shipment documents.
   ============================================================ */

const calculateLogisticsScore = (logistics) => {
    let score = 100;

    if (!logistics) {
        return score;
    }

    if (logistics.status === "CANCELLED") {
        score -= 30;
    }

    if (logistics.status === "IN_TRANSIT") {
        score -= 5;
    }

    return Math.max(0, score);
};

/* ============================================================
   POWER DEFICIT ALERT
   ============================================================ */

const createPowerDeficitAlert = (energy) => {
    const distribution =
        energy?.power_distribution;

    if (!distribution) {
        return null;
    }

    const generation =
        distribution.total_generation_kw ?? 0;

    const load =
        distribution.total_load_kw ?? 0;

    const deficit =
        distribution.net_power_deficit_kw ?? 0;

    if (generation >= load) {
        return null;
    }

    const battery =
        energy?.battery_system
            ?.current_charge_percent ?? 0;

    const severity =
        battery <= 20 || deficit <= -100
            ? "CRITICAL"
            : "WARNING";

    const batteryHours =
        energy?.battery_system?.performance
            ?.estimated_backup_hours_at_current_load ?? 0;

    return {
        alert_id: `POWER-${Date.now()}`,
        timestamp: new Date(),
        severity,

        severity_levels: [
            "INFO",
            "WARNING",
            "CRITICAL",
        ],

        severity_color:
            getSeverityColor(severity),

        trigger: "POWER_DEFICIT_ACTIVE",

        alert_message:
            `POWER DEFICIT: Generation (${generation} kW) < Load (${load} kW). Battery backup active.`,

        affected_systems: [
            "energy",
            "battery_backup",
        ],

        current_state: {
            power_generation_kw: generation,
            power_load_kw: load,
            deficit_kw: deficit,
            battery_percent: battery,
            battery_hours_remaining: batteryHours,
        },

        recommended_actions: [
            {
                priority: 1,
                action: "ACTIVATE_GEN_2",
                description:
                    "Activate Generator 2 if available.",
            },
            {
                priority: 2,
                action:
                    "REDUCE_NON_CRITICAL_LOAD",
                description:
                    "Reduce non-essential power consumption.",
            },
            {
                priority: 3,
                action: "MONITOR_BATTERY",
                description:
                    "Monitor battery charge and backup duration.",
            },
        ],

        escalation: {
            escalates_to_critical_if:
                "Battery drops below 20% or power deficit becomes severe.",

            time_until_escalation:
                `${batteryHours} hours`,
        },
    };
};

/* ============================================================
   FUEL ALERT
   ============================================================ */

const createFuelAlert = (energy) => {
    const tank =
        energy?.fuel_system?.primary_tank;

    if (!tank) {
        return null;
    }

    const currentPercent =
        tank.current_level_percent ?? 100;

    const criticalThreshold =
        tank?.thresholds?.critical_low_percent ?? 10;

    const warningThreshold =
        tank?.thresholds?.warning_low_percent ?? 30;

    if (currentPercent <= criticalThreshold) {
        return {
            alert_id: `FUEL-${Date.now()}`,
            timestamp: new Date(),

            severity: "CRITICAL",

            severity_levels: [
                "INFO",
                "WARNING",
                "CRITICAL",
            ],

            severity_color: "red",

            trigger:
                "FUEL_DEPLETION_CRITICAL",

            alert_message:
                `Critical fuel level: ${currentPercent}% remaining.`,

            affected_systems: [
                "energy",
                "fuel_reserves",
            ],

            current_state: {
                fuel_liters:
                    tank.current_level_liters,

                fuel_percent:
                    currentPercent,

                days_remaining:
                    tank.days_until_empty,
            },

            recommended_actions: [
                {
                    priority: 1,
                    action:
                        "INITIATE_RESUPPLY",

                    description:
                        "Initiate urgent fuel resupply.",
                },
            ],
        };
    }

    if (currentPercent <= warningThreshold) {
        return {
            alert_id: `FUEL-${Date.now()}`,
            timestamp: new Date(),

            severity: "WARNING",

            severity_levels: [
                "INFO",
                "WARNING",
                "CRITICAL",
            ],

            severity_color: "yellow",

            trigger:
                "FUEL_DEPLETION_WARNING",

            alert_message:
                `Fuel level warning: ${currentPercent}% remaining.`,

            affected_systems: [
                "energy",
                "fuel_reserves",
            ],

            current_state: {
                fuel_liters:
                    tank.current_level_liters,

                fuel_percent:
                    currentPercent,

                days_remaining:
                    tank.days_until_empty,
            },

            recommended_actions: [
                {
                    priority: 1,
                    action: "PLAN_RESUPPLY",

                    description:
                        "Schedule the next fuel shipment.",
                },
            ],
        };
    }

    return null;
};

/* ============================================================
   ENVIRONMENT ALERTS
   ============================================================ */

const createEnvironmentAlerts = (environment) => {
    const alerts = [];

    const temperature =
        environment?.exteriorConditions
            ?.temperature;

    const wind =
        environment?.exteriorConditions
            ?.wind;

    const visibility =
        environment?.exteriorConditions
            ?.visibility;

    const temperatureValue =
        temperature?.outsideTemperatureC;

    const windValue =
        wind?.windSpeedKmh;

    const visibilityValue =
        visibility?.visibilityMeters;

    /* Extreme cold */
    if (
        temperatureValue !== undefined &&
        temperatureValue <=
            (temperature?.thresholds
                ?.extremeColdC ?? -50)
    ) {
        alerts.push({
            alert_id: `TEMP-${Date.now()}`,
            timestamp: new Date(),

            severity: "CRITICAL",

            severity_levels: [
                "INFO",
                "WARNING",
                "CRITICAL",
            ],

            severity_color: "red",

            trigger: "EXTREME_COLD",

            alert_message:
                `Extreme cold detected: ${temperatureValue}°C.`,

            affected_systems: [
                "environment",
            ],

            current_state: {
                temperature_c:
                    temperatureValue,
            },

            recommended_actions: [
                {
                    priority: 1,

                    action:
                        "LIMIT_OUTDOOR_OPERATIONS",

                    description:
                        "Restrict outdoor activities and monitor station heating.",
                },
            ],
        });
    } else if (
        temperatureValue !== undefined &&
        temperatureValue <=
            (temperature?.thresholds
                ?.warningColdC ?? -35)
    ) {
        alerts.push({
            alert_id: `TEMP-${Date.now()}`,
            timestamp: new Date(),

            severity: "WARNING",

            severity_levels: [
                "INFO",
                "WARNING",
                "CRITICAL",
            ],

            severity_color: "yellow",

            trigger: "WARNING_COLD",

            alert_message:
                `Low external temperature: ${temperatureValue}°C.`,

            affected_systems: [
                "environment",
            ],

            current_state: {
                temperature_c:
                    temperatureValue,
            },

            recommended_actions: [
                {
                    priority: 1,
                    action: "MONITOR_HEATING",

                    description:
                        "Monitor heating demand and station temperatures.",
                },
            ],
        });
    }

    /* Blizzard */
    if (
        windValue !== undefined &&
        visibilityValue !== undefined &&
        windValue >=
            (wind?.thresholds
                ?.blizzardThresholdKmh ?? 100) &&
        visibilityValue <
            (visibility?.thresholds
                ?.severeVisibilityMeters ?? 500)
    ) {
        alerts.push({
            alert_id: `BLIZZARD-${Date.now()}`,
            timestamp: new Date(),

            severity: "CRITICAL",

            severity_levels: [
                "INFO",
                "WARNING",
                "CRITICAL",
            ],

            severity_color: "red",

            trigger: "BLIZZARD_CONDITION",

            alert_message:
                "Blizzard conditions detected.",

            affected_systems: [
                "environment",
                "operations",
            ],

            current_state: {
                wind_speed_kmh:
                    windValue,

                visibility_meters:
                    visibilityValue,
            },

            recommended_actions: [
                {
                    priority: 1,

                    action:
                        "LOCKDOWN_OUTDOOR_OPERATIONS",

                    description:
                        "Restrict outdoor movement and recall field teams.",
                },
            ],
        });
    }

    return alerts;
};

/* ============================================================
   INFRASTRUCTURE ALERTS
   ============================================================ */

const createInfrastructureAlerts = (
    infrastructure
) => {
    const alerts = [];

    const hvacStatus =
        infrastructure?.systems
            ?.hvac_main
            ?.status;

    if (hvacStatus === "fault") {
        alerts.push({
            alert_id: `HVAC-${Date.now()}`,
            timestamp: new Date(),

            severity: "CRITICAL",

            severity_levels: [
                "INFO",
                "WARNING",
                "CRITICAL",
            ],

            severity_color: "red",

            trigger: "HVAC_FAILURE",

            alert_message:
                "Main HVAC system failure detected.",

            affected_systems: [
                "infrastructure",
                "hvac",
            ],

            current_state: {
                hvac_status:
                    hvacStatus,
            },

            recommended_actions: [
                {
                    priority: 1,

                    action:
                        "ACTIVATE_HVAC_BACKUP",

                    description:
                        "Activate backup HVAC system.",
                },
            ],
        });
    }

    const structuralHealth =
        infrastructure?.structural_health;

    const snowLoad =
        structuralHealth
            ?.snow_load_on_roof_kg;

    const criticalSnowLoad =
        structuralHealth
            ?.snow_load_critical_threshold_kg;

    if (
        snowLoad !== undefined &&
        criticalSnowLoad !== undefined &&
        snowLoad >= criticalSnowLoad
    ) {
        alerts.push({
            alert_id:
                `STRUCTURAL-${Date.now()}`,

            timestamp: new Date(),

            severity: "CRITICAL",

            severity_levels: [
                "INFO",
                "WARNING",
                "CRITICAL",
            ],

            severity_color: "red",

            trigger:
                "ROOF_SNOW_LOAD_CRITICAL",

            alert_message:
                "Roof snow load has reached the critical threshold.",

            affected_systems: [
                "infrastructure",
                "structural_health",
            ],

            current_state: {
                snow_load_on_roof_kg:
                    snowLoad,

                critical_threshold_kg:
                    criticalSnowLoad,
            },

            recommended_actions: [
                {
                    priority: 1,

                    action:
                        "INSPECT_STRUCTURE",

                    description:
                        "Perform immediate structural inspection.",
                },
            ],
        });
    }

    return alerts;
};

/* ============================================================
   EMERGENCY SCENARIOS
   ============================================================ */

const createEmergencyScenarios = (
    environment,
    energy,
    infrastructure
) => {
    const wind =
        environment?.exteriorConditions
            ?.wind?.windSpeedKmh || 0;

    const visibility =
        environment?.exteriorConditions
            ?.visibility?.visibilityMeters || 0;

    const temperature =
        environment?.exteriorConditions
            ?.temperature
            ?.outsideTemperatureC || 0;

    const generatorOne =
        energy?.generators?.gen_1;

    const blizzardActive =
        wind >= 100 &&
        visibility < 500;

    const generatorFailure =
        generatorOne?.status === "FAULT";

    return [
        {
            scenario_id:
                "SCENARIO-BLIZZARD",

            scenario_name:
                "Blizzard Lockdown",

            likelihood_percent:
                blizzardActive ? 100 : 15,

            trigger_conditions: {
                wind_speed_kmh: 100,
                visibility_meters: 500,
            },

            current_trigger_status:
                blizzardActive,

            current_wind:
                wind,

            current_visibility:
                visibility,

            projected_impact: {
                outdoor_operations:
                    blizzardActive
                        ? "COMPLETE_LOCKDOWN"
                        : "NORMAL",

                personnel_movement:
                    blizzardActive
                        ? "RESTRICTED"
                        : "NORMAL",

                supply_chain:
                    blizzardActive
                        ? "DISRUPTED"
                        : "NORMAL",
            },

            recommended_prep_actions: [
                "Ensure emergency supplies are available",
                "Secure outdoor equipment",
                "Recall field teams if conditions deteriorate",
            ],
        },

        {
            scenario_id:
                "SCENARIO-GENERATOR-FAILURE",

            scenario_name:
                "Generator 1 Failure",

            likelihood_percent:
                generatorFailure ? 100 : 8,

            trigger_condition:
                "Generator 1 fault detected",

            current_status:
                generatorFailure
                    ? "ACTIVE"
                    : "NOT_TRIGGERED",

            projected_impact: {
                immediate:
                    generatorFailure
                        ? "Power generation reduced"
                        : "No immediate impact",
            },

            mitigation:
                "Generator 2 standby available",
        },

        {
            scenario_id:
                "SCENARIO-EXTREME-COLD",

            scenario_name:
                "Extreme Cold",

            likelihood_percent:
                temperature <= -50
                    ? 100
                    : temperature <= -40
                        ? 60
                        : 10,

            trigger_condition:
                "External temperature reaches extreme cold threshold",

            current_status:
                temperature <= -50
                    ? "ACTIVE"
                    : temperature <= -40
                        ? "WARNING"
                        : "NOT_TRIGGERED",

            projected_impact: {
                heating_demand:
                    temperature <= -40
                        ? "HIGH"
                        : "NORMAL",
            },

            mitigation:
                "Monitor HVAC and power demand.",
        },
    ];
};

/* ============================================================
   GENERATE MASTER ALERT SNAPSHOT
   ============================================================ */

const generateMasterAlertSnapshot = async (
    stationId
) => {
    if (!stationId || !stationId.trim()) {
        throw new Error(
            "Station ID is required"
        );
    }

    const normalizedStationId =
        stationId
            .trim()
            .toUpperCase();

    /*
        Station model contains:
        code: "MAITRI"
        _id: MongoDB ObjectId

        Environment + Logistics reference
        this ObjectId.
    */
    const station =
        await Station.findOne({
            code: normalizedStationId,
            isActive: true,
        }).lean();

    if (!station) {
        throw new Error(
            `Station ${normalizedStationId} not found`
        );
    }

    console.log(
        `Generating master alert for station: ${normalizedStationId}`
    );

    /*
        IMPORTANT SCHEMA MAPPING

        Environment:
            station -> ObjectId

        Energy:
            station_id -> String

        Infrastructure:
            station_id -> String

        Logistics:
            station -> ObjectId
    */

    const [
        environment,
        energy,
        infrastructure,
        logistics,
    ] = await Promise.all([
        Environment.findOne({
            station: station._id,
        })
            .sort({
                timestamp: -1,
            })
            .lean(),

        Energy.findOne({
            station_id:
                normalizedStationId,
        })
            .sort({
                timestamp: -1,
            })
            .lean(),

        Infrastructure.findOne({
            station_id:
                normalizedStationId,
        })
            .sort({
                timestamp: -1,
            })
            .lean(),

        Logistics.findOne({
            station: station._id,
            isActive: true,
        })
            .sort({
                createdAt: -1,
            })
            .lean(),
    ]);

    console.log(
        "Master alert source data:",
        {
            environment: Boolean(environment),
            energy: Boolean(energy),
            infrastructure: Boolean(
                infrastructure
            ),
            logistics: Boolean(logistics),
        }
    );

    /*
        Logistics is optional.

        The simulator creates:
        Environment
        Energy
        Infrastructure

        It does NOT create shipment records.

        Therefore master alert generation
        should NOT fail just because Logistics
        is empty.
    */
    if (
        !environment &&
        !energy &&
        !infrastructure
    ) {
        throw new Error(
            `No monitoring data available for station ${normalizedStationId}`
        );
    }

    const environmentScore =
        environment
            ? calculateEnvironmentScore(
                  environment
              )
            : 100;

    const energyScore =
        energy
            ? calculateEnergyScore(
                  energy
              )
            : 100;

    const infrastructureScore =
        infrastructure
            ? calculateInfrastructureScore(
                  infrastructure
              )
            : 100;

    const logisticsScore =
        logistics
            ? calculateLogisticsScore(
                  logistics
              )
            : 100;

    const averageScore =
        Math.round(
            (
                environmentScore +
                energyScore +
                infrastructureScore +
                logisticsScore
            ) / 4
        );

    /* ========================================================
       ACTIVE ALERTS
       ======================================================== */

    const activeAlerts = [];

    if (energy) {
        const powerAlert =
            createPowerDeficitAlert(
                energy
            );

        if (powerAlert) {
            activeAlerts.push(
                powerAlert
            );
        }

        const fuelAlert =
            createFuelAlert(energy);

        if (fuelAlert) {
            activeAlerts.push(
                fuelAlert
            );
        }
    }

    if (environment) {
        activeAlerts.push(
            ...createEnvironmentAlerts(
                environment
            )
        );
    }

    if (infrastructure) {
        activeAlerts.push(
            ...createInfrastructureAlerts(
                infrastructure
            )
        );
    }

    /* ========================================================
       OPERATIONAL STATUS
       ======================================================== */

    const operationalStatus =
        calculateOperationalStatus(
            averageScore
        );

    /* ========================================================
       EMERGENCY SCENARIOS
       ======================================================== */

    const emergencyScenarios =
        createEmergencyScenarios(
            environment,
            energy,
            infrastructure
        );

    /* ========================================================
       SORT ALERTS
       ======================================================== */

    const sortedAlerts =
        activeAlerts.sort(
            (a, b) => {
                const priority = {
                    CRITICAL: 3,
                    WARNING: 2,
                    INFO: 1,
                };

                return (
                    (priority[b.severity] || 0) -
                    (priority[a.severity] || 0)
                );
            }
        );

    /* ========================================================
       RECOMMENDATIONS
       ======================================================== */

    const immediateAction =
        sortedAlerts[0]
            ?.recommended_actions?.[0]
            ?.description ||
        "No immediate action required";

    /* ========================================================
       MASTER ALERT SNAPSHOT
       ======================================================== */

    const snapshot = {
        station_id:
            normalizedStationId,

        timestamp: new Date(),

        station_health: {
            overall_health_score:
                averageScore,

            health_score_trend:
                averageScore < 80
                    ? "deteriorating"
                    : averageScore > 90
                        ? "improving"
                        : "stable",

            operational_status:
                operationalStatus,

            operational_status_values: [
                "GREEN",
                "YELLOW",
                "RED",
            ],

            health_breakdown: {
                infrastructure_score:
                    infrastructureScore,

                energy_score:
                    energyScore,

                environment_score:
                    environmentScore,

                logistics_score:
                    logisticsScore,

                average_score:
                    averageScore,
            },
        },

        active_alerts:
            sortedAlerts,

        emergency_scenarios:
            emergencyScenarios,

        interconnected_recommendations: {
            immediate_action:
                immediateAction,

            secondary_action:
                sortedAlerts.length
                    ? "Review all active alerts and affected systems"
                    : "Continue routine monitoring",

            monitoring:
                "Continue monitoring station systems",
        },

        decision_support_dashboard: {
            key_metrics: {
                fuel_days_remaining:
                    energy
                        ?.fuel_system
                        ?.primary_tank
                        ?.days_until_empty ??
                    0,

                battery_hours_remaining:
                    energy
                        ?.battery_system
                        ?.performance
                        ?.estimated_backup_hours_at_current_load ??
                    0,

                food_days_remaining:
                    0,

                power_deficit_kw:
                    energy
                        ?.power_distribution
                        ?.net_power_deficit_kw ??
                    0,
            },

            confidence_levels: {
                data_accuracy_percent:
                    95,

                model_reliability_percent:
                    88,

                recommendation_confidence_percent:
                    92,
            },
        },
    };

    return snapshot;
};

/* ============================================================
   SAVE MASTER ALERT SNAPSHOT
   ============================================================ */

const saveMasterAlertSnapshot = async (
    stationId
) => {
    const snapshot =
        await generateMasterAlertSnapshot(
            stationId
        );

    const masterAlert =
        await MasterAlert.create(
            snapshot
        );

    console.log(
        `Master alert snapshot saved for ${snapshot.station_id}`
    );

    return masterAlert;
};

/* ============================================================
   EXPORTS
   ============================================================ */

export {
    generateMasterAlertSnapshot,
    saveMasterAlertSnapshot,
};