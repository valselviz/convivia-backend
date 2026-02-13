import prisma from "../../client.js";
import type { Couple, Prisma } from "@prisma/client";

export const CoupleService = {
  get: async (): Promise<Couple | null> => {
    return prisma.couple.findFirst({ orderBy: { id: "asc" } });
  },
  upsert: async (
    data: Prisma.CoupleUncheckedCreateInput,
  ): Promise<Couple> => {
    const existing = await prisma.couple.findFirst({ orderBy: { id: "asc" } });
    if (!existing) {
      return prisma.couple.create({ data });
    }
    return prisma.couple.update({
      where: { id: existing.id },
      data,
    });
  },
};
