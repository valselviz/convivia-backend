import { Router } from "express";
import { SeatingController } from "../controllers/seating.controller.js";

const router = Router({ mergeParams: true });

router.post("/auto-assign", SeatingController.autoAssign);

export default router;
