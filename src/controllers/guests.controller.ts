import type { Request, Response } from "express";
import { Status } from "@prisma/client";
import { GuestsService } from "../services/guests/guests.service.js";

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

const parseStatus = (value: unknown): Status | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  return Object.values(Status).includes(value as Status)
    ? (value as Status)
    : undefined;
};

export const GuestsController = {
  list: async (req: Request, res: Response) => {
    try {
      const status = parseStatus(req.query.status);
      const groupId = parseNumber(req.query.groupId);
      const tableId = parseNumber(req.query.tableId);

      const guests = await GuestsService.list({ status, groupId, tableId });
      res.json(guests);
    } catch (error) {
      res.status(500).json({ error: "Failed to list guests" });
    }
  },
  create: async (req: Request, res: Response) => {
    try {
      const payload = req.body ?? {};
      const guest = await GuestsService.create({
        full_name: payload.full_name,
        guest_type: payload.guest_type,
        main_guest_id: parseNumber(payload.main_guest_id),
        side: payload.side ?? null,
        age_range: payload.age_range,
        notes: payload.notes ?? null,
        status: payload.status,
      });

      res.status(201).json(guest);
    } catch (error) {
      res.status(400).json({ error: "Failed to create guest" });
    }
  },
  update: async (req: Request, res: Response) => {
    try {
      const id = parseNumber(req.params.id);
      if (!id) {
        res.status(400).json({ error: "Invalid guest id" });
        return;
      }

      const payload = req.body ?? {};
      const guest = await GuestsService.update(id, {
        full_name: payload.full_name,
        guest_type: payload.guest_type,
        main_guest_id: parseNumber(payload.main_guest_id),
        side: payload.side,
        age_range: payload.age_range,
        notes: payload.notes,
        status: payload.status,
      });

      res.json(guest);
    } catch (error) {
      res.status(400).json({ error: "Failed to update guest" });
    }
  },
  delete: async (req: Request, res: Response) => {
    try {
      const id = parseNumber(req.params.id);
      if (!id) {
        res.status(400).json({ error: "Invalid guest id" });
        return;
      }
      await GuestsService.delete([id]);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to delete guest" });
    }
  },
};
