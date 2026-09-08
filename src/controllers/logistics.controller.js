import Logistics from "../models/logisticsModel.js";
import Requirement from "../models/requirementModel.js";
import Station from "../models/stationModel.js";

const createError = (
    statusCode,
    message
) => {
    const error = new Error(
        message
    );

    error.statusCode =
        statusCode;

    return error;
};

const getStationByCode =
    async (stationCode) => {
        const station =
            await Station.findOne({
                code:
                    stationCode
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
    // NCPOR can view all stations
    if (
        user.role ===
        "NCPOR Operator"
    ) {
        return true;
    }

    // Logistics Manager is centralized
    // and does NOT need a station assignment.
    if (
        user.role ===
        "Logistics Manager"
    ) {
        return true;
    }

    // Station Manager can access
    // only their own station.
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
    CREATE SHIPMENT

    Logistics Manager only.

    Requirement must be PROCESSING.
*/
const createShipment =
    async (req, res) => {
        try {
            if (
                req.user.role !==
                "Logistics Manager"
            ) {
                throw createError(
                    403,
                    "Only Logistics Manager can create a shipment"
                );
            }

            const {
                shipmentNumber,
                requirementNumber,
                title,
                description,
                category,
                quantity,
                unit
            } = req.body || {};

            if (
                !shipmentNumber ||
                !requirementNumber ||
                !title ||
                !category ||
                quantity ===
                    undefined
            ) {
                throw createError(
                    400,
                    "Shipment number, requirement number, title, category and quantity are required"
                );
            }

            const normalizedShipmentNumber =
                shipmentNumber
                    .trim()
                    .toUpperCase();

            const normalizedRequirementNumber =
                requirementNumber
                    .trim()
                    .toUpperCase();

            const existingShipment =
                await Logistics.findOne({
                    shipmentNumber:
                        normalizedShipmentNumber
                });

            if (existingShipment) {
                throw createError(
                    409,
                    "Shipment number already exists"
                );
            }

            const requirement =
                await Requirement.findOne({
                    requirementNumber:
                        normalizedRequirementNumber,

                    isActive:
                        true
                }).populate(
                    "station",
                    "name code"
                );

            if (!requirement) {
                throw createError(
                    404,
                    "Requirement not found"
                );
            }

            if (
                requirement.status !==
                "PROCESSING"
            ) {
                throw createError(
                    400,
                    "Shipment can only be created for a requirement in PROCESSING status"
                );
            }

            const shipment =
                await Logistics.create({
                    shipmentNumber:
                        normalizedShipmentNumber,

                    requirement:
                        requirement._id,

                    station:
                        requirement.station._id,

                    title:
                        title.trim(),

                    description:
                        description
                            ?.trim() ||
                        "",

                    category,

                    quantity,

                    unit,

                    status:
                        "PREPARING",

                    createdBy:
                        req.user._id
                });

            const populatedShipment =
                await Logistics.findById(
                    shipment._id
                )
                    .populate(
                        "requirement",
                        "requirementNumber title status"
                    )
                    .populate(
                        "station",
                        "name code"
                    )
                    .populate(
                        "createdBy",
                        "name email role station"
                    )
                    .populate(
                        "receivedBy",
                        "name email role station"
                    );

            return res
                .status(201)
                .json({
                    message:
                        "Shipment created successfully",

                    shipment:
                        populatedShipment
                });
        } catch (error) {
            console.error(
                "Create shipment error:",
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
                        "Failed to create shipment"
                });
        }
    };

/*
    GET ALL LOGISTICS DATA

    This endpoint serves the existing
    Logistics dashboard UI.

    NCPOR:
        all stations

    Station Manager:
        own station

    Logistics Manager:
        all stations
*/
const getShipments =
    async (req, res) => {
        try {
            const filter = {
                isActive: true
            };

            let stationId = null;

            if (
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

                const station =
                    await getStationByCode(
                        req.user.station
                    );

                stationId =
                    station._id;

                filter.station =
                    station._id;
            }

            if (
                req.query.station_id
            ) {
                const requestedStation =
                    await getStationByCode(
                        req.query.station_id
                    );

                if (
                    !hasStationAccess(
                        req.user,
                        requestedStation.code
                    )
                ) {
                    throw createError(
                        403,
                        "You do not have access to this station"
                    );
                }

                stationId =
                    requestedStation._id;

                filter.station =
                    requestedStation._id;
            }

            const shipments =
                await Logistics.find(
                    filter
                )
                    .populate(
                        "requirement",
                        "requirementNumber title status"
                    )
                    .populate(
                        "station",
                        "name code"
                    )
                    .populate(
                        "createdBy",
                        "name email role station"
                    )
                    .populate(
                        "receivedBy",
                        "name email role station"
                    )
                    .sort({
                        createdAt:
                            -1
                    });

            /*
                Dashboard data expected by
                the existing frontend.
            */

            const foodShipments =
                shipments.filter(
                    (shipment) =>
                        shipment.category ===
                        "Food"
                );

            const medicalShipments =
                shipments.filter(
                    (shipment) =>
                        shipment.category ===
                        "Medical"
                );

            const fuelShipments =
                shipments.filter(
                    (shipment) =>
                        shipment.category ===
                        "Fuel"
                );

            const totalFood =
                foodShipments.reduce(
                    (
                        total,
                        shipment
                    ) =>
                        total +
                        shipment.quantity,
                    0
                );

            const totalMedical =
                medicalShipments.reduce(
                    (
                        total,
                        shipment
                    ) =>
                        total +
                        shipment.quantity,
                    0
                );

            const totalFuel =
                fuelShipments.reduce(
                    (
                        total,
                        shipment
                    ) =>
                        total +
                        shipment.quantity,
                    0
                );

            const incoming =
                shipments.map(
                    (shipment) => ({
                        shipment_id:
                            shipment
                                .shipmentNumber,

                        eta_date:
                            shipment
                                .arrivedAt,

                        eta_days:
                            shipment
                                .arrivedAt
                                ? Math.max(
                                    0,
                                    Math.ceil(
                                        (
                                            new Date(
                                                shipment.arrivedAt
                                            ) -
                                            new Date()
                                        ) /
                                        (
                                            1000 *
                                            60 *
                                            60 *
                                            24
                                        )
                                    )
                                )
                                : 0,

                        shipment_status:
                            shipment
                                .status
                                .toLowerCase(),

                        status_values: [
                            "scheduled",
                            "in_transit",
                            "delayed",
                            "arrived",
                            "cancelled"
                        ],

                        status_color:
                            shipment.status ===
                            "RECEIVED"
                                ? "green"
                                : shipment.status ===
                                  "ARRIVED"
                                ? "blue"
                                : shipment.status ===
                                  "IN_TRANSIT"
                                ? "yellow"
                                : "gray",

                        contents: {
                            food_supplies_kg:
                                shipment.category ===
                                "Food"
                                    ? shipment.quantity
                                    : 0,

                            medical_supplies_units:
                                shipment.category ===
                                "Medical"
                                    ? shipment.quantity
                                    : 0,

                            fuel_liters:
                                shipment.category ===
                                "Fuel"
                                    ? shipment.quantity
                                    : 0,

                            spare_parts:
                                shipment.category ===
                                "Maintenance",

                            research_equipment:
                                shipment.category ===
                                "Scientific Equipment",

                            other:
                                shipment
                                    .description
                        },

                        priority:
                            shipment
                                .requirement
                                ?.status ===
                            "PROCESSING"
                                ? "high"
                                : "medium",

                        criticality:
                            shipment
                                .title
                    })
                );

            const dashboardData = {
                station_id:
                    req.query.station_id ||
                    req.user.station ||
                    "ALL",

                last_updated:
                    new Date(),

                data_freshness_hours:
                    0,

                supplies: {
                    food: {
                        item_id:
                            "SUPPLY-FOOD-001",

                        current_stock_days:
                            45,

                        daily_consumption_kg:
                            85,

                        current_stock_kg:
                            Math.max(
                                0,
                                3825 +
                                    totalFood
                            ),

                        max_capacity_kg:
                            5000,

                        storage_location:
                            "storage_module",

                        thresholds: {
                            critical_low_days:
                                14,

                            warning_low_days:
                                30,

                            optimal_stock_days:
                                60
                        },

                        status:
                            "adequate",

                        status_values: [
                            "adequate",
                            "low",
                            "critical"
                        ],

                        status_color:
                            "green",

                        consumption_forecast: {
                            estimated_depletion_date:
                                new Date(
                                    Date.now() +
                                    45 *
                                        24 *
                                        60 *
                                        60 *
                                        1000
                                ),

                            days_to_critical:
                                14,

                            recommendation:
                                "Schedule resupply before stock reaches critical level"
                        }
                    },

                    medical: {
                        item_id:
                            "SUPPLY-MEDICAL-001",

                        current_stock_percent:
                            Math.min(
                                100,
                                87 +
                                    (
                                        totalMedical >
                                        0
                                            ? 5
                                            : 0
                                    )
                            ),

                        total_units:
                            450 +
                            totalMedical,

                        critical_items: [],

                        thresholds: {
                            critical_low_percent:
                                20,

                            warning_low_percent:
                                40,

                            optimal_stock_percent:
                                80
                        },

                        status:
                            "adequate",

                        status_color:
                            "green"
                    },

                    spare_parts: {
                        item_id:
                            "SUPPLY-PARTS-001",

                        categories: {
                            generator_parts: {
                                fuel_filters:
                                    12,

                                oil_filters:
                                    15,

                                spark_plugs:
                                    8,

                                status:
                                    "adequate"
                            },

                            hvac_components: {
                                air_filters:
                                    20,

                                heating_elements:
                                    3,

                                thermostat_units:
                                    2,

                                status:
                                    "adequate"
                            },

                            electrical: {
                                circuit_breakers:
                                    6,

                                fuses:
                                    48,

                                wiring_kits:
                                    4,

                                status:
                                    "adequate"
                            }
                        },

                        overall_status:
                            "adequate",

                        status_color:
                            "green"
                    }
                },

                fuel_reserves: {
                    item_id:
                        "SUPPLY-FUEL-001",

                    emergency_reserve_liters:
                        10000,

                    reserve_purpose:
                        "48-hour emergency power for critical systems only",

                    reserve_status_percent:
                        100,

                    reserve_status:
                        "full",

                    status_color:
                        "green",

                    thresholds: {
                        critical_depletion_percent:
                            5,

                        warning_depletion_percent:
                            15
                    },

                    note:
                        "Emergency reserve is locked and can only be accessed by emergency protocols"
                },

                personnel: {
                    total_personnel:
                        12,

                    on_station_count:
                        12,

                    in_transit_count:
                        0,

                    field_teams_active:
                        1,

                    breakdown: {
                        scientists:
                            6,

                        technicians:
                            4,

                        medical_officer:
                            1,

                        station_leader:
                            1
                    },

                    personnel_list: [],

                    incoming_personnel:
                        [],

                    departing_personnel:
                        []
                },

                shipments: {
                    incoming,

                    outgoing: [],

                    logistics_forecast: {
                        days_until_critical_resupply_needed:
                            14,

                        next_critical_shipment_eta:
                            incoming.length > 0
                                ? incoming[0]
                                    .eta_date
                                : null,

                        risk_assessment:
                            fuelShipments.length >
                            0
                                ? "Fuel shipment activity detected. Continue monitoring resupply."
                                : "On track for station operations"
                    }
                },

                interdependencies: {
                    food_vs_personnel: {
                        description:
                            "Current food reserves are monitored against station personnel consumption.",

                        resupply_needed_before:
                            new Date(
                                Date.now() +
                                14 *
                                    24 *
                                    60 *
                                    60 *
                                    1000
                            ),

                        current_status:
                            "adequate"
                    },

                    fuel_vs_operations: {
                        description:
                            "Fuel availability is monitored against station operational requirements.",

                        emergency_reserve_extends:
                            "48 hours",

                        resupply_urgency:
                            fuelShipments.length >
                            0
                                ? "medium"
                                : "low",

                        recommendation:
                            "Continue monitoring fuel consumption and upcoming shipments."
                    }
                },

                alerts_local: [],

                system_health_score:
                    92,

                overall_logistics_status:
                    "healthy"
            };

            return res
                .status(200)
                .json({
                    message:
                        "Logistics data fetched successfully",

                    count:
                        shipments.length,

                    shipments,

                    data:
                        dashboardData
                });
        } catch (error) {
            console.error(
                "Get logistics error:",
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
                        "Failed to fetch logistics data"
                });
        }
    };

/*
    GET SHIPMENT BY NUMBER
*/
const getShipmentByNumber =
    async (req, res) => {
        try {
            const shipmentNumber =
                req.params.shipmentNumber
                    .trim()
                    .toUpperCase();

            const shipment =
                await Logistics.findOne({
                    shipmentNumber,
                    isActive:
                        true
                })
                    .populate(
                        "requirement",
                        "requirementNumber title status"
                    )
                    .populate(
                        "station",
                        "name code"
                    )
                    .populate(
                        "createdBy",
                        "name email role station"
                    )
                    .populate(
                        "receivedBy",
                        "name email role station"
                    );

            if (!shipment) {
                throw createError(
                    404,
                    "Shipment not found"
                );
            }

            if (
                !hasStationAccess(
                    req.user,
                    shipment.station
                        .code
                )
            ) {
                throw createError(
                    403,
                    "You do not have access to this shipment"
                );
            }

            return res
                .status(200)
                .json({
                    message:
                        "Shipment fetched successfully",

                    shipment
                });
        } catch (error) {
            console.error(
                "Get shipment error:",
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
                        "Failed to fetch shipment"
                });
        }
    };

