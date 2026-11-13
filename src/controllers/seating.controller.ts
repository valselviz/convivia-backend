import type { Request, Response } from "express";
import { SeatingService } from "../services/seating/seating.service.js";
import { autoAssignSchema, eventIdParamsSchema } from "../validation/schemas.js";

export const SeatingController = {
  autoAssign: async (req: Request, res: Response) => {
    const { eventId } = eventIdParamsSchema.parse(req.params);
    const { weights, seed } = autoAssignSchema.parse(req.body);
    const result = await SeatingService.autoAssign(eventId, weights, seed);
    res.json(result);
  },
};
