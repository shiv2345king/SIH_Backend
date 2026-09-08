import express from "express";

import {
    createRequirement,
    getRequirements,
    getRequirementByNumber,
    updateRequirementStatus,
    deactivateRequirement
} from "../controllers/requirement.controller.js";

import {
    verifyJwt,
    authorizeRoles
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyJwt);

router.get(
    "/",
    authorizeRoles(
        "NCPOR Operator",
        "Station Manager",
        "Logistics Manager"
    ),
    getRequirements
);

router.get(
    "/:requirementNumber",
    authorizeRoles(
        "NCPOR Operator",
        "Station Manager",
        "Logistics Manager"
    ),
    getRequirementByNumber
);

router.post(
    "/",
    authorizeRoles(
        "Station Manager"
    ),
    createRequirement
);

router.patch(
    "/:requirementNumber/status",
    authorizeRoles(
        "Station Manager",
        "Logistics Manager"
    ),
    updateRequirementStatus
);

router.delete(
    "/:requirementNumber",
    authorizeRoles(
        "Logistics Manager"
    ),
    deactivateRequirement
);

export default router;