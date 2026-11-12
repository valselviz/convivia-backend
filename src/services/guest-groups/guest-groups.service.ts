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
  list: async (eventId: number): Promise<GuestGroup[]> => {
    return prisma.guestGroup.findMany({
      where: { event_id: eventId },
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
  getById: async (
    eventId: number,
    id: number,
  ): Promise<GuestGroupWithMembers | null> => {
    return prisma.guestGroup.findFirst({
      where: { id, event_id: eventId },
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
    eventId: number,
    data: Omit<Prisma.GuestGroupUncheckedCreateInput, "event_id">,
  ): Promise<GuestGroup> => {
    return prisma.guestGroup.create({
      data: {
        ...data,
        event_id: eventId,
      },
    });
  },
  update: async (
    eventId: number,
    id: number,
    data: Prisma.GuestGroupUncheckedUpdateInput,
  ): Promise<GuestGroup> => {
    const existing = await prisma.guestGroup.findFirst({
      where: { id, event_id: eventId },
    });
    if (!existing) {
      throw new Error("Group not found");
    }
    return prisma.guestGroup.update({
      where: { id },
      data,
    });
  },
  delete: async (eventId: number, id: number): Promise<void> => {
    const result = await prisma.guestGroup.deleteMany({
      where: { id, event_id: eventId },
    });
    if (result.count === 0) {
      throw new Error("Group not found");
    }
  },
  addMember: async (
    eventId: number,
    groupId: number,
    guestId: number,
  ): Promise<void> => {
    const group = await prisma.guestGroup.findFirst({
      where: { id: groupId, event_id: eventId },
    });
    if (!group) throw new Error("Group not found");

    const guest = await prisma.guest.findFirst({
      where: { id: guestId, event_id: eventId },
    });
    if (!guest) throw new Error("Guest not found in this event");

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
  removeMember: async (
    eventId: number,
    groupId: number,
    guestId: number,
  ): Promise<void> => {
    const group = await prisma.guestGroup.findFirst({
      where: { id: groupId, event_id: eventId },
    });
    if (!group) throw new Error("Group not found");

    await prisma.guestGroupMember.deleteMany({
      where: {
        group_id: groupId,
        guest_id: guestId,
      },
    });
  },
  addMembers: async (
    eventId: number,
    groupId: number,
    guestIds: number[],
  ): Promise<void> => {
    const group = await prisma.guestGroup.findFirst({
      where: { id: groupId, event_id: eventId },
    });
    if (!group) throw new Error("Group not found");

    const guests = await prisma.guest.findMany({
      where: { id: { in: guestIds }, event_id: eventId },
      select: { id: true },
    });
    if (guests.length !== guestIds.length) {
      throw new Error("One or more guests not found in this event");
    }

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
