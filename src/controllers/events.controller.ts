import type { Request, Response } from "express";
import { EventsService } from "../services/events/events.service.js";
import {
  createEventSchema,
  eventIdParamsSchema,
  updateEventSchema,
} from "../validation/schemas.js";

export const EventsController = {
  list: async (_req: Request, res: Response) => {
    const events = await EventsService.list();
    res.json(events);
  },

  create: async (req: Request, res: Response) => {
    const payload = createEventSchema.parse(req.body ?? {});
    const name = payload.name ?? "Nuevo evento";
    const event = await EventsService.create({ name });
    res.status(201).json(event);
  },

  getById: async (req: Request, res: Response) => {
    const { eventId } = eventIdParamsSchema.parse(req.params);
    const event = await EventsService.getById(eventId);
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    res.json(event);
  },

  update: async (req: Request, res: Response) => {
    const { eventId } = eventIdParamsSchema.parse(req.params);
    const { name, room_width_m, room_height_m } = updateEventSchema.parse(
      req.body,
    );
    const event = await EventsService.update(eventId, {
      name,
      ...(room_width_m !== undefined ? { room_width_m } : {}),
      ...(room_height_m !== undefined ? { room_height_m } : {}),
    });
    res.json(event);
  },

  delete: async (req: Request, res: Response) => {
    const { eventId } = eventIdParamsSchema.parse(req.params);
    await EventsService.remove(eventId);
    res.status(204).send();
  },
};