/*
    UPDATE SHIPMENT STATUS

    Logistics Manager only.

    PREPARING -> IN_TRANSIT
    IN_TRANSIT -> ARRIVED
    PREPARING -> CANCELLED
    IN_TRANSIT -> CANCELLED
*/
const updateShipmentStatus =
    async (req, res) => {
        try {
            const shipmentNumber =
                req.params.shipmentNumber
                    .trim()
                    .toUpperCase();

            const {
                status
            } = req.body || {};

            if (
                req.user.role !==
                "Logistics Manager"
            ) {
                throw createError(
                    403,
                    "Only Logistics Manager can update shipment status"
                );
            }

            const shipment =
                await Logistics.findOne({
                    shipmentNumber,
                    isActive:
                        true
                });

            if (!shipment) {
                throw createError(
                    404,
                    "Shipment not found"
                );
            }

            const validTransitions = {
                PREPARING: [
                    "IN_TRANSIT",
                    "CANCELLED"
                ],

                IN_TRANSIT: [
                    "ARRIVED",
                    "CANCELLED"
                ],

                ARRIVED: [],

                RECEIVED: [],

                CANCELLED: []
            };

            if (
                !validTransitions[
                    shipment.status
                ]?.includes(
                    status
                )
            ) {
                throw createError(
                    400,
                    `Cannot change shipment status from ${shipment.status} to ${status}`
                );
            }

            shipment.status =
                status;

            if (
                status ===
                "IN_TRANSIT"
            ) {
                shipment.dispatchedAt =
                    new Date();
            }

            if (
                status ===
                "ARRIVED"
            ) {
                shipment.arrivedAt =
                    new Date();
            }

            await shipment.save();

            const populatedShipment =
                await Logistics.findById(
                    shipment._id
                )
                    .populate(
                        "requirement",
                        "requirementNumber title status"
                    )
                    .populate(
                        "station",
                        "name code"
                    )
                    .populate(
                        "createdBy",
                        "name email role station"
                    )
                    .populate(
                        "receivedBy",
                        "name email role station"
                    );

            return res
                .status(200)
                .json({
                    message:
                        "Shipment status updated successfully",

                    shipment:
                        populatedShipment
                });
        } catch (error) {
            console.error(
                "Update shipment status error:",
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
                        "Failed to update shipment status"
                });
        }
    };

