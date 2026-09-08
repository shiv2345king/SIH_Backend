import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const socketAuth = async (
    socket,
    next
) => {
    try {
        const token =
            socket.handshake.auth?.token;

        if (!token) {
            return next(
                new Error("Authentication required")
            );
        }

        const decodedToken =
            jwt.verify(
                token,
                process.env.ACCESS_TOKEN_SECRET
            );

        if (!decodedToken?._id) {
            return next(
                new Error("Invalid access token")
            );
        }

        const user =
            await User.findById(
                decodedToken._id
            ).select(
                "_id name email role station isActive"
            );

        if (!user) {
            return next(
                new Error("User not found")
            );
        }

        if (!user.isActive) {
            return next(
                new Error("User account is inactive")
            );
        }

        socket.user = user;

        next();
    } catch (error) {
        console.error(
            "Socket authentication error:",
            error.message
        );

        return next(
            new Error(
                "Invalid or expired access token"
            )
        );
    }
};

export default socketAuth;