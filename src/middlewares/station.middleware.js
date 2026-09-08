const authorizeStation = (
    req,
    res,
    next
) => {
    try {
        // User must already be authenticated
        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        // Station code comes from URL
        // Example:
        // /api/v1/stations/MAITRI
        const requestedStation =
            req.params.code
                ?.trim()
                .toUpperCase();

        if (!requestedStation) {
            return res.status(400).json({
                message:
                    "Station code is required"
            });
        }

        /*
         * NCPOR Operator
         * ----------------
         * Global access to all stations.
         */
        if (
            req.user.role ===
            "NCPOR Operator"
        ) {
            return next();
        }

        /*
         * Logistics Manager
         * -----------------
         * Works centrally from India.
         * Does not need a station assignment.
         * Has access to station information.
         */
        if (
            req.user.role ===
            "Logistics Manager"
        ) {
            return next();
        }

        /*
         * Station Manager
         * ---------------
         * Must be assigned to a station
         * and can access only that station.
         */
        if (
            req.user.role ===
            "Station Manager"
        ) {
            if (!req.user.station) {
                return res.status(403).json({
                    message:
                        "User is not assigned to any station"
                });
            }

            const userStation =
                req.user.station
                    .trim()
                    .toUpperCase();

            if (
                userStation !==
                requestedStation
            ) {
                return res.status(403).json({
                    message:
                        "You do not have access to this station"
                });
            }

            return next();
        }

        /*
         * Unknown or unsupported role
         */
        return res.status(403).json({
            message:
                "You do not have permission to access this station"
        });

    } catch (error) {
        console.error(
            "Station authorization error:",
            error
        );

        return res.status(500).json({
            message:
                "Station authorization failed"
        });
    }
};

export default authorizeStation;