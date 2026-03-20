import { Router } from "express";
import { HostsController } from "../controllers/hosts.controller.js";

const router = Router();

router.get("/", HostsController.list);
router.put("/", HostsController.replace);

export default router;

