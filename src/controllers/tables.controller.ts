import type { Request, Response } from "express";
import { TablesService } from "../services/tables/tables.service.js";
import { TableAssignmentsService } from "../services/table-assignments/table-assignments.service.js";

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

const parseEventId = (req: Request): number | undefined =>
  parseNumber(req.params.eventId);

export const TablesController = {
  list: async (req: Request, res: Response) => {
    try {
      const eventId = parseEventId(req);
      if (!eventId) {
        res.status(400).json({ error: "Invalid event id" });
        return;
      }
      const tables = await TablesService.list(eventId);
      res.json(tables);
    } catch (error) {
      res.status(500).json({ error: "Failed to list tables" });
    }
  },
  create: async (req: Request, res: Response) => {
    try {
      const eventId = parseEventId(req);
      if (!eventId) {
        res.status(400).json({ error: "Invalid event id" });
        return;
      }
      const payload = req.body ?? {};
      const table = await TablesService.create(eventId, {
        name: payload.name,
        shape: payload.shape ?? null,
        seats: payload.seats,
        category: payload.category ?? null,
      });

      res.status(201).json(table);
    } catch (error) {
      res.status(400).json({ error: "Failed to create table" });
    }
  },
  assignGuest: async (req: Request, res: Response) => {
    try {
      const eventId = parseEventId(req);
      if (!eventId) {
        res.status(400).json({ error: "Invalid event id" });
        return;
      }

      const tableId = parseNumber(req.params.id);
      if (!tableId) {
        res.status(400).json({ error: "Invalid table id" });
        return;
      }

      const payload = req.body ?? {};
      const guestId = parseNumber(payload.guest_id);
      if (!guestId) {
        res.status(400).json({ error: "Invalid guest id" });
        return;
      }

      const assignment = await TableAssignmentsService.assign({
        eventId,
        tableId,
        guestId,
        seatNumber: parseNumber(payload.seat_number) ?? null,
      });

      res.status(201).json(assignment);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to assign guest";
      res.status(400).json({ error: message });
    }
  },
};
