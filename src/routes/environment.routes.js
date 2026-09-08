import express from "express";

import {
    createEnvironment,
    getEnvironment,
    getEnvironmentHistory,
    updateEnvironment
} from "../controllers/environment.controller.js";

import {
    verifyJwt,
    authorizeRoles
} from "../middlewares/auth.middleware.js";

const router =
    express.Router();

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
    getEnvironment
);

router.get(
    "/history",
    authorizeRoles(
        "NCPOR Operator",
        "Station Manager",
        "Logistics Manager"
    ),
    getEnvironmentHistory
);

router.post(
    "/",
    authorizeRoles(
        "Station Manager"
    ),
    createEnvironment
);

router.patch(
    "/:id",
    authorizeRoles(
        "Station Manager"
    ),
    updateEnvironment
);

export default router;