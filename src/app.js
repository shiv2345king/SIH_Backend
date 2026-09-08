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

import { initializeSocket } from "./services/socket.service.js";

const app = express();

/* ============================================================
   CORS
   ============================================================

   Render environment variable:
   FRONTEND_URL=
   https://sih-frontend-l1ydiqbac-shivam-guptas-projects-cd5190e3.vercel.app

   Local development still works through localhost.
   ============================================================ */

const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no Origin header
            // such as server-to-server requests.
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            console.error("CORS blocked origin:", origin);

            return callback(
                new Error(`CORS origin not allowed: ${origin}`)
            );
        },
        credentials: true,
    })
);

/* ============================================================
   BODY PARSERS
   ============================================================ */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ============================================================
   COOKIES
   ============================================================ */

app.use(cookieParser());

/* ============================================================
   PASSPORT
   ============================================================ */

app.use(passport.initialize());

/* ============================================================
   API ROUTES
   ============================================================ */

app.use("/api/v1/users", userRoutes);

app.use("/api/v1/stations", stationRoutes);

app.use("/api/v1/requirements", requirementRoutes);

app.use("/api/v1/logistics", logisticsRoutes);

app.use("/api/v1/environment", environmentRoutes);

app.use("/api/v1/energy", energyRoutes);

app.use("/api/v1/infrastructure", infrastructureRoutes);

app.use("/api/v1/master-alerts", masterAlertRoutes);

app.use("/api/v1/simulation", simulationRoutes);

/* ============================================================
   BASIC HEALTH CHECK
   ============================================================ */

app.get("/", (req, res) => {
    res.status(200).json({
        message: "SIH Backend API is running",
        status: "OK",
    });
});

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "healthy",
        message: "Backend is running successfully",
    });
});

/* ============================================================
   404 HANDLER
   ============================================================ */

app.use((req, res) => {
    res.status(404).json({
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});

/* ============================================================
   GLOBAL ERROR HANDLER
   ============================================================ */

app.use((error, req, res, next) => {
    console.error("Global error:", error);

    const statusCode = error.statusCode || 500;

    res.status(statusCode).json({
        message:
            error.message ||
            "Internal server error",
    });
});

/* ============================================================
   HTTP SERVER
   ============================================================ */

const server = http.createServer(app);

/* ============================================================
   SOCKET.IO
   ============================================================ */

initializeSocket(server);

/* ============================================================
   PORT
   ============================================================ */

const PORT = process.env.PORT || 5000;

/* ============================================================
   START SERVER
   ============================================================ */

const startServer = async () => {
    try {
        await dbConnect();

        server.listen(PORT, "0.0.0.0", () => {
            console.log(
                `Server running on port ${PORT}`
            );

            console.log(
                "Allowed CORS origins:",
                allowedOrigins
            );
        });
    } catch (error) {
        console.error(
            "MongoDB connection failed:",
            error
        );

        process.exit(1);
    }
};

startServer();