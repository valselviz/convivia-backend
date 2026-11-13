import type { Request, Response } from "express";
import { TableAssignmentsService } from "../services/table-assignments/table-assignments.service.js";
import {
  eventGuestParamsSchema,
  eventIdParamsSchema,
  reassignSchema,
  setLockedSchema,
} from "../validation/schemas.js";

export const TableAssignmentsController = {
  list: async (req: Request, res: Response) => {
    const { eventId } = eventIdParamsSchema.parse(req.params);
    const assignments = await TableAssignmentsService.list(eventId);
    res.json(assignments);
  },

  reassign: async (req: Request, res: Response) => {
    const { eventId } = eventIdParamsSchema.parse(req.params);
    const payload = reassignSchema.parse(req.body);
    const result = await TableAssignmentsService.reassign({
      eventId,
      guestId: payload.guest_id,
      tableId: payload.table_id,
      seatNumber: payload.seat_number ?? null,
    });
    res.json(result);
  },

  unassign: async (req: Request, res: Response) => {
    const { eventId, guestId } = eventGuestParamsSchema.parse(req.params);
    await TableAssignmentsService.unassign(eventId, guestId);
    res.status(204).send();
  },

  setLocked: async (req: Request, res: Response) => {
    const { eventId, guestId } = eventGuestParamsSchema.parse(req.params);
    const { locked } = setLockedSchema.parse(req.body);
    const assignment = await TableAssignmentsService.setLocked(
      eventId,
      guestId,
      locked,
    );
    res.json(assignment);
  },

  unlockAll: async (req: Request, res: Response) => {
    const { eventId } = eventIdParamsSchema.parse(req.params);
    const count = await TableAssignmentsService.unlockAll(eventId);
    res.json({ count });
  },
};
