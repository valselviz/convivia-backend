import prisma from "../../client.js";
import { buildPlanningInput } from "./build-input.js";
import { generateAssignment } from "./assign.js";
import type { SeatingResult, SeatingWeights } from "./ia-planning-input.js";

/**
 * El algoritmo decide la mesa de cada invitado, no el asiento puntual
 * (eso queda para el ajuste manual). Al persistir, le asignamos un número
 * de asiento libre dentro de la mesa para que se vea en el canvas,
 * evitando los asientos que ya ocupan las asignaciones fijadas.
 */
export const assignSeatNumbers = (
  toCreate: Array<{ tableId: number; guestId: number }>,
  takenSeatsByTable: Map<number, Set<number>>,
): Array<{ table_id: number; guest_id: number; seat_number: number }> => {
  const cursors = new Map<number, number>();
  return toCreate.map(({ tableId, guestId }) => {
    const taken = takenSeatsByTable.get(tableId) ?? new Set<number>();
    let seat = cursors.get(tableId) ?? 1;
    while (taken.has(seat)) seat++;
    taken.add(seat);
    takenSeatsByTable.set(tableId, taken);
    cursors.set(tableId, seat + 1);
    return { table_id: tableId, guest_id: guestId, seat_number: seat };
  });
};

export const SeatingService = {
  autoAssign: async (
    eventId: number,
    weights: SeatingWeights,
    seed?: number,
  ): Promise<SeatingResult> => {
    const input = await buildPlanningInput(eventId);
    const result = generateAssignment(input, weights, { seed });

    const takenSeatsByTable = new Map<number, Set<number>>();
    for (const locked of input.lockedAssignments) {
      if (locked.seat_number == null) continue;
      const set = takenSeatsByTable.get(locked.table_id) ?? new Set<number>();
      set.add(locked.seat_number);
      takenSeatsByTable.set(locked.table_id, set);
    }

    const toCreate = assignSeatNumbers(
      result.assignments
        .filter((a) => !a.locked)
        .map((a) => ({ tableId: a.tableId, guestId: a.guestId })),
      takenSeatsByTable,
    );

    await prisma.$transaction(async (tx) => {
      await tx.tableAssignment.deleteMany({
        where: { table: { event_id: eventId }, locked: false },
      });
      if (toCreate.length > 0) {
        await tx.tableAssignment.createMany({
          data: toCreate.map((a) => ({ ...a, locked: false })),
        });
      }
    });

    return result;
  },
};
