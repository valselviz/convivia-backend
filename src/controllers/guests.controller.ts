import type { Request, Response } from "express";
import { GuestsService } from "../services/guests/guests.service.js";
import {
  createGuestSchema,
  idParamsSchema,
  updateGuestSchema,
  eventIdParamsSchema,
} from "../validation/schemas.js";

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

const parseString = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return undefined;
};

export const GuestsController = {
  list: async (req: Request, res: Response) => {
    const { eventId } = eventIdParamsSchema.parse(req.params);

    const statusRaw = req.query.status;
    const status =
      typeof statusRaw === "string" &&
      ["INVITED", "CONFIRMED", "DECLINED"].includes(statusRaw)
        ? (statusRaw as "INVITED" | "CONFIRMED" | "DECLINED")
        : undefined;
    const groupId = parseNumber(req.query.groupId);
    const tableId = parseNumber(req.query.tableId);
    const search = parseString(req.query.search);
    const hostName = parseString(req.query.hostName);
    const typeRaw = req.query.type;
    const type =
      typeof typeRaw === "string" &&
      ["MAIN_GUEST", "PLUS_ONE"].includes(typeRaw)
        ? (typeRaw as "MAIN_GUEST" | "PLUS_ONE")
        : undefined;
    const plusOne = req.query.plusOne === "only" ? "only" : "all";
    const order = req.query.order === "notes" ? "notes" : "name";

    const guests = await GuestsService.list({
      eventId,
      status,
      groupId,
      tableId,
      search,
      hostName,
      type,
      plusOne,
      order,
    });
    res.json(guests);
  },

  create: async (req: Request, res: Response) => {
    const { eventId } = eventIdParamsSchema.parse(req.params);
    const payload = createGuestSchema.parse(req.body);

    const guest = await GuestsService.create(eventId, {
      full_name: payload.full_name,
      guest_type: payload.guest_type,
      main_guest_id: payload.main_guest_id ?? undefined,
      host_name: payload.host_name ?? null,
      gender: payload.gender,
      age_range: payload.age_range,
      avatar_key: payload.avatar_key ?? null,
      notes: payload.notes ?? null,
      status: payload.status,
    });

    res.status(201).json(guest);
  },

  update: async (req: Request, res: Response) => {
    const { eventId, id } = idParamsSchema.parse(req.params);
    const payload = updateGuestSchema.parse(req.body);

    const guest = await GuestsService.update(eventId, id, {
      full_name: payload.full_name,
      guest_type: payload.guest_type,
      main_guest_id: payload.main_guest_id,
      host_name: payload.host_name,
      gender: payload.gender,
      age_range: payload.age_range,
      avatar_key: payload.avatar_key,
      notes: payload.notes,
      status: payload.status,
    });

    res.json(guest);
  },

  delete: async (req: Request, res: Response) => {
    const { eventId, id } = idParamsSchema.parse(req.params);
    await GuestsService.delete(eventId, [id]);
    res.status(204).send();
  },
};
