import { Server } from "socket.io";
import socketAuth from "../middlewares/socket.middleware.js";

let io;

const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin:
                process.env.FRONTEND_URL,
            credentials: true
        }
    });

    io.use(socketAuth);

    io.on(
        "connection",
        (socket) => {
            const user =
                socket.user;

            console.log(
                `Socket connected: ${socket.id} - ${user.role}`
            );

            if (
                user.role ===
                "NCPOR Operator"
            ) {
                socket.join(
                    "global:monitoring"
                );

                socket.join(
                    "station:MAITRI"
                );

                socket.join(
                    "station:BHARATI"
                );
            } else if (
                user.station
            ) {
                const station =
                    user.station
                        .trim()
                        .toUpperCase();

                socket.join(
                    `station:${station}`
                );
            }

            socket.on(
                "disconnect",
                (reason) => {
                    console.log(
                        `Socket disconnected: ${socket.id} - ${reason}`
                    );
                }
            );
        }
    );

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error(
            "Socket.IO has not been initialized"
        );
    }

    return io;
};

const emitToStation = (
    stationCode,
    event,
    data
) => {
    const normalizedStation =
        stationCode
            .trim()
            .toUpperCase();

    getIO()
        .to(
            `station:${normalizedStation}`
        )
        .emit(
            event,
            data
        );
};

const emitToGlobalMonitoring = (
    event,
    data
) => {
    getIO()
        .to("global:monitoring")
        .emit(
            event,
            data
        );
};

const emitVehicleLocation = (
    stationCode,
    data
) => {
    emitToStation(
        stationCode,
        "vehicle:location",
        data
    );

    emitToGlobalMonitoring(
        "vehicle:location",
        data
    );
};

const emitAlertCreated = (
    stationCode,
    data
) => {
    emitToStation(
        stationCode,
        "alert:created",
        data
    );

    emitToGlobalMonitoring(
        "alert:created",
        data
    );
};

const emitAlertResolved = (
    stationCode,
    data
) => {
    emitToStation(
        stationCode,
        "alert:resolved",
        data
    );

    emitToGlobalMonitoring(
        "alert:resolved",
        data
    );
};

const emitRequirementCreated = (
    stationCode,
    data
) => {
    emitToStation(
        stationCode,
        "requirement:created",
        data
    );

    emitToGlobalMonitoring(
        "requirement:created",
        data
    );
};

const emitRequirementUpdated = (
    stationCode,
    data
) => {
    emitToStation(
        stationCode,
        "requirement:updated",
        data
    );

    emitToGlobalMonitoring(
        "requirement:updated",
        data
    );
};

const emitCargoUpdated = (
    stationCode,
    data
) => {
    emitToStation(
        stationCode,
        "cargo:updated",
        data
    );

    emitToGlobalMonitoring(
        "cargo:updated",
        data
    );
};

export {
    initializeSocket,
    getIO,
    emitToStation,
    emitToGlobalMonitoring,
    emitVehicleLocation,
    emitAlertCreated,
    emitAlertResolved,
    emitRequirementCreated,
    emitRequirementUpdated,
    emitCargoUpdated
};