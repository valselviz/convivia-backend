import type { Request, Response } from "express";
import { CoupleService } from "../services/couple/couple.service.js";

export const CoupleController = {
  get: async (_req: Request, res: Response) => {
    try {
      const couple = await CoupleService.get();
      res.json(couple);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch couple" });
    }
  },
  upsert: async (req: Request, res: Response) => {
    try {
      const payload = req.body ?? {};
      const couple = await CoupleService.upsert({
        bride_name: payload.bride_name,
        groom_name: payload.groom_name,
      });
      res.json(couple);
    } catch (error) {
      res.status(400).json({ error: "Failed to save couple" });
    }
  },
};
