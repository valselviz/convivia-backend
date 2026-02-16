import prisma from "../../client.js";
import type { AgeRange, Gender, Guest, Prisma, Status, Side, GuestType } from "@prisma/client";

export type GuestListFilters = {
  status?: Status;
  groupId?: number;
  tableId?: number;
  search?: string;
  side?: Side;
  type?: GuestType;
  plusOne?: "all" | "only";
  order?: "name" | "notes";
};

export const GuestsService = {
  list: async (filters: GuestListFilters = {}): Promise<Guest[]> => {
    const { status, groupId, tableId, search, side, type, plusOne, order } = filters;

    // Construir condiciones de búsqueda
    const searchConditions: Prisma.GuestWhereInput[] = [];
    
    if (search && search.trim()) {
      const searchTerm = search.trim();
      searchConditions.push({
        OR: [
          // Buscar en el nombre del invitado (case-insensitive)
          {
            full_name: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          // Si es +1, buscar también en el nombre del invitado principal
          {
            AND: [
              { guest_type: "PLUS_ONE" },
              {
                main_guest: {
                  full_name: {
                    contains: searchTerm,
                    mode: "insensitive",
                  },
                },
              },
            ],
          },
        ],
      });
    }

    // Construir condiciones de filtros
    const whereConditions: Prisma.GuestWhereInput = {
      ...(status ? { status } : {}),
      ...(side ? { side } : {}),
      ...(type ? { guest_type: type } : {}),
      ...(plusOne === "only" ? { guest_type: "PLUS_ONE" } : {}),
      ...(groupId
        ? {
            group_members: {
              some: { group_id: groupId },
            },
          }
        : {}),
      ...(tableId
        ? {
            table_assignments: {
              some: { table_id: tableId },
            },
          }
        : {}),
      ...(searchConditions.length > 0 ? { AND: searchConditions } : {}),
    };

    // Determinar orden
    const orderBy: Prisma.GuestOrderByWithRelationInput[] = [];
    if (order === "notes") {
      orderBy.push({ notes: "asc" });
    } else {
      orderBy.push({ full_name: "asc" });
    }

    return prisma.guest.findMany({
      where: whereConditions,
      orderBy,
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
  delete: async (ids: number[]): Promise<void> => {
    await prisma.guest.deleteMany({ where: { id: { in: ids } } });
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
