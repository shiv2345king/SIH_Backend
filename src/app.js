import express from "express";
import http from "http";
import cookieParser from "cookie-parser";
import passport from "passport";
import cors from "cors";

import "./config/passport.js";

import userRoutes from "./routes/user.routes.js";
import stationRoutes from "./routes/station.routes.js";
import requirementRoutes from "./routes/requirement.routes.js";
import logisticsRoutes from "./routes/logistics.routes.js";
import environmentRoutes from "./routes/environment.routes.js";
import energyRoutes from "./routes/energy.routes.js";
import infrastructureRoutes from "./routes/infrastructure.routes.js";
import masterAlertRoutes from "./routes/masterAlert.routes.js";
import simulationRoutes from "./routes/simulation.routes.js";

import dbConnect from "./db/dbConnect.js";

import {
    initializeSocket
} from "./services/socket.service.js";

const app = express();

app.use(
    cors({
        origin:
            process.env.FRONTEND_URL ||
            "http://localhost:5173",
        credentials: true
    })
);

app.use(
    express.json()
);

app.use(
    cookieParser()
);

app.use(
    passport.initialize()
);

app.use(
    "/api/v1/users",
    userRoutes
);

app.use(
    "/api/v1/stations",
    stationRoutes
);

app.use(
    "/api/v1/requirements",
    requirementRoutes
);

app.use(
    "/api/v1/logistics",
    logisticsRoutes
);

app.use(
    "/api/v1/environment",
    environmentRoutes
);

app.use(
    "/api/v1/energy",
    energyRoutes
);

app.use(
    "/api/v1/infrastructure",
    infrastructureRoutes
);

app.use(
    "/api/v1/master-alerts",
    masterAlertRoutes
);

app.use(
    "/api/v1/simulation",
    simulationRoutes
);

const server =
    http.createServer(app);

initializeSocket(server);

const PORT =
    process.env.PORT || 5000;

const startServer = async () => {
    try {
        await dbConnect();

        server.listen(
            PORT,
            () => {
                console.log(
                    `Server running on port ${PORT}`
                );
            }
        );
    } catch (error) {
        console.error(
            "MongoDB connection failed:",
            error
        );

        process.exit(1);
    }
};

startServer();