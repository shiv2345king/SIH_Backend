import express from "express";

import {
    createShipment,
    getShipments,
    getShipmentByNumber,
    updateShipmentStatus,
    receiveShipment,
    deactivateShipment
} from "../controllers/logistics.controller.js";

import {
    verifyJwt,
    authorizeRoles
} from "../middlewares/auth.middleware.js";

const router =
    express.Router();

router.use(
    verifyJwt
);

// View logistics/dashboard/shipment data
router.get(
    "/",
    authorizeRoles(
        "NCPOR Operator",
        "Station Manager",
        "Logistics Manager"
    ),
    getShipments
);

// View a specific shipment
router.get(
    "/:shipmentNumber",
    authorizeRoles(
        "NCPOR Operator",
        "Station Manager",
        "Logistics Manager"
    ),
    getShipmentByNumber
);

// Logistics Manager creates shipment
router.post(
    "/",
    authorizeRoles(
        "Logistics Manager"
    ),
    createShipment
);

// Logistics Manager updates shipment status
router.patch(
    "/:shipmentNumber/status",
    authorizeRoles(
        "Logistics Manager"
    ),
    updateShipmentStatus
);

// Station Manager approves arrival/receipt
router.patch(
    "/:shipmentNumber/receive",
    authorizeRoles(
        "Station Manager"
    ),
    receiveShipment
);

// Logistics Manager deactivates shipment
router.delete(
    "/:shipmentNumber",
    authorizeRoles(
        "Logistics Manager"
    ),
    deactivateShipment
);

export default router;