/*
    APPROVE / RECEIVE SHIPMENT

    Station Manager only.

    ARRIVED -> RECEIVED
*/
const receiveShipment =
    async (req, res) => {
        try {
            if (
                req.user.role !==
                "Station Manager"
            ) {
                throw createError(
                    403,
                    "Only Station Manager can approve shipment receipt"
                );
            }

            if (!req.user.station) {
                throw createError(
                    403,
                    "User is not assigned to any station"
                );
            }

            const shipmentNumber =
                req.params.shipmentNumber
                    .trim()
                    .toUpperCase();

            const {
                receiptRemarks
            } = req.body || {};

            const shipment =
                await Logistics.findOne({
                    shipmentNumber,
                    isActive:
                        true
                }).populate(
                    "station",
                    "name code"
                );

            if (!shipment) {
                throw createError(
                    404,
                    "Shipment not found"
                );
            }

            if (
                !hasStationAccess(
                    req.user,
                    shipment.station
                        .code
                )
            ) {
                throw createError(
                    403,
                    "You do not have access to this shipment"
                );
            }

            if (
                shipment.status !==
                "ARRIVED"
            ) {
                throw createError(
                    400,
                    "Only arrived shipments can be approved as received"
                );
            }

            shipment.status =
                "RECEIVED";

            shipment.receivedBy =
                req.user._id;

            shipment.receivedAt =
                new Date();

            shipment.receiptRemarks =
                receiptRemarks
                    ?.trim() ||
                "";

            await shipment.save();

            const populatedShipment =
                await Logistics.findById(
                    shipment._id
                )
                    .populate(
                        "requirement",
                        "requirementNumber title status"
                    )
                    .populate(
                        "station",
                        "name code"
                    )
                    .populate(
                        "createdBy",
                        "name email role station"
                    )
                    .populate(
                        "receivedBy",
                        "name email role station"
                    );

            return res
                .status(200)
                .json({
                    message:
                        "Shipment receipt approved successfully",

                    shipment:
                        populatedShipment
                });
        } catch (error) {
            console.error(
                "Receive shipment error:",
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
                        "Failed to approve shipment receipt"
                });
        }
    };

