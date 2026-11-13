import { Router } from "express";
import { EventsController } from "../controllers/events.controller.js";
import guestsRouter from "./guests.routes.js";
import hostsRouter from "./hosts.routes.js";
import guestGroupsRouter from "./guest-groups.routes.js";
import tablesRouter from "./tables.routes.js";
import guestRelationsRouter from "./guest-relations.routes.js";
import tableAssignmentsRouter from "./table-assignments.routes.js";

const eventScoped = Router({ mergeParams: true });

eventScoped.get("/", EventsController.getById);
eventScoped.patch("/", EventsController.update);
eventScoped.delete("/", EventsController.delete);

eventScoped.use("/guests", guestsRouter);
eventScoped.use("/hosts", hostsRouter);
eventScoped.use("/groups", guestGroupsRouter);
eventScoped.use("/tables", tablesRouter);
eventScoped.use("/relations", guestRelationsRouter);
eventScoped.use("/assignments", tableAssignmentsRouter);

const eventsRouter = Router();
eventsRouter.get("/", EventsController.list);
eventsRouter.post("/", EventsController.create);
eventsRouter.use("/:eventId", eventScoped);

export default eventsRouter;
