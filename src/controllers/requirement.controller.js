import Requirement from "../models/requirementModel.js";
import Station from "../models/stationModel.js";

const createError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

/* ============================================================
   STATION HELPERS
   ============================================================ */

const getStationByCode = async (stationCode) => {
    const normalizedCode = stationCode
        ?.trim()
        .toUpperCase();

    const station = await Station.findOne({
        code: normalizedCode,
        isActive: true,
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
    /*
        NCPOR Operator:
        Global access
    */
    if (
        user?.role ===
        "NCPOR Operator"
    ) {
        return true;
    }

    /*
        Logistics Manager:
        Global access
    */
    if (
        user?.role ===
        "Logistics Manager"
    ) {
        return true;
    }

    /*
        Station Manager:
        Only assigned station
    */
    if (
        user?.role ===
        "Station Manager"
    ) {
        if (!user?.station) {
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

/* ============================================================
   CATEGORY NORMALIZATION

   Frontend sends:
   Rations
   Medical
   Fuel
   Mechanical
   Scientific

   DO NOT convert these to uppercase because the Requirement
   model enum expects the frontend-style values.
   ============================================================ */

const normalizeCategory = (category) => {
    if (!category) {
        return null;
    }

    const normalized = String(category)
        .trim()
        .toLowerCase();

    const categoryMap = {
        rations: "Rations",
        medical: "Medical",
        fuel: "Fuel",
        mechanical: "Mechanical",
        scientific: "Scientific",
    };

    return categoryMap[normalized] || null;
};

/* ============================================================
   PRIORITY NORMALIZATION

   Frontend sends:
   Low
   Medium
   High

   Backend workflow uses:
   LOW
   MEDIUM
   HIGH
   ============================================================ */

const normalizePriority = (priority) => {
    const normalized = String(
        priority || "Medium"
    )
        .trim()
        .toLowerCase();

    const priorityMap = {
        low: "LOW",
        medium: "MEDIUM",
        high: "HIGH",
    };

    return (
        priorityMap[normalized] ||
        null
    );
};

/* ============================================================
   CREATE REQUIREMENT

   Station Manager only.
   Frontend payload:

   {
       item,
       qty,
       priority,
       category,
       notes
   }

   Backend generates:

   requirementNumber
   title
   description
   quantity
   unit
   station
   createdBy
   ============================================================ */

const createRequirement = async (
    req,
    res
) => {
    try {
        /* -------------------------------------------------------
           ROLE CHECK
        ------------------------------------------------------- */

        if (
            req?.user?.role !==
            "Station Manager"
        ) {
            throw createError(
                403,
                "Only Station Manager can create a requirement"
            );
        }

        /* -------------------------------------------------------
           STATION ASSIGNMENT CHECK
        ------------------------------------------------------- */

        if (
            !req?.user?.station ||
            !req.user.station.trim()
        ) {
            throw createError(
                403,
                "User is not assigned to any station"
            );
        }

        /* -------------------------------------------------------
           FRONTEND PAYLOAD
        ------------------------------------------------------- */

        const {
            item,
            qty,
            priority,
            category,
            notes,
        } = req.body || {};

        /* -------------------------------------------------------
           ITEM VALIDATION
        ------------------------------------------------------- */

        if (
            !item ||
            !String(item).trim()
        ) {
            throw createError(
                400,
                "Item description is required"
            );
        }

        /* -------------------------------------------------------
           QUANTITY VALIDATION
        ------------------------------------------------------- */

        const quantity = Number(qty);

        if (
            !Number.isFinite(quantity) ||
            quantity < 1
        ) {
            throw createError(
                400,
                "Quantity must be at least 1"
            );
        }

        /* -------------------------------------------------------
           CATEGORY VALIDATION
        ------------------------------------------------------- */

        if (
            !category ||
            !String(category).trim()
        ) {
            throw createError(
                400,
                "Category is required"
            );
        }

        /* -------------------------------------------------------
           NORMALIZE VALUES

           IMPORTANT:
           Category is mapped to Title Case instead of uppercase.
           
           Example:
           "Fuel" -> "Fuel"
           "fuel" -> "Fuel"
           "FUEL" -> "Fuel"

           Priority remains uppercase:
           "Medium" -> "MEDIUM"
        ------------------------------------------------------- */

        const normalizedItem =
            String(item).trim();

        const normalizedCategory =
            normalizeCategory(category);

        if (!normalizedCategory) {
            throw createError(
                400,
                "Invalid category. Use Rations, Medical, Fuel, Mechanical or Scientific"
            );
        }

        const normalizedPriority =
            normalizePriority(priority);

        if (!normalizedPriority) {
            throw createError(
                400,
                "Invalid priority. Use Low, Medium or High"
            );
        }

        const description =
            notes &&
            String(notes).trim()
                ? String(notes).trim()
                : "";

        /* -------------------------------------------------------
           FIND ASSIGNED STATION
        ------------------------------------------------------- */

        const station =
            await getStationByCode(
                req.user.station
            );

        /* -------------------------------------------------------
           VERIFY ACCESS
        ------------------------------------------------------- */

        if (
            !hasStationAccess(
                req.user,
                station.code
            )
        ) {
            throw createError(
                403,
                "You do not have access to this station"
            );
        }

        /* -------------------------------------------------------
           GENERATE REQUIREMENT NUMBER
        ------------------------------------------------------- */

        const requirementNumber =
            `REQ-${Date.now()}`;

        /* -------------------------------------------------------
           TITLE
        ------------------------------------------------------- */

        const title =
            normalizedItem;

        /* -------------------------------------------------------
           CREATE REQUIREMENT
        ------------------------------------------------------- */

        const requirement =
            await Requirement.create({
                requirementNumber,
                title,
                description,

                /*
                    IMPORTANT:
                    "Fuel", NOT "FUEL"
                */
                category:
                    normalizedCategory,

                quantity,

                /*
                    Requirement model expects a unit.
                    Frontend does not provide one.
                */
                unit: "unit",

                station: station._id,

                /*
                    "MEDIUM", "HIGH", "LOW"
                */
                priority:
                    normalizedPriority,

                status: "PENDING",

                createdBy:
                    req.user._id,
            });

        /* -------------------------------------------------------
           POPULATE RESPONSE
        ------------------------------------------------------- */

        const populatedRequirement =
            await Requirement.findById(
                requirement._id
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
                    "processedBy",
                    "name email role station"
                );

        /* -------------------------------------------------------
           RESPONSE
        ------------------------------------------------------- */

        return res
            .status(201)
            .json({
                message:
                    "Requirement created successfully",
                requirement:
                    populatedRequirement,
            });

    } catch (error) {
        console.error(
            "Create requirement error:",
            error
        );

        return res
            .status(
                error?.statusCode || 500
            )
            .json({
                message:
                    error?.message ||
                    "Failed to create requirement",
            });
    }
};

/* ============================================================
   GET ALL REQUIREMENTS

   NCPOR Operator:
       All stations

   Station Manager:
       Own station

   Logistics Manager:
       All stations
   ============================================================ */

const getRequirements = async (
    req,
    res
) => {
    try {
        const filter = {
            isActive: true,
        };

        /* -------------------------------------------------------
           STATION MANAGER
        ------------------------------------------------------- */

        if (
            req?.user?.role ===
            "Station Manager"
        ) {
            if (
                !req.user.station ||
                !req.user.station.trim()
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

            filter.station =
                station._id;
        }

        /* -------------------------------------------------------
           OPTIONAL EXPLICIT STATION FILTER

           Useful for NCPOR Operator / Logistics Manager.

           Example:
           GET /requirements?station_id=MAITRI
        ------------------------------------------------------- */

        const requestedStation =
            req?.query?.station_id;

        if (
            requestedStation &&
            req.user.role !==
                "Station Manager"
        ) {
            const normalizedStation =
                requestedStation
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

            const station =
                await getStationByCode(
                    normalizedStation
                );

            filter.station =
                station._id;
        }

        /* -------------------------------------------------------
           FETCH REQUIREMENTS
        ------------------------------------------------------- */

        const requirements =
            await Requirement.find(
                filter
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
                    "processedBy",
                    "name email role station"
                )
                .sort({
                    createdAt: -1,
                });

        /* -------------------------------------------------------
           RESPONSE
        ------------------------------------------------------- */

        return res
            .status(200)
            .json({
                message:
                    "Requirements fetched successfully",
                count:
                    requirements.length,
                requirements,
            });

    } catch (error) {
        console.error(
            "Get requirements error:",
            error
        );

        return res
            .status(
                error?.statusCode || 500
            )
            .json({
                message:
                    error?.message ||
                    "Failed to fetch requirements",
            });
    }
};

/* ============================================================
   GET REQUIREMENT BY NUMBER
   ============================================================ */

const getRequirementByNumber =
    async (req, res) => {
        try {
            const requirementNumber =
                req?.params
                    ?.requirementNumber
                    ?.trim()
                    .toUpperCase();

            if (!requirementNumber) {
                throw createError(
                    400,
                    "Requirement number is required"
                );
            }

            const requirement =
                await Requirement.findOne({
                    requirementNumber,
                    isActive: true,
                })
                    .populate(
                        "station",
                        "name code"
                    )
                    .populate(
                        "createdBy",
                        "name email role station"
                    )
                    .populate(
                        "processedBy",
                        "name email role station"
                    );

            if (!requirement) {
                throw createError(
                    404,
                    "Requirement not found"
                );
            }

            const stationCode =
                requirement
                    ?.station
                    ?.code;

            /* ---------------------------------------------------
               ACCESS CHECK
            --------------------------------------------------- */

            if (
                !hasStationAccess(
                    req.user,
                    stationCode
                )
            ) {
                throw createError(
                    403,
                    "You do not have access to this requirement"
                );
            }

            return res
                .status(200)
                .json({
                    message:
                        "Requirement fetched successfully",
                    requirement,
                });

        } catch (error) {
            console.error(
                "Get requirement error:",
                error
            );

            return res
                .status(
                    error?.statusCode || 500
                )
                .json({
                    message:
                        error?.message ||
                        "Failed to fetch requirement",
                });
        }
    };

/* ============================================================
   UPDATE REQUIREMENT STATUS

   Logistics Manager:

       PENDING
           -> PROCESSING
           -> REJECTED

       PROCESSING
           -> FULFILLED

   Station Manager:

       PENDING
           -> CANCELLED
   ============================================================ */

const updateRequirementStatus =
    async (req, res) => {
        try {
            const requirementNumber =
                req?.params
                    ?.requirementNumber
                    ?.trim()
                    .toUpperCase();

            if (!requirementNumber) {
                throw createError(
                    400,
                    "Requirement number is required"
                );
            }

            const {
                status,
                rejectionReason,
            } = req.body || {};

            if (!status) {
                throw createError(
                    400,
                    "Requirement status is required"
                );
            }

            const normalizedStatus =
                String(status)
                    .trim()
                    .toUpperCase();

            const requirement =
                await Requirement.findOne({
                    requirementNumber,
                    isActive: true,
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

            /* ---------------------------------------------------
               ACCESS CHECK
            --------------------------------------------------- */

            if (
                !hasStationAccess(
                    req.user,
                    requirement
                        ?.station
                        ?.code
                )
            ) {
                throw createError(
                    403,
                    "You do not have access to this requirement"
                );
            }

            /* ===================================================
               LOGISTICS MANAGER
               =================================================== */

            if (
                req.user.role ===
                "Logistics Manager"
            ) {
                const validTransitions = {
                    PENDING: [
                        "PROCESSING",
                        "REJECTED",
                    ],

                    PROCESSING: [
                        "FULFILLED",
                    ],

                    FULFILLED: [],
                    REJECTED: [],
                    CANCELLED: [],
                };

                if (
                    !validTransitions[
                        requirement.status
                    ]?.includes(
                        normalizedStatus
                    )
                ) {
                    throw createError(
                        400,
                        `Cannot change requirement status from ${requirement.status} to ${normalizedStatus}`
                    );
                }

                /* -----------------------------------------------
                   REJECTION
                ------------------------------------------------ */

                if (
                    normalizedStatus ===
                    "REJECTED"
                ) {
                    if (
                        !rejectionReason ||
                        !String(
                            rejectionReason
                        ).trim()
                    ) {
                        throw createError(
                            400,
                            "Rejection reason is required"
                        );
                    }

                    requirement.rejectionReason =
                        String(
                            rejectionReason
                        ).trim();
                }

                requirement.status =
                    normalizedStatus;

                requirement.processedBy =
                    req.user._id;

                requirement.processedAt =
                    new Date();

                /* -----------------------------------------------
                   FULFILLED
                ------------------------------------------------ */

                if (
                    normalizedStatus ===
                    "FULFILLED"
                ) {
                    requirement.fulfilledAt =
                        new Date();
                }
            }

            /* ===================================================
               STATION MANAGER
               =================================================== */

            else if (
                req.user.role ===
                "Station Manager"
            ) {
                if (
                    normalizedStatus !==
                    "CANCELLED"
                ) {
                    throw createError(
                        403,
                        "Station Manager can only cancel a requirement"
                    );
                }

                if (
                    requirement.status !==
                    "PENDING"
                ) {
                    throw createError(
                        400,
                        "Only pending requirements can be cancelled"
                    );
                }

                if (
                    !hasStationAccess(
                        req.user,
                        requirement
                            ?.station
                            ?.code
                    )
                ) {
                    throw createError(
                        403,
                        "You do not have access to this requirement"
                    );
                }

                requirement.status =
                    "CANCELLED";
            }

            /* ===================================================
               OTHER ROLES
               =================================================== */

            else {
                throw createError(
                    403,
                    "You do not have permission to update this requirement"
                );
            }

            /* ---------------------------------------------------
               SAVE
            --------------------------------------------------- */

            await requirement.save();

            /* ---------------------------------------------------
               POPULATE UPDATED DOCUMENT
            --------------------------------------------------- */

            const populatedRequirement =
                await Requirement.findById(
                    requirement._id
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
                        "processedBy",
                        "name email role station"
                    );

            /* ---------------------------------------------------
               RESPONSE
            --------------------------------------------------- */

            return res
                .status(200)
                .json({
                    message:
                        "Requirement status updated successfully",
                    requirement:
                        populatedRequirement,
                });

        } catch (error) {
            console.error(
                "Update requirement status error:",
                error
            );

            return res
                .status(
                    error?.statusCode || 500
                )
                .json({
                    message:
                        error?.message ||
                        "Failed to update requirement status",
                });
        }
    };

/* ============================================================
   DEACTIVATE REQUIREMENT

   Logistics Manager only.
   ============================================================ */

const deactivateRequirement =
    async (req, res) => {
        try {
            if (
                req?.user?.role !==
                "Logistics Manager"
            ) {
                throw createError(
                    403,
                    "Only Logistics Manager can deactivate a requirement"
                );
            }

            const requirementNumber =
                req?.params
                    ?.requirementNumber
                    ?.trim()
                    .toUpperCase();

            if (!requirementNumber) {
                throw createError(
                    400,
                    "Requirement number is required"
                );
            }

            const requirement =
                await Requirement.findOne({
                    requirementNumber,
                    isActive: true,
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

            /* ---------------------------------------------------
               PROCESSING PROTECTION
            --------------------------------------------------- */

            if (
                requirement.status ===
                "PROCESSING"
            ) {
                throw createError(
                    400,
                    "Requirement cannot be deactivated while processing"
                );
            }

            /* ---------------------------------------------------
               DEACTIVATE
            --------------------------------------------------- */

            requirement.isActive = false;

            await requirement.save();

            return res
                .status(200)
                .json({
                    message:
                        "Requirement deactivated successfully",
                });

        } catch (error) {
            console.error(
                "Deactivate requirement error:",
                error
            );

            return res
                .status(
                    error?.statusCode || 500
                )
                .json({
                    message:
                        error?.message ||
                        "Failed to deactivate requirement",
                });
        }
    };

/* ============================================================
   EXPORTS
   ============================================================ */

export {
    createRequirement,
    getRequirements,
    getRequirementByNumber,
    updateRequirementStatus,
    deactivateRequirement,
};