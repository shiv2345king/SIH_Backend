import { Schema, model } from "mongoose";

const masterAlertSchema = new Schema(
    {
        station_id: {
            type: String,
            required: [true, "Station ID is required"],
            trim: true
        },

        timestamp: {
            type: Date,
            required: [true, "Timestamp is required"],
            default: Date.now
        },

        station_health: {
            overall_health_score: {
                type: Number,
                min: 0,
                max: 100,
                default: 100
            },

            health_score_trend: {
                type: String,
                enum: [
                    "improving",
                    "deteriorating",
                    "stable"
                ],
                default: "stable"
            },

            operational_status: {
                type: String,
                enum: [
                    "GREEN",
                    "YELLOW",
                    "RED"
                ],
                default: "GREEN"
            },

            operational_status_values: {
                type: [String],
                default: [
                    "GREEN",
                    "YELLOW",
                    "RED"
                ]
            },

            health_breakdown: {
                infrastructure_score: {
                    type: Number,
                    min: 0,
                    max: 100,
                    default: 100
                },

                energy_score: {
                    type: Number,
                    min: 0,
                    max: 100,
                    default: 100
                },

                environment_score: {
                    type: Number,
                    min: 0,
                    max: 100,
                    default: 100
                },

                logistics_score: {
                    type: Number,
                    min: 0,
                    max: 100,
                    default: 100
                },

                average_score: {
                    type: Number,
                    min: 0,
                    max: 100,
                    default: 100
                }
            }
        },

        active_alerts: [
            {
                alert_id: {
                    type: String,
                    required: true,
                    trim: true
                },

                timestamp: {
                    type: Date,
                    default: Date.now
                },

                severity: {
                    type: String,
                    enum: [
                        "INFO",
                        "WARNING",
                        "CRITICAL"
                    ],
                    required: true
                },

                severity_levels: {
                    type: [String],
                    default: [
                        "INFO",
                        "WARNING",
                        "CRITICAL"
                    ]
                },

                severity_color: {
                    type: String,
                    default: "yellow"
                },

                trigger: {
                    type: String,
                    required: true,
                    trim: true
                },

                alert_message: {
                    type: String,
                    required: true,
                    trim: true
                },

                affected_systems: {
                    type: [String],
                    default: []
                },

                current_state: {
                    type: Schema.Types.Mixed,
                    default: {}
                },

                recommended_actions: [
                    {
                        priority: {
                            type: Number,
                            min: 1
                        },

                        action: {
                            type: String,
                            trim: true
                        },

                        description: {
                            type: String,
                            trim: true
                        }
                    }
                ],

                escalation: {
                    escalates_to_critical_if: {
                        type: String,
                        trim: true,
                        default: ""
                    },

                    time_until_escalation: {
                        type: String,
                        trim: true,
                        default: ""
                    }
                }
            }
        ],

        emergency_scenarios: [
            {
                scenario_id: {
                    type: String,
                    trim: true
                },

                scenario_name: {
                    type: String,
                    trim: true
                },

                likelihood_percent: {
                    type: Number,
                    min: 0,
                    max: 100
                },

                trigger_conditions: {
                    type: Schema.Types.Mixed,
                    default: {}
                },

                current_trigger_status: {
                    type: Boolean,
                    default: false
                },

                current_status: {
                    type: String,
                    trim: true,
                    default: ""
                },

                current_wind: {
                    type: Number,
                    default: null
                },

                current_visibility: {
                    type: Number,
                    default: null
                },

                projected_impact: {
                    type: Schema.Types.Mixed,
                    default: {}
                },

                recommended_prep_actions: {
                    type: [String],
                    default: []
                },

                trigger_condition: {
                    type: String,
                    trim: true,
                    default: ""
                },

                mitigation: {
                    type: String,
                    trim: true,
                    default: ""
                }
            }
        ],

        interconnected_recommendations: {
            immediate_action: {
                type: String,
                trim: true,
                default: ""
            },

            secondary_action: {
                type: String,
                trim: true,
                default: ""
            },

            monitoring: {
                type: String,
                trim: true,
                default: ""
            }
        },

        decision_support_dashboard: {
            key_metrics: {
                fuel_days_remaining: {
                    type: Number,
                    min: 0,
                    default: 0
                },

                battery_hours_remaining: {
                    type: Number,
                    min: 0,
                    default: 0
                },

                food_days_remaining: {
                    type: Number,
                    min: 0,
                    default: 0
                },

                power_deficit_kw: {
                    type: Number,
                    default: 0
                }
            },

            confidence_levels: {
                data_accuracy_percent: {
                    type: Number,
                    min: 0,
                    max: 100,
                    default: 0
                },

                model_reliability_percent: {
                    type: Number,
                    min: 0,
                    max: 100,
                    default: 0
                },

                recommendation_confidence_percent: {
                    type: Number,
                    min: 0,
                    max: 100,
                    default: 0
                }
            }
        }
    },
    {
        timestamps: true
    }
);

masterAlertSchema.index({
    station_id: 1,
    timestamp: -1
});

masterAlertSchema.index({
    station_id: 1,
    "station_health.operational_status": 1
});

const MasterAlert = model(
    "MasterAlert",
    masterAlertSchema
);

export default MasterAlert;