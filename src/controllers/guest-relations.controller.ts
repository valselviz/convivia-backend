import type { Request, Response } from "express";
import {
  Prisma,
  GuestRelationKind,
  GuestRelationSource,
} from "@prisma/client";
import { GuestRelationsService } from "../services/guest-relations/guest-relations.service.js";

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

const parseKind = (value: unknown): GuestRelationKind | undefined => {
  if (typeof value !== "string") return undefined;
  return Object.values(GuestRelationKind).includes(value as GuestRelationKind)
    ? (value as GuestRelationKind)
    : undefined;
};

const parseSource = (value: unknown): GuestRelationSource | undefined => {
  if (typeof value !== "string") return undefined;
  return Object.values(GuestRelationSource).includes(
    value as GuestRelationSource,
  )
    ? (value as GuestRelationSource)
    : undefined;
};

const parseEventId = (req: Request): number | undefined =>
  parseNumber(req.params.eventId);

export const GuestRelationsController = {
  list: async (req: Request, res: Response) => {
    try {
      const eventId = parseEventId(req);
      if (!eventId) {
        res.status(400).json({ error: "Invalid event id" });
        return;
      }
      const rows = await GuestRelationsService.list(eventId);
      res.json(rows);
    } catch {
      res.status(500).json({ error: "Failed to list relations" });
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
      const guest_id_1 = parseNumber(payload.guest_id_1 ?? payload.guestId1);
      const guest_id_2 = parseNumber(payload.guest_id_2 ?? payload.guestId2);
      const kind = parseKind(payload.kind);
      if (!guest_id_1 || !guest_id_2 || !kind) {
        res
          .status(400)
          .json({ error: "guest_id_1, guest_id_2 and kind are required" });
        return;
      }
      const source = parseSource(payload.source);
      const row = await GuestRelationsService.create(eventId, {
        guest_id_1,
        guest_id_2,
        kind,
        strength: parseNumber(payload.strength),
        ...(source ? { source } : {}),
        notes: typeof payload.notes === "string" ? payload.notes : null,
      });
      res.status(201).json(row);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        res.status(409).json({ error: "Relation already exists" });
        return;
      }
      const message =
        error instanceof Error ? error.message : "Failed to create relation";
      res.status(400).json({ error: message });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const eventId = parseEventId(req);
      const id = parseNumber(req.params.id);
      if (!eventId || !id) {
        res.status(400).json({ error: "Invalid id" });
        return;
      }
      const payload = req.body ?? {};
      const source = parseSource(payload.source);
      const strengthRaw = parseNumber(payload.strength);
      const data: Prisma.GuestRelationUpdateInput = {};
      if (strengthRaw !== undefined) {
        data.strength = Math.min(5, Math.max(1, strengthRaw));
      }
      if (source) {
        data.source = source;
      }
      if (payload.notes !== undefined) {
        data.notes =
          typeof payload.notes === "string" ? payload.notes : null;
      }
      if (Object.keys(data).length === 0) {
        res.status(400).json({ error: "No fields to update" });
        return;
      }
      const row = await GuestRelationsService.update(eventId, id, data);
      res.json(row);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update relation";
      res.status(400).json({ error: message });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const eventId = parseEventId(req);
      const id = parseNumber(req.params.id);
      if (!eventId || !id) {
        res.status(400).json({ error: "Invalid id" });
        return;
      }
      await GuestRelationsService.remove(eventId, id);
      res.status(204).send();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete relation";
      res.status(400).json({ error: message });
    }
  },
};
