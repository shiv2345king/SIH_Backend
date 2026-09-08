import express from "express";

import {
    startSimulationController,
    stopSimulationController,
    getSimulationStatusController,
    generateSimulationSnapshot,
} from "../controllers/simulation.controller.js";

import {
    verifyJwt,
    authorizeRoles,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyJwt);

// Check simulation status
router.get(
    "/status",
    authorizeRoles(
        "NCPOR Operator",
        "Station Manager"
    ),
    getSimulationStatusController
);

// Start simulation
router.post(
    "/start",
    authorizeRoles(
        "NCPOR Operator",
        "Station Manager"
    ),
    startSimulationController
);

// Stop simulation
router.post(
    "/stop",
    authorizeRoles(
        "NCPOR Operator",
        "Station Manager"
    ),
    stopSimulationController
);

// Generate a single snapshot
router.post(
    "/snapshot",
    authorizeRoles(
        "NCPOR Operator",
        "Station Manager"
    ),
    generateSimulationSnapshot
);

export default router;