import express from "express";

import {
    createInfrastructure,
    getLatestInfrastructure,
    getInfrastructureHistory,
    updateInfrastructure
} from "../controllers/infrastructure.controller.js";

import {
    verifyJwt,
    authorizeRoles
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(
    verifyJwt
);

router.get(
    "/",
    authorizeRoles(
        "NCPOR Operator",
        "Station Manager",
        "Logistics Manager"
    ),
    getLatestInfrastructure
);

router.get(
    "/history",
    authorizeRoles(
        "NCPOR Operator",
        "Station Manager",
        "Logistics Manager"
    ),
    getInfrastructureHistory
);

router.post(
    "/",
    authorizeRoles(
        "Station Manager"
    ),
    createInfrastructure
);

router.patch(
    "/:id",
    authorizeRoles(
        "Station Manager"
    ),
    updateInfrastructure
);

export default router;