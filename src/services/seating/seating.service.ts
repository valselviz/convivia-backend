import prisma from "../../client.js";
import { buildPlanningInput } from "./build-input.js";
import { generateAssignment } from "./assign.js";
import type { SeatingResult, SeatingWeights } from "./ia-planning-input.js";

export const SeatingService = {
  autoAssign: async (
    eventId: number,
    weights: SeatingWeights,
    seed?: number,
  ): Promise<SeatingResult> => {
    const input = await buildPlanningInput(eventId);
    const result = generateAssignment(input, weights, { seed });

    const toCreate = result.assignments.filter((a) => !a.locked);

    await prisma.$transaction(async (tx) => {
      await tx.tableAssignment.deleteMany({
        where: { table: { event_id: eventId }, locked: false },
      });
      if (toCreate.length > 0) {
        await tx.tableAssignment.createMany({
          data: toCreate.map((a) => ({
            table_id: a.tableId,
            guest_id: a.guestId,
            locked: false,
          })),
        });
      }
    });

    return result;
  },
};
