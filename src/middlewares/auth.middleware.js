import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const verifyJwt = async (req, res, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req
                .header("Authorization")
                ?.replace(/^Bearer\s+/i, "");

        if (!token) {
            return res.status(401).json({
                message: "No access token found"
            });
        }

        const decodedToken = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        );

        console.log("===== JWT DEBUG =====");
        console.log("Decoded token:", decodedToken);
        console.log("=====================");

        const user = await User.findById(decodedToken._id);

        console.log("===== DATABASE USER DEBUG =====");
        console.log("User document:", user);
        console.log("User ID:", user?._id);
        console.log("User name:", user?.name);
        console.log("User email:", user?.email);
        console.log("User role:", user?.role);
        console.log("User station:", user?.station);
        console.log("==============================");

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                message: "User account is inactive"
            });
        }

        req.user = user;

        next();
    } catch (error) {
        console.error("JWT verification error:", error);

        return res.status(401).json({
            message: "Invalid or expired access token"
        });
    }
};

export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        console.log("===== ROLE DEBUG =====");
        console.log("req.user:", req.user);
        console.log("Actual role:", req.user?.role);
        console.log("Allowed roles:", allowedRoles);
        console.log("======================");

        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "You do not have permission to perform this action"
            });
        }

        next();
    };
};