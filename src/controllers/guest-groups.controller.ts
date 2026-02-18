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

export const GuestGroupsController = {
  list: async (_req: Request, res: Response) => {
    try {
      const groups = await GuestGroupsService.list();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: "Failed to list groups" });
    }
  },
  getById: async (req: Request, res: Response) => {
    try {
      const id = parseNumber(req.params.id);
      if (!id) {
        res.status(400).json({ error: "Invalid group id" });
        return;
      }
      const group = await GuestGroupsService.getById(id);
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
      const payload = req.body ?? {};
      const group = await GuestGroupsService.create({
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
      const id = parseNumber(req.params.id);
      if (!id) {
        res.status(400).json({ error: "Invalid group id" });
        return;
      }
      const payload = req.body ?? {};
      const group = await GuestGroupsService.update(id, {
        name: payload.name,
        category: payload.category,
      });
      res.json(group);
    } catch (error) {
      res.status(400).json({ error: "Failed to update group" });
    }
  },
  delete: async (req: Request, res: Response) => {
    try {
      const id = parseNumber(req.params.id);
      if (!id) {
        res.status(400).json({ error: "Invalid group id" });
        return;
      }
      await GuestGroupsService.delete(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to delete group" });
    }
  },
  addMembers: async (req: Request, res: Response) => {
    try {
      const id = parseNumber(req.params.id);
      if (!id) {
        res.status(400).json({ error: "Invalid group id" });
        return;
      }
      const payload = req.body ?? {};
      const guestIds = Array.isArray(payload.guestIds)
        ? payload.guestIds.map(parseNumber).filter((id): id is number => id !== undefined)
        : [];

      if (guestIds.length === 0) {
        res.status(400).json({ error: "No guest IDs provided" });
        return;
      }

      await GuestGroupsService.addMembers(id, guestIds);
      const group = await GuestGroupsService.getById(id);
      res.json(group);
    } catch (error) {
      res.status(400).json({ error: "Failed to add members" });
    }
  },
  removeMember: async (req: Request, res: Response) => {
    try {
      const groupId = parseNumber(req.params.id);
      const guestId = parseNumber(req.params.guestId);
      if (!groupId || !guestId) {
        res.status(400).json({ error: "Invalid group or guest id" });
        return;
      }
      await GuestGroupsService.removeMember(groupId, guestId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to remove member" });
    }
  },
};
