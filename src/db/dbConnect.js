import mongoose from "mongoose";

export default function dbConnect() {
    if(mongoose.connection.readyState === 1) {
        console.log("Connected to MongoDB");
    }
    try{
        const db = mongoose.connect(process.env.MONGODB_URI);
        console.log("Database connected successfully");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}