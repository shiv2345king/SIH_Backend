import {
    startSimulation,
    stopSimulation,
    getSimulationStatus,
    saveSimulationSnapshot
} from "../services/simulation.service.js";

const startSimulationController =
    async (req, res) => {
        try {
            const stationId =
                req.body?.station_id;

            if (!stationId) {
                return res.status(400).json({
                    message:
                        "station_id is required"
                });
            }

            const result =
                await startSimulation(
                    stationId
                );

            return res.status(200).json(
                result
            );
        } catch (error) {
            console.error(
                "Start simulation error:",
                error
            );

            return res.status(500).json({
                message:
                    error.message ||
                    "Failed to start simulation"
            });
        }
    };

const stopSimulationController =
    (req, res) => {
        try {
            const result =
                stopSimulation();

            return res.status(200).json(
                result
            );
        } catch (error) {
            console.error(
                "Stop simulation error:",
                error
            );

            return res.status(500).json({
                message:
                    "Failed to stop simulation"
            });
        }
    };

const getSimulationStatusController =
    (req, res) => {
        return res.status(200).json(
            getSimulationStatus()
        );
    };

const generateSimulationSnapshot =
    async (req, res) => {
        try {
            const stationId =
                req.body?.station_id;

            if (!stationId) {
                return res.status(400).json({
                    message:
                        "station_id is required"
                });
            }

            const result =
                await saveSimulationSnapshot(
                    stationId
                );

            return res.status(201).json({
                message:
                    "Simulation snapshot generated successfully",

                result
            });
        } catch (error) {
            console.error(
                "Generate simulation snapshot error:",
                error
            );

            return res.status(500).json({
                message:
                    error.message ||
                    "Failed to generate simulation snapshot"
            });
        }
    };

export {
    startSimulationController,
    stopSimulationController,
    getSimulationStatusController,
    generateSimulationSnapshot
};