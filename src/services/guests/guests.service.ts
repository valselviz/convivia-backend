import prisma from "../../client.js";
import type { Guest, Prisma, Status } from "@prisma/client";

export type GuestListFilters = {
  status?: Status;
  groupId?: number;
  tableId?: number;
};

export const GuestsService = {
  list: async (filters: GuestListFilters = {}): Promise<Guest[]> => {
    const { status, groupId, tableId } = filters;

    return prisma.guest.findMany({
      where: {
        status,
        group_members: groupId
          ? {
              some: { group_id: groupId },
            }
          : undefined,
        table_assignments: tableId
          ? {
              some: { table_id: tableId },
            }
          : undefined,
      },
      orderBy: { id: "asc" },
    });
  },
  create: async (data: Prisma.GuestUncheckedCreateInput): Promise<Guest> => {
    return prisma.guest.create({ data });
  },
  update: async (
    id: number,
    data: Prisma.GuestUncheckedUpdateInput,
  ): Promise<Guest> => {
    return prisma.guest.update({ where: { id }, data });
  },
  delete: async (ids: number[]): Promise<void> => {
    await prisma.guest.deleteMany({ where: { id: { in: ids } } });
  },
};
