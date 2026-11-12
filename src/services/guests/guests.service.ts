import prisma from "../../client.js";
import type { AgeRange, Gender, Guest, Prisma, Status, GuestType } from "@prisma/client";
import { NotFoundError } from "../../lib/errors.js";

export type GuestListFilters = {
  eventId: number;
  status?: Status;
  groupId?: number;
  tableId?: number;
  search?: string;
  hostName?: string;
  type?: GuestType;
  plusOne?: "all" | "only";
  order?: "name" | "notes";
};

const resolveHostId = async (
  eventId: number,
  hostName: string | null | undefined,
): Promise<number | null> => {
  if (!hostName) return null;
  const host = await prisma.host.upsert({
    where: {
      event_id_name: { event_id: eventId, name: hostName },
    },
    update: {},
    create: { event_id: eventId, name: hostName },
  });
  return host.id;
};

export const GuestsService = {
  list: async (filters: GuestListFilters): Promise<Guest[]> => {
    const {
      eventId,
      status,
      groupId,
      tableId,
      search,
      hostName,
      type,
      plusOne,
      order,
    } = filters;

    const searchConditions: Prisma.GuestWhereInput[] = [];

    if (search && search.trim()) {
      const searchTerm = search.trim();
      searchConditions.push({
        OR: [
          {
            full_name: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
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

    const whereConditions: Prisma.GuestWhereInput = {
      event_id: eventId,
      ...(status ? { status } : {}),
      ...(hostName ? { host_name: hostName } : {}),
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

  create: async (
    eventId: number,
    data: Omit<Prisma.GuestUncheckedCreateInput, "event_id">,
  ): Promise<Guest> => {
    if (data.main_guest_id) {
      const main = await prisma.guest.findFirst({
        where: { id: data.main_guest_id, event_id: eventId },
      });
      if (!main) {
        throw new NotFoundError("Main guest not found in this event");
      }
    }

    const host_id = await resolveHostId(
      eventId,
      data.host_name as string | null | undefined,
    );
    const avatar_key =
      (data.avatar_key as string | null | undefined) ??
      getDefaultAvatarKey(
        data.gender as Gender | undefined,
        data.age_range as AgeRange | undefined,
      );
    return prisma.guest.create({
      data: {
        ...data,
        event_id: eventId,
        host_id,
        avatar_key,
      },
    });
  },

  update: async (
    eventId: number,
    id: number,
    data: Prisma.GuestUncheckedUpdateInput,
  ): Promise<Guest> => {
    const existing = await prisma.guest.findFirst({
      where: { id, event_id: eventId },
    });
    if (!existing) {
      throw new NotFoundError("Guest not found");
    }

    const nextMainId = data.main_guest_id as number | null | undefined;
    if (nextMainId !== undefined && nextMainId !== null) {
      const main = await prisma.guest.findFirst({
        where: { id: nextMainId, event_id: eventId },
      });
      if (!main) {
        throw new NotFoundError("Main guest not found in this event");
      }
    }

    const nextHostName = data.host_name as string | null | undefined;
    const host_id =
      nextHostName !== undefined
        ? await resolveHostId(eventId, nextHostName)
        : undefined;

    let nextAvatarKey = data.avatar_key;
    if (nextAvatarKey === null) {
      const gender = (data.gender ?? existing.gender) as Gender;
      const age_range = (data.age_range ?? existing.age_range) as AgeRange;
      nextAvatarKey = getDefaultAvatarKey(gender, age_range);
    }

    return prisma.guest.update({
      where: { id },
      data: {
        ...data,
        ...(host_id !== undefined ? { host_id } : {}),
        ...(nextAvatarKey !== undefined ? { avatar_key: nextAvatarKey } : {}),
      },
    });
  },

  delete: async (eventId: number, ids: number[]): Promise<void> => {
    await prisma.guest.deleteMany({
      where: { id: { in: ids }, event_id: eventId },
    });
  },
};

export const getDefaultAvatarKey = (gender?: Gender, ageRange?: AgeRange) => {
  if (!gender) return null;
  const isChild = ageRange === "CHILD" || ageRange === "BABY";
  if (gender === "FEMALE") {
    return isChild ? "girl-1" : "female-1";
  }
  return isChild ? "boy-1" : "male-1";
};
