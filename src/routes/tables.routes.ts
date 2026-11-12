import { Router } from "express";
import { TablesController } from "../controllers/tables.controller.js";

const router = Router({ mergeParams: true });

router.get("/", TablesController.list);
router.post("/", TablesController.create);
router.post("/:id/assign", TablesController.assignGuest);

export default router;
