import { Router } from "express";

import {
    getAllStations,
    getStationByCode,
    createStation,
    updateStation,
    deactivateStation
} from "../controllers/station.controller.js";

import {
    verifyJwt,
    authorizeRoles
} from "../middlewares/auth.middleware.js";

import authorizeStation
    from "../middlewares/station.middleware.js";

const router =
    Router();


// GET ALL STATIONS
// NCPOR Operator only
router.get(
    "/",
    verifyJwt,
    authorizeRoles(
        "NCPOR Operator"
    ),
    getAllStations
);


// GET PARTICULAR STATION
// NCPOR Operator -> any station
// Station Manager -> assigned station
// Logistics Manager -> global access
router.get(
    "/:code",
    verifyJwt,
    authorizeRoles(
        "NCPOR Operator",
        "Station Manager",
        "Logistics Manager"
    ),
    authorizeStation,
    getStationByCode
);


// CREATE STATION
// NCPOR Operator only
router.post(
    "/",
    verifyJwt,
    authorizeRoles(
        "NCPOR Operator"
    ),
    createStation
);


// UPDATE STATION
// NCPOR Operator only
router.patch(
    "/:code",
    verifyJwt,
    authorizeRoles(
        "NCPOR Operator"
    ),
    updateStation
);


// DEACTIVATE STATION
// NCPOR Operator only
router.delete(
    "/:code",
    verifyJwt,
    authorizeRoles(
        "NCPOR Operator"
    ),
    deactivateStation
);

export default router;