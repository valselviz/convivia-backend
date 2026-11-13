import { Router } from "express";
import { TablesController } from "../controllers/tables.controller.js";

const router = Router({ mergeParams: true });

router.get("/", TablesController.list);
router.post("/", TablesController.create);
router.patch("/:id", TablesController.update);
router.delete("/:id", TablesController.delete);
router.post("/:id/assign", TablesController.assignGuest);

export default router;
