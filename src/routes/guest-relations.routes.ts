import { Router } from "express";
import { GuestRelationsController } from "../controllers/guest-relations.controller.js";

const router = Router({ mergeParams: true });

router.get("/", GuestRelationsController.list);
router.post("/", GuestRelationsController.create);
router.patch("/:id", GuestRelationsController.update);
router.delete("/:id", GuestRelationsController.delete);

export default router;
