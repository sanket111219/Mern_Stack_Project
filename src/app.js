import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//routes import
import userRouter from "./routes/user.routes.js";
import vidoeRouter from "./routes/video.routes.js";
import subcscriptionRouter from "./routes/subscription.routes.js";
//routes declaration

app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", vidoeRouter);
app.use("/api/v1/subscriptions", subcscriptionRouter);

export { app };
