import type { Request, Response } from "express";
import { GuestGroupsService } from "../services/guest-groups/guest-groups.service.js";
import {
  addMembersSchema,
  createGroupSchema,
  eventIdParamsSchema,
  guestIdParamsSchema,
  idParamsSchema,
  updateGroupSchema,
} from "../validation/schemas.js";

export const GuestGroupsController = {
  list: async (req: Request, res: Response) => {
    const { eventId } = eventIdParamsSchema.parse(req.params);
    const groups = await GuestGroupsService.list(eventId);
    res.json(groups);
  },
  getById: async (req: Request, res: Response) => {
    const { eventId, id } = idParamsSchema.parse(req.params);
    const group = await GuestGroupsService.getById(eventId, id);
    if (!group) {
      res.status(404).json({ error: "Group not found" });
      return;
    }
    res.json(group);
  },
  create: async (req: Request, res: Response) => {
    const { eventId } = eventIdParamsSchema.parse(req.params);
    const payload = createGroupSchema.parse(req.body);
    const group = await GuestGroupsService.create(eventId, {
      name: payload.name,
      category: payload.category ?? null,
    });
    res.status(201).json(group);
  },
  update: async (req: Request, res: Response) => {
    const { eventId, id } = idParamsSchema.parse(req.params);
    const payload = updateGroupSchema.parse(req.body);
    const group = await GuestGroupsService.update(eventId, id, {
      name: payload.name,
      category: payload.category,
    });
    res.json(group);
  },
  delete: async (req: Request, res: Response) => {
    const { eventId, id } = idParamsSchema.parse(req.params);
    await GuestGroupsService.delete(eventId, id);
    res.status(204).send();
  },
  addMembers: async (req: Request, res: Response) => {
    const { eventId, id } = idParamsSchema.parse(req.params);
    const { guestIds } = addMembersSchema.parse(req.body);
    await GuestGroupsService.addMembers(eventId, id, guestIds);
    const group = await GuestGroupsService.getById(eventId, id);
    res.json(group);
  },
  removeMember: async (req: Request, res: Response) => {
    const { eventId, id, guestId } = guestIdParamsSchema.parse(req.params);
    await GuestGroupsService.removeMember(eventId, id, guestId);
    res.status(204).send();
  },
};
