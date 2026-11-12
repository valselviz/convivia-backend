import type { Request, Response } from "express";
import { EventsService } from "../services/events/events.service.js";

const parseNumber = (value: unknown): number | undefined => {
  if (typeof value === "number") {
    return Number.isNaN(value) ? undefined : value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

export const EventsController = {
  list: async (_req: Request, res: Response) => {
    try {
      const events = await EventsService.list();
      res.json(events);
    } catch {
      res.status(500).json({ error: "Failed to list events" });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const payload = req.body ?? {};
      const name =
        typeof payload.name === "string" && payload.name.trim()
          ? payload.name.trim()
          : "Nuevo evento";
      const event = await EventsService.create({ name });
      res.status(201).json(event);
    } catch {
      res.status(400).json({ error: "Failed to create event" });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const id = parseNumber(req.params.eventId);
      if (!id) {
        res.status(400).json({ error: "Invalid event id" });
        return;
      }
      const event = await EventsService.getById(id);
      if (!event) {
        res.status(404).json({ error: "Event not found" });
        return;
      }
      res.json(event);
    } catch {
      res.status(500).json({ error: "Failed to get event" });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = parseNumber(req.params.eventId);
      if (!id) {
        res.status(400).json({ error: "Invalid event id" });
        return;
      }
      const payload = req.body ?? {};
      const name =
        typeof payload.name === "string" && payload.name.trim()
          ? payload.name.trim()
          : undefined;
      if (!name) {
        res.status(400).json({ error: "name is required" });
        return;
      }
      const event = await EventsService.update(id, { name });
      res.json(event);
    } catch {
      res.status(400).json({ error: "Failed to update event" });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = parseNumber(req.params.eventId);
      if (!id) {
        res.status(400).json({ error: "Invalid event id" });
        return;
      }
      await EventsService.remove(id);
      res.status(204).send();
    } catch {
      res.status(400).json({ error: "Failed to delete event" });
    }
  },
};
