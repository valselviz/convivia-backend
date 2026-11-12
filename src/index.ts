import cors from "cors";
import express from "express";
import eventsRouter from "./routes/events.routes.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();

app.use(cors());
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
