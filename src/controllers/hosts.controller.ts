import type { Request, Response } from "express";
import { HostsService } from "../services/hosts/hosts.service.js";

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

export const HostsController = {
  list: async (req: Request, res: Response) => {
    try {
      const eventId = parseEventId(req);
      if (!eventId) {
        res.status(400).json({ error: "Invalid event id" });
        return;
      }
      const hosts = await HostsService.list(eventId);
      res.json(hosts);
    } catch {
      res.status(500).json({ error: "Failed to list hosts" });
    }
  },

  replace: async (req: Request, res: Response) => {
    try {
      const eventId = parseEventId(req);
      if (!eventId) {
        res.status(400).json({ error: "Invalid event id" });
        return;
      }
      const payload = req.body ?? {};
      const names = Array.isArray(payload.names) ? payload.names : [];
      const hosts = await HostsService.replace(eventId, names);
      res.json(hosts);
    } catch {
      res.status(400).json({ error: "Failed to replace hosts" });
    }
  },
};
