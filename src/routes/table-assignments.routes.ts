import { Router } from "express";
import { TableAssignmentsController } from "../controllers/table-assignments.controller.js";

const router = Router({ mergeParams: true });

router.get("/", TableAssignmentsController.list);
router.put("/", TableAssignmentsController.reassign);
router.post("/unlock-all", TableAssignmentsController.unlockAll);
router.patch("/:guestId/lock", TableAssignmentsController.setLocked);
router.delete("/:guestId", TableAssignmentsController.unassign);

export default router;
