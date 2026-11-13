import prisma from "../../client.js";
import type { TableAssignment } from "@prisma/client";
import { BadRequestError, ConflictError, NotFoundError } from "../../lib/errors.js";

export type AssignTableInput = {
  eventId: number;
  tableId: number;
  guestId: number;
  seatNumber?: number | null;
};

export type ReassignInput = {
  eventId: number;
  guestId: number;
  tableId: number;
  seatNumber?: number | null;
};

export type AssignmentWithGuest = TableAssignment & {
  guest: {
    id: number;
    full_name: string;
    avatar_key: string | null;
    status: string;
  };
};

export type ReassignResult = {
  assignment: TableAssignment;
  warnings: string[];
};

const getHardRuleWarnings = async (
  eventId: number,
  guestId: number,
  tableId: number,
): Promise<string[]> => {
  const warnings: string[] = [];

  const guest = await prisma.guest.findFirst({
    where: { id: guestId, event_id: eventId },
    include: { other_guests: { select: { id: true, full_name: true } } },
  });
  if (!guest) return warnings;

  const companionIds: Array<{ id: number; full_name: string }> = [];
  if (guest.main_guest_id) {
    const main = await prisma.guest.findUnique({
      where: { id: guest.main_guest_id },
      select: { id: true, full_name: true },
    });
    if (main) companionIds.push(main);
  }
  companionIds.push(...guest.other_guests);

  if (companionIds.length > 0) {
    const companionAssignments = await prisma.tableAssignment.findMany({
      where: { guest_id: { in: companionIds.map((c) => c.id) } },
    });
    for (const companion of companionIds) {
      const assignment = companionAssignments.find(
        (a) => a.guest_id === companion.id,
      );
      if (assignment && assignment.table_id !== tableId) {
        warnings.push(
          `${guest.full_name} y su +1/invitado principal "${companion.full_name}" no están en la misma mesa`,
        );
      }
    }
  }

  const conflicts = await prisma.guestRelation.findMany({
    where: {
      event_id: eventId,
      kind: "CONFLICT",
      OR: [{ guest_a_id: guestId }, { guest_b_id: guestId }],
    },
  });
  if (conflicts.length > 0) {
    const conflictGuestIds = conflicts.map((r) =>
      r.guest_a_id === guestId ? r.guest_b_id : r.guest_a_id,
    );
    const tableMates = await prisma.tableAssignment.findMany({
      where: { table_id: tableId, guest_id: { in: conflictGuestIds } },
      include: { guest: { select: { full_name: true } } },
    });
    for (const mate of tableMates) {
      warnings.push(
        `${guest.full_name} tiene una relación de conflicto con "${mate.guest.full_name}" y están en la misma mesa`,
      );
    }
  }

  return warnings;
};

export const TableAssignmentsService = {
  list: async (eventId: number): Promise<AssignmentWithGuest[]> => {
    return prisma.tableAssignment.findMany({
      where: { table: { event_id: eventId } },
      include: {
        guest: {
          select: { id: true, full_name: true, avatar_key: true, status: true },
        },
      },
    });
  },

  assign: async (input: AssignTableInput): Promise<TableAssignment> => {
    const { eventId, tableId, guestId, seatNumber } = input;

    const [table, guest] = await Promise.all([
      prisma.table.findFirst({ where: { id: tableId, event_id: eventId } }),
      prisma.guest.findFirst({ where: { id: guestId, event_id: eventId } }),
    ]);

    if (!table) {
      throw new NotFoundError("Table not found in this event");
    }
    if (!guest) {
      throw new NotFoundError("Guest not found in this event");
    }

    const existingAssignment = await prisma.tableAssignment.findFirst({
      where: { guest_id: guestId },
    });

    if (existingAssignment) {
      throw new ConflictError("Guest is already assigned to a table");
    }

    if (seatNumber !== undefined && seatNumber !== null) {
      const seatTaken = await prisma.tableAssignment.findFirst({
        where: { table_id: tableId, seat_number: seatNumber },
      });

      if (table.seats && seatNumber > table.seats) {
        throw new BadRequestError("Seat number exceeds table capacity");
      }

      if (seatTaken) {
        throw new ConflictError("Seat number already taken");
      }
    }

    return prisma.tableAssignment.create({
      data: {
        table_id: tableId,
        guest_id: guestId,
        seat_number: seatNumber ?? null,
      },
    });
  },

  /**
   * Asignación manual: mueve a un invitado a una mesa/asiento. Si el asiento
   * destino estaba ocupado, esa persona queda sin asignar. Queda fijada
   * (locked). No bloquea las reglas duras (+1 con su invitado principal,
   * conflicto nunca en la misma mesa) pero las reporta como warnings.
   */
  reassign: async (input: ReassignInput): Promise<ReassignResult> => {
    const { eventId, guestId, tableId, seatNumber } = input;

    const [table, guest] = await Promise.all([
      prisma.table.findFirst({ where: { id: tableId, event_id: eventId } }),
      prisma.guest.findFirst({ where: { id: guestId, event_id: eventId } }),
    ]);
    if (!table) {
      throw new NotFoundError("Table not found in this event");
    }
    if (!guest) {
      throw new NotFoundError("Guest not found in this event");
    }
    if (seatNumber != null && table.seats && seatNumber > table.seats) {
      throw new BadRequestError("Seat number exceeds table capacity");
    }

    const assignment = await prisma.$transaction(async (tx) => {
      if (seatNumber != null) {
        await tx.tableAssignment.deleteMany({
          where: {
            table_id: tableId,
            seat_number: seatNumber,
            guest_id: { not: guestId },
          },
        });
      }
      await tx.tableAssignment.deleteMany({ where: { guest_id: guestId } });

      return tx.tableAssignment.create({
        data: {
          table_id: tableId,
          guest_id: guestId,
          seat_number: seatNumber ?? null,
          locked: true,
        },
      });
    });

    const warnings = await getHardRuleWarnings(eventId, guestId, tableId);

    return { assignment, warnings };
  },

  unassign: async (eventId: number, guestId: number): Promise<void> => {
    const guest = await prisma.guest.findFirst({
      where: { id: guestId, event_id: eventId },
    });
    if (!guest) {
      throw new NotFoundError("Guest not found in this event");
    }
    await prisma.tableAssignment.deleteMany({ where: { guest_id: guestId } });
  },

  setLocked: async (
    eventId: number,
    guestId: number,
    locked: boolean,
  ): Promise<TableAssignment> => {
    const guest = await prisma.guest.findFirst({
      where: { id: guestId, event_id: eventId },
    });
    if (!guest) {
      throw new NotFoundError("Guest not found in this event");
    }
    const assignment = await prisma.tableAssignment.findFirst({
      where: { guest_id: guestId },
    });
    if (!assignment) {
      throw new NotFoundError("Guest is not assigned to a table");
    }
    return prisma.tableAssignment.update({
      where: { id: assignment.id },
      data: { locked },
    });
  },

  unlockAll: async (eventId: number): Promise<number> => {
    const result = await prisma.tableAssignment.updateMany({
      where: { table: { event_id: eventId } },
      data: { locked: false },
    });
    return result.count;
  },
};
