import type { Request, Response } from "express";
import { TablesService } from "../services/tables/tables.service.js";
import { TableAssignmentsService } from "../services/table-assignments/table-assignments.service.js";
import {
  assignGuestSchema,
  createTableSchema,
  eventIdParamsSchema,
  idParamsSchema,
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
      shape: payload.shape ?? null,
      seats: payload.seats,
      category: payload.category ?? null,
    });
    res.status(201).json(table);
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
