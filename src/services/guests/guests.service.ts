import prisma from "../../client.js";
import type { AgeRange, Gender, Guest, Prisma, Status } from "@prisma/client";

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
    const avatar_key =
      data.avatar_key ?? getDefaultAvatarKey(data.gender, data.age_range);
    return prisma.guest.create({
      data: {
        ...data,
        avatar_key,
      },
    });
  },
  update: async (
    id: number,
    data: Prisma.GuestUncheckedUpdateInput,
  ): Promise<Guest> => {
    let nextAvatarKey = data.avatar_key;
    if (nextAvatarKey === null) {
      const existing = await prisma.guest.findUnique({ where: { id } });
      if (existing) {
        const gender = (data.gender ?? existing.gender) as Gender;
        const age_range = (data.age_range ?? existing.age_range) as AgeRange;
        nextAvatarKey = getDefaultAvatarKey(gender, age_range);
      } else {
        nextAvatarKey = undefined;
      }
    }

    return prisma.guest.update({
      where: { id },
      data: {
        ...data,
        ...(nextAvatarKey !== undefined ? { avatar_key: nextAvatarKey } : {}),
      },
    });
  },
  remove: async (id: number): Promise<void> => {
    await prisma.guest.delete({ where: { id } });
  },
};

const getDefaultAvatarKey = (gender?: Gender, ageRange?: AgeRange) => {
  if (!gender) return null;
  const isChild = ageRange === "CHILD" || ageRange === "BABY";
  if (gender === "FEMALE") {
    return isChild ? "girl-1" : "female-1";
  }
  return isChild ? "boy-1" : "male-1";
};
