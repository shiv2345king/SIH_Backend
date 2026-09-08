import express from "express";

import {
    createEnergy,
    getLatestEnergy,
    getEnergyHistory,
    updateEnergy
} from "../controllers/energy.controller.js";

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
    getLatestEnergy
);

router.get(
    "/history",
    authorizeRoles(
        "NCPOR Operator",
        "Station Manager",
        "Logistics Manager"
    ),
    getEnergyHistory
);

router.post(
    "/",
    authorizeRoles(
        "Station Manager"
    ),
    createEnergy
);

router.patch(
    "/:id",
    authorizeRoles(
        "Station Manager"
    ),
    updateEnergy
);

export default router;