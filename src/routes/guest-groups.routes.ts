import { Router } from "express";
import { GuestGroupsController } from "../controllers/guest-groups.controller.js";

const router = Router();

router.get("/", GuestGroupsController.list);
router.get("/:id", GuestGroupsController.getById);
router.post("/", GuestGroupsController.create);
router.put("/:id", GuestGroupsController.update);
router.delete("/:id", GuestGroupsController.delete);
router.post("/:id/members", GuestGroupsController.addMembers);
router.delete("/:id/members/:guestId", GuestGroupsController.removeMember);

export default router;
