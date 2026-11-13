import type { Request, Response } from "express";
import { TablesService } from "../services/tables/tables.service.js";
import { TableAssignmentsService } from "../services/table-assignments/table-assignments.service.js";
import {
  assignGuestSchema,
  createTableSchema,
  eventIdParamsSchema,
  idParamsSchema,
  updateTableSchema,
} from "../validation/schemas.js";

export const TablesController = {
  list: async (req: Request, res: Response) => {
    const { eventId } = eventIdParamsSchema.parse(req.params);
    const tables = await TablesService.list(eventId);
    res.json(tables);
  },
  create: async (req: Request, res: Response) => {
    const { eventId } = eventIdParamsSchema.parse(req.params);
    const payload = createTableSchema.parse(req.body);
    const table = await TablesService.create(eventId, {
      name: payload.name,
      shape: payload.shape,
      seats: payload.seats,
      min_seats: payload.min_seats ?? null,
      category: payload.category ?? null,
      pos_x: payload.pos_x ?? null,
      pos_y: payload.pos_y ?? null,
      ...(payload.width !== undefined ? { width: payload.width } : {}),
      ...(payload.height !== undefined ? { height: payload.height } : {}),
    });
    res.status(201).json(table);
  },
  update: async (req: Request, res: Response) => {
    const { eventId, id } = idParamsSchema.parse(req.params);
    const payload = updateTableSchema.parse(req.body);
    const table = await TablesService.update(eventId, id, payload);
    res.json(table);
  },
  delete: async (req: Request, res: Response) => {
    const { eventId, id } = idParamsSchema.parse(req.params);
    await TablesService.delete(eventId, id);
    res.status(204).send();
  },
  assignGuest: async (req: Request, res: Response) => {
    const { eventId, id: tableId } = idParamsSchema.parse(req.params);
    const payload = assignGuestSchema.parse(req.body);

    const assignment = await TableAssignmentsService.assign({
      eventId,
      tableId,
      guestId: payload.guest_id,
      seatNumber: payload.seat_number ?? null,
    });

    res.status(201).json(assignment);
  },
};
