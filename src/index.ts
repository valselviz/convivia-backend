import cors from "cors";
import express from "express";
import eventsRouter from "./routes/events.routes.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use("/static", express.static("public"));

app.get("/", (req, res) => {
  res.send("Convivia backend API");
});

app.use("/events", eventsRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
