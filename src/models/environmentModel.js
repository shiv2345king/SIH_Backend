import { Schema, model } from "mongoose";

const environmentSchema = new Schema(
    {
        station: {
            type: Schema.Types.ObjectId,
            ref: "Station",
            required: [
                true,
                "Station is required"
            ]
        },

        timestamp: {
            type: Date,
            required: [
                true,
                "Timestamp is required"
            ],
            default: Date.now
        },

        pollingIntervalSeconds: {
            type: Number,
            required: [
                true,
                "Polling interval is required"
            ],
            min: [
                1,
                "Polling interval must be at least 1 second"
            ],
            default: 2
        },

        exteriorConditions: {
            temperature: {
                outsideTemperatureC: {
                    type: Number,
                    required: true
                },

                temperatureTrend: {
                    type: String,
                    enum: [
                        "increasing",
                        "decreasing",
                        "stable"
                    ],
                    default: "stable"
                },

                temperatureRateOfChangeCPerHour: {
                    type: Number,
                    default: 0
                },

                thresholds: {
                    extremeColdC: {
                        type: Number,
                        default: -50
                    },

                    severeColdC: {
                        type: Number,
                        default: -40
                    },

                    warningColdC: {
                        type: Number,
                        default: -35
                    }
                },

                alerts: {
                    isExtremeCold: {
                        type: Boolean,
                        default: false
                    },

                    isSevereCold: {
                        type: Boolean,
                        default: false
                    },

                    isWarningCold: {
                        type: Boolean,
                        default: false
                    }
                }
            },

            wind: {
                windSpeedKmh: {
                    type: Number,
                    required: true,
                    min: 0
                },

                windGustKmh: {
                    type: Number,
                    default: 0,
                    min: 0
                },

                windDirection: {
                    type: String,
                    trim: true,
                    default: ""
                },

                windDirectionDegrees: {
                    type: Number,
                    min: 0,
                    max: 360,
                    default: 0
                },

                windTrend: {
                    type: String,
                    enum: [
                        "increasing",
                        "decreasing",
                        "stable"
                    ],
                    default: "stable"
                },

                thresholds: {
                    blizzardThresholdKmh: {
                        type: Number,
                        default: 100
                    },

                    severeWindThresholdKmh: {
                        type: Number,
                        default: 75
                    },

                    warningWindThresholdKmh: {
                        type: Number,
                        default: 60
                    }
                },

                alerts: {
                    isBlizzardCondition: {
                        type: Boolean,
                        default: false
                    },

                    isSevereWind: {
                        type: Boolean,
                        default: false
                    },

                    isWarningWind: {
                        type: Boolean,
                        default: false
                    }
                }
            },

            visibility: {
                visibilityMeters: {
                    type: Number,
                    required: true,
                    min: 0
                },

                visibilityTrend: {
                    type: String,
                    enum: [
                        "improving",
                        "decreasing",
                        "stable"
                    ],
                    default: "stable"
                },

                thresholds: {
                    whiteoutMeters: {
                        type: Number,
                        default: 100
                    },

                    severeVisibilityMeters: {
                        type: Number,
                        default: 500
                    },

                    poorVisibilityMeters: {
                        type: Number,
                        default: 1000
                    }
                },

                alerts: {
                    isWhiteout: {
                        type: Boolean,
                        default: false
                    },

                    isSevereVisibilityLow: {
                        type: Boolean,
                        default: false
                    }
                }
            }
        },

        weatherPhenomena: {
            blizzard: {
                blizzardWarning: {
                    type: Boolean,
                    default: false
                },

                blizzardActive: {
                    type: Boolean,
                    default: false
                },

                blizzardTriggerConditions: {
                    windSpeedKmh: {
                        type: Number,
                        default: 0
                    },

                    windThreshold: {
                        type: Number,
                        default: 100
                    },

                    visibilityMeters: {
                        type: Number,
                        default: 0
                    },

                    visibilityThreshold: {
                        type: Number,
                        default: 500
                    },

                    bothConditionsMet: {
                        type: Boolean,
                        default: false
                    }
                },

                estimatedBlizzardDurationHours: {
                    type: Number,
                    default: 0,
                    min: 0
                },

                fieldTeamsAffectedCount: {
                    type: Number,
                    default: 0,
                    min: 0
                }
            },

            precipitation: {
                precipitationType: {
                    type: String,
                    enum: [
                        "none",
                        "light_snow",
                        "moderate_snow",
                        "heavy_snow",
                        "ice"
                    ],
                    default: "none"
                },

                precipitationRateMmPerHour: {
                    type: Number,
                    default: 0,
                    min: 0
                },

                snowAccumulationTodayMm: {
                    type: Number,
                    default: 0,
                    min: 0
                },

                totalSnowDepthOnGroundCm: {
                    type: Number,
                    default: 0,
                    min: 0
                }
            },

            atmospheric: {
                atmosphericPressureMb: {
                    type: Number,
                    default: 0
                },

                pressureTrend: {
                    type: String,
                    enum: [
                        "increasing",
                        "decreasing",
                        "stable"
                    ],
                    default: "stable"
                },

                humidityPercent: {
                    type: Number,
                    default: 0,
                    min: 0,
                    max: 100
                },

                uvIndex: {
                    type: Number,
                    default: 0,
                    min: 0
                },

                ozoneLevelDobsonUnits: {
                    type: Number,
                    default: 0,
                    min: 0
                }
            }
        },

        solarConditions: {
            solarRadiationWM2: {
                type: Number,
                default: 0,
                min: 0
            },

            solarRadiationTrend: {
                type: String,
                enum: [
                    "increasing",
                    "decreasing",
                    "stable"
                ],
                default: "stable"
            },

            seasonalPhase: {
                type: String,
                trim: true,
                default: ""
            },

            daylightHours: {
                type: Number,
                default: 0,
                min: 0,
                max: 24
            },

            solarPanelEfficiencyPercent: {
                type: Number,
                default: 0,
                min: 0,
                max: 100
            }
        },

        interconnectionsWithOtherSystems: {
            impactOnEnergy: {
                windSupportingGeneration: {
                    type: Boolean,
                    default: false
                },

                solarSupportingGeneration: {
                    type: Boolean,
                    default: false
                },

                solarOutputContributionKw: {
                    type: Number,
                    default: 0,
                    min: 0
                }
            },

            impactOnOperations: {
                outdoorOperationsPossible: {
                    type: Boolean,
                    default: true
                },

                fieldTeamSafetyStatus: {
                    type: String,
                    enum: [
                        "safe",
                        "caution",
                        "unsafe"
                    ],
                    default: "safe"
                },

                recommendations: {
                    type: String,
                    trim: true,
                    default: ""
                }
            },

            impactOnInfrastructure: {
                snowLoadingOnRoof: {
                    type: String,
                    enum: [
                        "low",
                        "moderate",
                        "high",
                        "critical"
                    ],
                    default: "low"
                },

                structuralRisk: {
                    type: String,
                    enum: [
                        "low",
                        "medium",
                        "high",
                        "critical"
                    ],
                    default: "low"
                },

                heatingDemand: {
                    type: String,
                    enum: [
                        "low",
                        "moderate",
                        "high",
                        "critical"
                    ],
                    default: "moderate"
                }
            }
        },

        emergencyScenarios: {
            scenarioBlizzardLockdown: {
                likelihood: {
                    type: String,
                    enum: [
                        "low",
                        "medium",
                        "high"
                    ],
                    default: "low"
                },

                triggerThresholdWind: {
                    type: Number,
                    default: 100
                },

                triggerThresholdVisibility: {
                    type: Number,
                    default: 500
                },

                currentStatus: {
                    type: String,
                    enum: [
                        "not_triggered",
                        "warning",
                        "active"
                    ],
                    default: "not_triggered"
                },

                estimatedEffect: {
                    type: String,
                    trim: true,
                    default: ""
                }
            },

            scenarioExtremeCold: {
                likelihood: {
                    type: String,
                    enum: [
                        "low",
                        "medium",
                        "high"
                    ],
                    default: "medium"
                },

                triggerThresholdTemp: {
                    type: Number,
                    default: -50
                },

                currentStatus: {
                    type: String,
                    enum: [
                        "not_triggered",
                        "warning",
                        "active"
                    ],
                    default: "not_triggered"
                },

                estimatedEffect: {
                    type: String,
                    trim: true,
                    default: ""
                }
            }
        },

        alertsLocal: [
            {
                severity: {
                    type: String,
                    enum: [
                        "INFO",
                        "WARNING",
                        "CRITICAL"
                    ]
                },

                message: {
                    type: String,
                    trim: true
                }
            }
        ],

        systemHealthScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 100
        },

        overallWeatherRisk: {
            type: String,
            enum: [
                "low",
                "medium",
                "high",
                "critical"
            ],
            default: "low"
        }
    },
    {
        timestamps: true
    }
);

environmentSchema.index({
    station: 1,
    timestamp: -1
});

environmentSchema.index({
    station: 1,
    "weatherPhenomena.blizzard.blizzardActive": 1
});

const Environment = model(
    "Environment",
    environmentSchema
);

export default Environment;