/*
    DEACTIVATE SHIPMENT

    Logistics Manager only.
*/
const deactivateShipment =
    async (req, res) => {
        try {
            if (
                req.user.role !==
                "Logistics Manager"
            ) {
                throw createError(
                    403,
                    "Only Logistics Manager can deactivate a shipment"
                );
            }

            const shipmentNumber =
                req.params.shipmentNumber
                    .trim()
                    .toUpperCase();

            const shipment =
                await Logistics.findOne({
                    shipmentNumber,
                    isActive:
                        true
                });

            if (!shipment) {
                throw createError(
                    404,
                    "Shipment not found"
                );
            }

            if (
                shipment.status ===
                    "IN_TRANSIT" ||
                shipment.status ===
                    "RECEIVED"
            ) {
                throw createError(
                    400,
                    "Shipment cannot be deactivated in its current status"
                );
            }

            shipment.isActive =
                false;

            await shipment.save();

            return res
                .status(200)
                .json({
                    message:
                        "Shipment deactivated successfully"
                });
        } catch (error) {
            console.error(
                "Deactivate shipment error:",
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
                        "Failed to deactivate shipment"
                });
        }
    };

export {
    createShipment,
    getShipments,
    getShipmentByNumber,
    updateShipmentStatus,
    receiveShipment,
    deactivateShipment
};