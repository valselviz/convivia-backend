import type { Request, Response } from "express";
import { GuestGroupsService } from "../services/guest-groups/guest-groups.service.js";

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

export const GuestGroupsController = {
  list: async (req: Request, res: Response) => {
    try {
      const eventId = parseEventId(req);
      if (!eventId) {
        res.status(400).json({ error: "Invalid event id" });
        return;
      }
      const groups = await GuestGroupsService.list(eventId);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: "Failed to list groups" });
    }
  },
  getById: async (req: Request, res: Response) => {
    try {
      const eventId = parseEventId(req);
      const id = parseNumber(req.params.id);
      if (!eventId || !id) {
        res.status(400).json({ error: "Invalid id" });
        return;
      }
      const group = await GuestGroupsService.getById(eventId, id);
      if (!group) {
        res.status(404).json({ error: "Group not found" });
        return;
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: "Failed to get group" });
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
      const group = await GuestGroupsService.create(eventId, {
        name: payload.name,
        category: payload.category ?? null,
      });

      res.status(201).json(group);
    } catch (error) {
      res.status(400).json({ error: "Failed to create group" });
    }
  },
  update: async (req: Request, res: Response) => {
    try {
      const eventId = parseEventId(req);
      const id = parseNumber(req.params.id);
      if (!eventId || !id) {
        res.status(400).json({ error: "Invalid group id" });
        return;
      }
      const payload = req.body ?? {};
      const group = await GuestGroupsService.update(eventId, id, {
        name: payload.name,
        category: payload.category,
      });
      res.json(group);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update group";
      const status = message === "Group not found" ? 404 : 400;
      res.status(status).json({ error: message });
    }
  },
  delete: async (req: Request, res: Response) => {
    try {
      const eventId = parseEventId(req);
      const id = parseNumber(req.params.id);
      if (!eventId || !id) {
        res.status(400).json({ error: "Invalid group id" });
        return;
      }
      await GuestGroupsService.delete(eventId, id);
      res.status(204).send();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete group";
      const status = message === "Group not found" ? 404 : 400;
      res.status(status).json({ error: message });
    }
  },
  addMembers: async (req: Request, res: Response) => {
    try {
      const eventId = parseEventId(req);
      const id = parseNumber(req.params.id);
      if (!eventId || !id) {
        res.status(400).json({ error: "Invalid group id" });
        return;
      }
      const payload = req.body ?? {};
      const guestIds = Array.isArray(payload.guestIds)
        ? payload.guestIds
            .map(parseNumber)
            .filter(
              (id: number | undefined): id is number => id !== undefined,
            )
        : [];

      if (guestIds.length === 0) {
        res.status(400).json({ error: "No guest IDs provided" });
        return;
      }

      await GuestGroupsService.addMembers(eventId, id, guestIds);
      const group = await GuestGroupsService.getById(eventId, id);
      res.json(group);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add members";
      res.status(400).json({ error: message });
    }
  },
  removeMember: async (req: Request, res: Response) => {
    try {
      const eventId = parseEventId(req);
      const groupId = parseNumber(req.params.id);
      const guestId = parseNumber(req.params.guestId);
      if (!eventId || !groupId || !guestId) {
        res.status(400).json({ error: "Invalid group or guest id" });
        return;
      }
      await GuestGroupsService.removeMember(eventId, groupId, guestId);
      res.status(204).send();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to remove member";
      res.status(400).json({ error: message });
    }
  },
};
