import prisma from "../../client.js";
import type { Prisma, Table } from "@prisma/client";

export const TablesService = {
  list: async (eventId: number): Promise<Table[]> => {
    return prisma.table.findMany({
      where: { event_id: eventId },
      orderBy: { id: "asc" },
    });
  },
  create: async (
    eventId: number,
    data: Omit<Prisma.TableUncheckedCreateInput, "event_id">,
  ): Promise<Table> => {
    return prisma.table.create({
      data: {
        ...data,
        event_id: eventId,
      },
    });
  },
};
