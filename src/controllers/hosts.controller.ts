import type { Request, Response } from "express";
import { HostsService } from "../services/hosts/hosts.service.js";
import { eventIdParamsSchema, replaceHostsSchema } from "../validation/schemas.js";

export const HostsController = {
  list: async (req: Request, res: Response) => {
    const { eventId } = eventIdParamsSchema.parse(req.params);
    const hosts = await HostsService.list(eventId);
    res.json(hosts);
  },

  replace: async (req: Request, res: Response) => {
    const { eventId } = eventIdParamsSchema.parse(req.params);
    const { names } = replaceHostsSchema.parse(req.body ?? {});
    const hosts = await HostsService.replace(eventId, names);
    res.json(hosts);
  },
};
