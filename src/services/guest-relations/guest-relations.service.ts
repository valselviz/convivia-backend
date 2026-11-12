import prisma from "../../client.js";
import type {
  GuestRelation,
  GuestRelationKind,
  GuestRelationSource,
  Prisma,
} from "@prisma/client";
import { BadRequestError, NotFoundError } from "../../lib/errors.js";

export type GuestRelationWithGuests = GuestRelation & {
  guest_a: { id: number; full_name: string };
  guest_b: { id: number; full_name: string };
};

export const normalizePair = (
  guestId1: number,
  guestId2: number,
): { guest_a_id: number; guest_b_id: number } =>
  guestId1 <= guestId2
    ? { guest_a_id: guestId1, guest_b_id: guestId2 }
    : { guest_a_id: guestId2, guest_b_id: guestId1 };

const assertGuestsInEvent = async (
  eventId: number,
  guestIds: number[],
): Promise<void> => {
  const guests = await prisma.guest.findMany({
    where: { id: { in: guestIds }, event_id: eventId },
    select: { id: true },
  });
  if (guests.length !== guestIds.length) {
    throw new NotFoundError("One or more guests not found in this event");
  }
};

export const GuestRelationsService = {
  list: async (eventId: number): Promise<GuestRelationWithGuests[]> => {
    return prisma.guestRelation.findMany({
      where: { event_id: eventId },
      orderBy: { id: "asc" },
      include: {
        guest_a: { select: { id: true, full_name: true } },
        guest_b: { select: { id: true, full_name: true } },
      },
    });
  },

  create: async (
    eventId: number,
    input: {
      guest_id_1: number;
      guest_id_2: number;
      kind: GuestRelationKind;
      strength?: number;
      source?: GuestRelationSource;
      notes?: string | null;
    },
  ): Promise<GuestRelationWithGuests> => {
    const { guest_a_id, guest_b_id } = normalizePair(
      input.guest_id_1,
      input.guest_id_2,
    );
    if (guest_a_id === guest_b_id) {
      throw new BadRequestError("Cannot relate a guest to themselves");
    }
    await assertGuestsInEvent(eventId, [guest_a_id, guest_b_id]);

    const strength =
      input.strength !== undefined
        ? Math.min(5, Math.max(1, Math.round(input.strength)))
        : 3;

    return prisma.guestRelation.create({
      data: {
        event_id: eventId,
        guest_a_id,
        guest_b_id,
        kind: input.kind,
        strength,
        source: input.source ?? "USER",
        notes: input.notes ?? null,
      },
      include: {
        guest_a: { select: { id: true, full_name: true } },
        guest_b: { select: { id: true, full_name: true } },
      },
    });
  },

  update: async (
    eventId: number,
    id: number,
    data: Prisma.GuestRelationUpdateInput,
  ): Promise<GuestRelationWithGuests> => {
    const existing = await prisma.guestRelation.findFirst({
      where: { id, event_id: eventId },
    });
    if (!existing) {
      throw new NotFoundError("Relation not found");
    }
    return prisma.guestRelation.update({
      where: { id },
      data,
      include: {
        guest_a: { select: { id: true, full_name: true } },
        guest_b: { select: { id: true, full_name: true } },
      },
    });
  },

  remove: async (eventId: number, id: number): Promise<void> => {
    const result = await prisma.guestRelation.deleteMany({
      where: { id, event_id: eventId },
    });
    if (result.count === 0) {
      throw new NotFoundError("Relation not found");
    }
  },
};
