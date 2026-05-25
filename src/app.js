import express from "express";
import { createServer } from "node:http";

import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";

import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";

import userRoutes from "./routes/users.routes.js";
import aiRoutes from "./routes/ai.routes.js";

dotenv.config({
    path: ".env"
});

const app = express();
const server = createServer(app);

connectToSocket(server);

app.set("port", process.env.PORT || 8000);

/* ---------------- SECURITY + CORS ---------------- */

app.use(
    helmet({
        crossOriginResourcePolicy: false,
    })
);

app.use(cors({
    origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002"
        "https://6a14720517600f432d555834--friendly-rolypoly-3ba449.netlify.app/"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.options("*", cors());

/* ---------------- MIDDLEWARE ---------------- */

app.use(compression());

app.use(express.json({
    limit: "40kb"
}));

app.use(express.urlencoded({
    limit: "40kb",
    extended: true
}));

/* ---------------- ROUTES ---------------- */

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/ai", aiRoutes);

app.get("/health", (req, res) => {
    res.status(200).json({
        ok: true
    });
});

/* ---------------- DATABASE + SERVER ---------------- */

const start = async () => {
    try {

        const mongoUri = process.env.MONGO_URI;

        if (!mongoUri) {
            throw new Error("Missing MONGO_URI in environment.");
        }

        const connectionDb = await mongoose.connect(mongoUri);

        console.log(
            `MONGO Connected DB Host: ${connectionDb.connection.host}`
        );

        server.listen(app.get("port"), () => {
            console.log(
                `LISTENING ON PORT ${app.get("port")}`
            );
        });

    } catch (err) {
        console.log("FULL ERROR =>", err);
    }
};

start();