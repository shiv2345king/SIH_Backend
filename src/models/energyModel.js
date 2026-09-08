import { Schema, model } from "mongoose";

const energySchema = new Schema(
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

        polling_interval_seconds: {
            type: Number,
            required: [true, "Polling interval is required"],
            min: 1,
            default: 2
        },

        generators: {
            gen_1: {
                generator_id: {
                    type: String,
                    required: true,
                    trim: true
                },

                status: {
                    type: String,
                    enum: [
                        "ACTIVE",
                        "STANDBY",
                        "STARTING",
                        "SHUTDOWN",
                        "FAULT",
                        "MAINTENANCE"
                    ],
                    required: true
                },

                status_values: {
                    type: [String],
                    default: [
                        "ACTIVE",
                        "STANDBY",
                        "STARTING",
                        "SHUTDOWN",
                        "FAULT",
                        "MAINTENANCE"
                    ]
                },

                status_color: {
                    type: String,
                    default: "green"
                },

                operation: {
                    runtime_total_hours: {
                        type: Number,
                        min: 0,
                        default: 0
                    },

                    runtime_since_maintenance_hours: {
                        type: Number,
                        min: 0,
                        default: 0
                    },

                    fuel_consumption_liters_per_hour: {
                        type: Number,
                        min: 0,
                        default: 0
                    },

                    power_output_kw: {
                        type: Number,
                        min: 0,
                        default: 0
                    },

                    efficiency_percent: {
                        type: Number,
                        min: 0,
                        max: 100,
                        default: 0
                    }
                },

                thresholds: {
                    maintenance_interval_hours: {
                        type: Number,
                        min: 0,
                        default: 5000
                    },

                    maintenance_due_hours: {
                        type: Number,
                        min: 0,
                        default: 0
                    },

                    fuel_consumption_max_lph: {
                        type: Number,
                        min: 0,
                        default: 95
                    },

                    power_output_max_kw: {
                        type: Number,
                        min: 0,
                        default: 250
                    },

                    overload_threshold_kw: {
                        type: Number,
                        min: 0,
                        default: 240
                    }
                }
            },

            gen_2: {
                generator_id: {
                    type: String,
                    required: true,
                    trim: true
                },

                status: {
                    type: String,
                    enum: [
                        "ACTIVE",
                        "STANDBY",
                        "STARTING",
                        "SHUTDOWN",
                        "FAULT",
                        "MAINTENANCE"
                    ],
                    required: true
                },

                status_values: {
                    type: [String],
                    default: [
                        "ACTIVE",
                        "STANDBY",
                        "STARTING",
                        "SHUTDOWN",
                        "FAULT",
                        "MAINTENANCE"
                    ]
                },

                status_color: {
                    type: String,
                    default: "yellow"
                },

                operation: {
                    runtime_total_hours: {
                        type: Number,
                        min: 0,
                        default: 0
                    },

                    runtime_since_maintenance_hours: {
                        type: Number,
                        min: 0,
                        default: 0
                    },

                    fuel_consumption_liters_per_hour: {
                        type: Number,
                        min: 0,
                        default: 0
                    },

                    power_output_kw: {
                        type: Number,
                        min: 0,
                        default: 0
                    },

                    ready_for_activation: {
                        type: Boolean,
                        default: false
                    }
                },

                thresholds: {
                    maintenance_interval_hours: {
                        type: Number,
                        min: 0,
                        default: 5000
                    },

                    maintenance_due_hours: {
                        type: Number,
                        min: 0,
                        default: 0
                    },

                    power_output_max_kw: {
                        type: Number,
                        min: 0,
                        default: 250
                    }
                }
            }
        },

        fuel_system: {
            primary_tank: {
                tank_id: {
                    type: String,
                    required: true,
                    trim: true
                },

                total_capacity_liters: {
                    type: Number,
                    min: 0,
                    required: true
                },

                current_level_liters: {
                    type: Number,
                    min: 0,
                    required: true
                },

                current_level_percent: {
                    type: Number,
                    min: 0,
                    max: 100,
                    required: true
                },

                level_trend: {
                    type: String,
                    enum: [
                        "increasing",
                        "decreasing",
                        "stable"
                    ],
                    default: "stable"
                },

                consumption_rate_liters_per_day: {
                    type: Number,
                    min: 0,
                    default: 0
                },

                days_until_empty: {
                    type: Number,
                    min: 0,
                    default: 0
                },

                thresholds: {
                    critical_low_liters: {
                        type: Number,
                        min: 0,
                        default: 5000
                    },

                    critical_low_percent: {
                        type: Number,
                        min: 0,
                        max: 100,
                        default: 10
                    },

                    warning_low_liters: {
                        type: Number,
                        min: 0,
                        default: 15000
                    },

                    warning_low_percent: {
                        type: Number,
                        min: 0,
                        max: 100,
                        default: 30
                    }
                }
            },

            emergency_reserve: {
                tank_id: {
                    type: String,
                    required: true,
                    trim: true
                },

                total_capacity_liters: {
                    type: Number,
                    min: 0,
                    required: true
                },

                current_level_liters: {
                    type: Number,
                    min: 0,
                    required: true
                },

                current_level_percent: {
                    type: Number,
                    min: 0,
                    max: 100,
                    required: true
                },

                reserve_purpose: {
                    type: String,
                    trim: true,
                    default: ""
                },

                auto_lockout_at_percent: {
                    type: Number,
                    min: 0,
                    max: 100,
                    default: 5
                }
            }
        },

        power_distribution: {
            total_generation_kw: {
                type: Number,
                min: 0,
                default: 0
            },

            total_load_kw: {
                type: Number,
                min: 0,
                default: 0
            },

            net_power_deficit_kw: {
                type: Number,
                default: 0
            },

            power_sourcing: {
                type: String,
                trim: true,
                default: ""
            },

            loads_by_section: {
                living_quarters: {
                    load_kw: {
                        type: Number,
                        min: 0,
                        default: 0
                    },

                    percent_of_total: {
                        type: Number,
                        min: 0,
                        max: 100,
                        default: 0
                    },

                    status: {
                        type: String,
                        default: "operational"
                    }
                },

                main_lab: {
                    load_kw: {
                        type: Number,
                        min: 0,
                        default: 0
                    },

                    percent_of_total: {
                        type: Number,
                        min: 0,
                        max: 100,
                        default: 0
                    },

                    status: {
                        type: String,
                        default: "operational"
                    }
                },

                hvac_system: {
                    load_kw: {
                        type: Number,
                        min: 0,
                        default: 0
                    },

                    percent_of_total: {
                        type: Number,
                        min: 0,
                        max: 100,
                        default: 0
                    },

                    status: {
                        type: String,
                        default: "operational"
                    }
                },

                critical_systems: {
                    load_kw: {
                        type: Number,
                        min: 0,
                        default: 0
                    },

                    percent_of_total: {
                        type: Number,
                        min: 0,
                        max: 100,
                        default: 0
                    },

                    status: {
                        type: String,
                        default: "operational"
                    }
                },

                other: {
                    load_kw: {
                        type: Number,
                        min: 0,
                        default: 0
                    },

                    percent_of_total: {
                        type: Number,
                        min: 0,
                        max: 100,
                        default: 0
                    },

                    status: {
                        type: String,
                        default: "operational"
                    }
                }
            },

            thresholds: {
                max_load_kw: {
                    type: Number,
                    min: 0,
                    default: 400
                },

                warning_load_kw: {
                    type: Number,
                    min: 0,
                    default: 350
                },

                deficit_warning_kw: {
                    type: Number,
                    default: -50
                }
            }
        },

        battery_system: {
            battery_bank_id: {
                type: String,
                required: true,
                trim: true
            },

            total_capacity_kwh: {
                type: Number,
                min: 0,
                required: true
            },

            current_charge_kwh: {
                type: Number,
                min: 0,
                required: true
            },

            current_charge_percent: {
                type: Number,
                min: 0,
                max: 100,
                required: true
            },

            charge_trend: {
                type: String,
                enum: [
                    "increasing",
                    "decreasing",
                    "stable"
                ],
                default: "stable"
            },

            performance: {
                charging_rate_kw: {
                    type: Number,
                    min: 0,
                    default: 0
                },

                discharging_rate_kw: {
                    type: Number,
                    min: 0,
                    default: 0
                },

                estimated_backup_hours_at_current_load: {
                    type: Number,
                    min: 0,
                    default: 0
                },

                efficiency_percent: {
                    type: Number,
                    min: 0,
                    max: 100,
                    default: 0
                }
            },

            thresholds: {
                critical_low_percent: {
                    type: Number,
                    min: 0,
                    max: 100,
                    default: 10
                },

                warning_low_percent: {
                    type: Number,
                    min: 0,
                    max: 100,
                    default: 20
                },

                max_discharge_rate_kw: {
                    type: Number,
                    min: 0,
                    default: 120
                }
            }
        },

        renewable_energy: {
            solar_panels: {
                system_id: {
                    type: String,
                    trim: true,
                    default: ""
                },

                status: {
                    type: String,
                    default: "operational"
                },

                current_output_kw: {
                    type: Number,
                    min: 0,
                    default: 0
                },

                seasonal_phase: {
                    type: String,
                    trim: true,
                    default: ""
                },

                weather_dependent: {
                    type: Boolean,
                    default: true
                }
            }
        },

        interconnections: {
            critical_alert: {
                type: String,
                trim: true,
                default: ""
            },

            alert_description: {
                type: String,
                trim: true,
                default: ""
            },

            recommended_action: {
                type: String,
                trim: true,
                default: ""
            },

            severity: {
                type: String,
                enum: [
                    "INFO",
                    "WARNING",
                    "CRITICAL"
                ],
                default: "INFO"
            }
        },

        system_health_score: {
            type: Number,
            min: 0,
            max: 100,
            default: 100
        },

        system_health_trend: {
            type: String,
            enum: [
                "improving",
                "deteriorating",
                "stable"
            ],
            default: "stable"
        }
    },
    {
        timestamps: true
    }
);

energySchema.index({
    station_id: 1,
    timestamp: -1
});

const Energy = model(
    "Energy",
    energySchema
);

export default Energy;