import { Router } from "express";
import { GuestsController } from "../controllers/guests.controller.js";

const router = Router();

router.get("/", GuestsController.list);
router.post("/", GuestsController.create);
router.patch("/:id", GuestsController.update);
router.delete("/:id", GuestsController.delete);

export default router;
