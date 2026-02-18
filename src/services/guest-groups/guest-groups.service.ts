import prisma from "../../client.js";
import type { GuestGroup, Prisma } from "@prisma/client";

export type GuestGroupWithMembers = GuestGroup & {
  members: Array<{
    id: number;
    guest: {
      id: number;
      full_name: string;
      avatar_key: string | null;
    };
  }>;
};

export const GuestGroupsService = {
  list: async (): Promise<GuestGroup[]> => {
    return prisma.guestGroup.findMany({
      orderBy: { id: "asc" },
      include: {
        members: {
          select: {
            id: true,
            guest_id: true,
          },
        },
      },
    });
  },
  getById: async (id: number): Promise<GuestGroupWithMembers | null> => {
    return prisma.guestGroup.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            guest: {
              select: {
                id: true,
                full_name: true,
                avatar_key: true,
              },
            },
          },
        },
      },
    });
  },
  create: async (
    data: Prisma.GuestGroupUncheckedCreateInput,
  ): Promise<GuestGroup> => {
    return prisma.guestGroup.create({ data });
  },
  update: async (
    id: number,
    data: Prisma.GuestGroupUncheckedUpdateInput,
  ): Promise<GuestGroup> => {
    return prisma.guestGroup.update({
      where: { id },
      data,
    });
  },
  delete: async (id: number): Promise<void> => {
    await prisma.guestGroup.delete({ where: { id } });
  },
  addMember: async (groupId: number, guestId: number): Promise<void> => {
    // Check if it already exists
    const existing = await prisma.guestGroupMember.findFirst({
      where: {
        group_id: groupId,
        guest_id: guestId,
      },
    });

    if (!existing) {
      await prisma.guestGroupMember.create({
        data: {
          group_id: groupId,
          guest_id: guestId,
        },
      });
    }
  },
  removeMember: async (groupId: number, guestId: number): Promise<void> => {
    await prisma.guestGroupMember.deleteMany({
      where: {
        group_id: groupId,
        guest_id: guestId,
      },
    });
  },
  addMembers: async (
    groupId: number,
    guestIds: number[],
  ): Promise<void> => {
    // Get existing members to avoid duplicates
    const existing = await prisma.guestGroupMember.findMany({
      where: {
        group_id: groupId,
        guest_id: { in: guestIds },
      },
      select: { guest_id: true },
    });

    const existingIds = new Set(existing.map((m) => m.guest_id));
    const newIds = guestIds.filter((id) => !existingIds.has(id));

    if (newIds.length > 0) {
      await prisma.guestGroupMember.createMany({
        data: newIds.map((guestId) => ({
          group_id: groupId,
          guest_id: guestId,
        })),
      });
    }
  },
};
