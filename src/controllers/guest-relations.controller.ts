import type { Request, Response } from "express";
import { GuestRelationsService } from "../services/guest-relations/guest-relations.service.js";
import {
  createRelationSchema,
  eventIdParamsSchema,
  idParamsSchema,
  updateRelationSchema,
} from "../validation/schemas.js";

export const GuestRelationsController = {
  list: async (req: Request, res: Response) => {
    const { eventId } = eventIdParamsSchema.parse(req.params);
    const rows = await GuestRelationsService.list(eventId);
    res.json(rows);
  },

  create: async (req: Request, res: Response) => {
    const { eventId } = eventIdParamsSchema.parse(req.params);
    const payload = req.body ?? {};
    const normalized = {
      guest_id_1: payload.guest_id_1 ?? payload.guestId1,
      guest_id_2: payload.guest_id_2 ?? payload.guestId2,
      kind: payload.kind,
      strength: payload.strength,
      source: payload.source,
      notes: payload.notes,
    };
    const input = createRelationSchema.parse(normalized);

    const row = await GuestRelationsService.create(eventId, input);
    res.status(201).json(row);
  },

  update: async (req: Request, res: Response) => {
    const { eventId, id } = idParamsSchema.parse(req.params);
    const payload = updateRelationSchema.parse(req.body);
    const row = await GuestRelationsService.update(eventId, id, payload);
    res.json(row);
  },

  delete: async (req: Request, res: Response) => {
    const { eventId, id } = idParamsSchema.parse(req.params);
    await GuestRelationsService.remove(eventId, id);
    res.status(204).send();
  },
};
