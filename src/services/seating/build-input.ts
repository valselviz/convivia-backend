import prisma from "../../client.js";
import type { SeatingPlanningInput } from "./ia-planning-input.js";

export const buildPlanningInput = async (
  eventId: number,
): Promise<SeatingPlanningInput> => {
  const [event, guests, tables, groups, relations, lockedAssignments] =
    await Promise.all([
      prisma.event.findUniqueOrThrow({
        where: { id: eventId },
        select: { id: true, name: true },
      }),
      prisma.guest.findMany({
        where: { event_id: eventId },
        select: {
          id: true,
          full_name: true,
          guest_type: true,
          main_guest_id: true,
          host_name: true,
          age_range: true,
          status: true,
        },
      }),
      prisma.table.findMany({
        where: { event_id: eventId },
        select: { id: true, name: true, seats: true, min_seats: true },
      }),
      prisma.guestGroup.findMany({
        where: { event_id: eventId },
        select: {
          id: true,
          name: true,
          members: { select: { guest_id: true } },
        },
      }),
      prisma.guestRelation.findMany({
        where: { event_id: eventId },
        select: {
          guest_a_id: true,
          guest_b_id: true,
          kind: true,
          strength: true,
        },
      }),
      prisma.tableAssignment.findMany({
        where: { table: { event_id: eventId }, locked: true },
        select: { guest_id: true, table_id: true, seat_number: true },
      }),
    ]);

  return {
    event,
    guests,
    tables,
    groups: groups.map((g) => ({
      id: g.id,
      name: g.name,
      member_guest_ids: g.members.map((m) => m.guest_id),
    })),
    relations,
    lockedAssignments,
  };
};
