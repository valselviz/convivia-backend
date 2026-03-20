import type { Request, Response } from "express";
import { HostsService } from "../services/hosts/hosts.service.js";

export const HostsController = {
  list: async (_req: Request, res: Response) => {
    try {
      const hosts = await HostsService.list();
      res.json(hosts);
    } catch {
      res.status(500).json({ error: "Failed to list hosts" });
    }
  },

  replace: async (req: Request, res: Response) => {
    try {
      const payload = req.body ?? {};
      const names = Array.isArray(payload.names) ? payload.names : [];
      const hosts = await HostsService.replace(names);
      res.json(hosts);
    } catch {
      res.status(400).json({ error: "Failed to replace hosts" });
    }
  },
};

