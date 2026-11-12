import { Router } from "express";
import { HostsController } from "../controllers/hosts.controller.js";

const router = Router({ mergeParams: true });

router.get("/", HostsController.list);
router.put("/", HostsController.replace);

export default router;

