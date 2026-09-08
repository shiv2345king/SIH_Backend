import { Schema, model } from "mongoose";

const infrastructureSchema = new Schema(
    {
        station_id: {
            type: String,
            required: [true, "Station ID is required"],
            trim: true,
            uppercase: true
        },

        station_name: {
            type: String,
            required: [true, "Station name is required"],
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
            default: 5
        },

        modules: {
            living_quarters: {
                module_id: {
                    type: String,
                    required: true,
                    trim: true
                },

                status: {
                    type: String,
                    enum: [
                        "operational",
                        "fault",
                        "maintenance",
                        "offline"
                    ],
                    required: true
                },

                status_values: {
                    type: [String],
                    default: [
                        "operational",
                        "fault",
                        "maintenance",
                        "offline"
                    ]
                },

                status_color: {
                    type: String,
                    default: "green"
                },

                thermal_management: {
                    indoor_temperature_c: {
                        type: Number,
                        default: 0
                    },

                    temperature_setpoint_c: {
                        type: Number,
                        default: 0
                    },

                    temperature_critical_low_c: {
                        type: Number,
                        default: 5
                    },

                    temperature_warning_low_c: {
                        type: Number,
                        default: 10
                    },

                    temperature_trend: {
                        type: String,
                        enum: [
                            "increasing",
                            "decreasing",
                            "stable"
                        ],
                        default: "stable"
                    },

                    heating_active: {
                        type: Boolean,
                        default: false
                    }
                },

                environmental: {
                    humidity_percent: {
                        type: Number,
                        min: 0,
                        max: 100,
                        default: 0
                    },

                    humidity_max_threshold: {
                        type: Number,
                        min: 0,
                        max: 100,
                        default: 60
                    },

                    humidity_warning_threshold: {
                        type: Number,
                        min: 0,
                        max: 100,
                        default: 55
                    },

                    air_circulation_status: {
                        type: String,
                        default: "nominal"
                    },

                    co2_level_ppm: {
                        type: Number,
                        min: 0,
                        default: 0
                    }
                },

                safety: {
                    fire_alarm_status: {
                        type: Boolean,
                        default: false
                    },

                    smoke_detector_status: {
                        type: String,
                        default: "active"
                    },

                    sprinkler_system: {
                        type: String,
                        default: "active"
                    },

                    emergency_exits_clear: {
                        type: Boolean,
                        default: true
                    }
                },

                occupancy: {
                    current_occupants: {
                        type: Number,
                        min: 0,
                        default: 0
                    },

                    max_capacity: {
                        type: Number,
                        min: 0,
                        default: 0
                    },

                    occupancy_percent: {
                        type: Number,
                        min: 0,
                        max: 100,
                        default: 0
                    }
                }
            },

            main_lab: {
                module_id: {
                    type: String,
                    required: true,
                    trim: true
                },

                status: {
                    type: String,
                    enum: [
                        "operational",
                        "fault",
                        "maintenance",
                        "offline"
                    ],
                    required: true
                },

                status_values: {
                    type: [String],
                    default: [
                        "operational",
                        "fault",
                        "maintenance",
                        "offline"
                    ]
                },

                status_color: {
                    type: String,
                    default: "green"
                },

                thermal_management: {
                    indoor_temperature_c: {
                        type: Number,
                        default: 0
                    },

                    temperature_setpoint_c: {
                        type: Number,
                        default: 0
                    },

                    temperature_critical_low_c: {
                        type: Number,
                        default: 5
                    },

                    temperature_warning_low_c: {
                        type: Number,
                        default: 10
                    },

                    temperature_trend: {
                        type: String,
                        enum: [
                            "increasing",
                            "decreasing",
                            "stable"
                        ],
                        default: "stable"
                    },

                    heating_active: {
                        type: Boolean,
                        default: false
                    }
                },

                environmental: {
                    humidity_percent: {
                        type: Number,
                        min: 0,
                        max: 100,
                        default: 0
                    },

                    humidity_max_threshold: {
                        type: Number,
                        min: 0,
                        max: 100,
                        default: 50
                    },

                    humidity_warning_threshold: {
                        type: Number,
                        min: 0,
                        max: 100,
                        default: 45
                    },

                    air_circulation_status: {
                        type: String,
                        default: "nominal"
                    }
                },

                equipment: {
                    research_equipment_operational_percent: {
                        type: Number,
                        min: 0,
                        max: 100,
                        default: 0
                    },

                    critical_equipment_status: {
                        type: String,
                        default: "all_operational"
                    },

                    freezer_units_temp_c: {
                        type: Number,
                        default: 0
                    }
                },

                safety: {
                    fire_alarm_status: {
                        type: Boolean,
                        default: false
                    },

                    chemical_storage_secure: {
                        type: Boolean,
                        default: true
                    }
                }
            },

            storage_module: {
                module_id: {
                    type: String,
                    required: true,
                    trim: true
                },

                status: {
                    type: String,
                    enum: [
                        "operational",
                        "fault",
                        "maintenance",
                        "offline"
                    ],
                    required: true
                },

                status_values: {
                    type: [String],
                    default: [
                        "operational",
                        "fault",
                        "maintenance",
                        "offline"
                    ]
                },

                status_color: {
                    type: String,
                    default: "green"
                },

                thermal_management: {
                    indoor_temperature_c: {
                        type: Number,
                        default: 0
                    },

                    temperature_setpoint_c: {
                        type: Number,
                        default: 0
                    },

                    temperature_critical_high_c: {
                        type: Number,
                        default: 0
                    },

                    temperature_warning_high_c: {
                        type: Number,
                        default: -2
                    },

                    temperature_trend: {
                        type: String,
                        enum: [
                            "increasing",
                            "decreasing",
                            "stable"
                        ],
                        default: "stable"
                    },

                    refrigeration_active: {
                        type: Boolean,
                        default: false
                    }
                },

                inventory_storage: {
                    total_capacity_percent: {
                        type: Number,
                        min: 0,
                        max: 100,
                        default: 0
                    },

                    food_storage_status: {
                        type: String,
                        default: "adequate"
                    },

                    medical_storage_status: {
                        type: String,
                        default: "adequate"
                    }
                }
            }
        },

        systems: {
            hvac_main: {
                system_id: {
                    type: String,
                    required: true,
                    trim: true
                },

                status: {
                    type: String,
                    enum: [
                        "nominal",
                        "fault",
                        "degraded",
                        "maintenance"
                    ],
                    required: true
                },

                status_values: {
                    type: [String],
                    default: [
                        "nominal",
                        "fault",
                        "degraded",
                        "maintenance"
                    ]
                },

                status_color: {
                    type: String,
                    default: "green"
                },

                description: {
                    type: String,
                    trim: true,
                    default: ""
                },

                operation: {
                    heating_active: {
                        type: Boolean,
                        default: false
                    },

                    ventilation_active: {
                        type: Boolean,
                        default: false
                    },

                    backup_available: {
                        type: Boolean,
                        default: false
                    },

                    efficiency_percent: {
                        type: Number,
                        min: 0,
                        max: 100,
                        default: 0
                    }
                },

                performance: {
                    air_circulation_cfm: {
                        type: Number,
                        min: 0,
                        default: 0
                    },

                    target_circulation_cfm: {
                        type: Number,
                        min: 0,
                        default: 0
                    },

                    heat_exchanger_efficiency_percent: {
                        type: Number,
                        min: 0,
                        max: 100,
                        default: 0
                    }
                },

                thresholds: {
                    maintenance_due_hours: {
                        type: Number,
                        min: 0,
                        default: 250
                    },

                    last_maintenance_date: {
                        type: Date,
                        default: null
                    },

                    next_maintenance_due: {
                        type: Date,
                        default: null
                    }
                }
            },

            hvac_backup: {
                system_id: {
                    type: String,
                    trim: true,
                    default: ""
                },

                status: {
                    type: String,
                    default: "standby"
                },

                backup_heating_available: {
                    type: Boolean,
                    default: true
                }
            }
        },

        airlocks: [
            {
                airlock_id: {
                    type: String,
                    required: true,
                    trim: true
                },

                status: {
                    type: String,
                    enum: [
                        "secure",
                        "maintenance",
                        "warning",
                        "danger"
                    ],
                    default: "secure"
                },

                cycles: {
                    type: Number,
                    min: 0,
                    default: 0
                },

                pressure_drop_psi: {
                    type: Number,
                    min: 0,
                    default: 0
                }
            }
        ],

        structural_health: {
            snow_load_on_roof_kg: {
                type: Number,
                min: 0,
                default: 0
            },

            snow_load_threshold_kg: {
                type: Number,
                min: 0,
                default: 20000
            },

            snow_load_critical_threshold_kg: {
                type: Number,
                min: 0,
                default: 25000
            },

            structural_integrity_percent: {
                type: Number,
                min: 0,
                max: 100,
                default: 100
            },

            roof_strain_sensors: {
                type: String,
                default: "nominal"
            },

            foundation_status: {
                type: String,
                default: "stable"
            }
        },

        alerts_local: [
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
                },

                module: {
                    type: String,
                    trim: true
                }
            }
        ],

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

infrastructureSchema.index({
    station_id: 1,
    timestamp: -1
});

infrastructureSchema.index({
    "modules.living_quarters.status": 1
});

infrastructureSchema.index({
    "modules.main_lab.status": 1
});

infrastructureSchema.index({
    "modules.storage_module.status": 1
});

infrastructureSchema.index({
    "systems.hvac_main.status": 1
});

infrastructureSchema.index({
    "structural_health.structural_integrity_percent": 1
});

const Infrastructure = model(
    "Infrastructure",
    infrastructureSchema
);

export default Infrastructure;