import cors from "cors";
import express from "express";
import guestsRouter from "./routes/guests.routes.js";
import coupleRouter from "./routes/couple.routes.js";
import guestGroupsRouter from "./routes/guest-groups.routes.js";
import tablesRouter from "./routes/tables.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/static", express.static("public"));

app.get("/", (req, res) => {
  res.send("Convivia backend API");
});

app.use("/guests", guestsRouter);
app.use("/couple", coupleRouter);
app.use("/groups", guestGroupsRouter);
app.use("/tables", tablesRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
