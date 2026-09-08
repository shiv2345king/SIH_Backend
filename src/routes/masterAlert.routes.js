import express from "express";

import {
    createMasterAlert,
    getLatestMasterAlert,
    getMasterAlertHistory,
    updateMasterAlert
} from "../controllers/masterAlert.controller.js";

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
    getLatestMasterAlert
);

router.get(
    "/history",
    authorizeRoles(
        "NCPOR Operator",
        "Station Manager",
        "Logistics Manager"
    ),
    getMasterAlertHistory
);

router.post(
    "/",
    authorizeRoles(
        "Station Manager"
    ),
    createMasterAlert
);

router.patch(
    "/:id",
    authorizeRoles(
        "Station Manager"
    ),
    updateMasterAlert
);

export default router;