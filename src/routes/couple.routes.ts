import { Router } from "express";
import { CoupleController } from "../controllers/couple.controller.js";

const router = Router();

router.get("/", CoupleController.get);
router.put("/", CoupleController.upsert);

export default router;
