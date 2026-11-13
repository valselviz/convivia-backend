import prisma from "../../client.js";
import type { Prisma, Table } from "@prisma/client";
import { BadRequestError, ConflictError, NotFoundError } from "../../lib/errors.js";
import {
  findConflict,
  isWithinRoom,
  toEffectiveFootprint,
  MIN_TABLE_GAP_METERS,
  type PlacedTable,
} from "../../lib/geometry.js";

const assertValidCapacity = (
  seats: number | undefined,
  minSeats: number | null | undefined,
): void => {
  if (seats !== undefined && minSeats != null && minSeats > seats) {
    throw new BadRequestError("min_seats cannot exceed seats");
  }
};

const toPlacedTable = (table: Table): PlacedTable | null => {
  if (table.pos_x === null || table.pos_y === null) return null;
  return {
    id: table.id,
    shape: table.shape,
    pos_x: table.pos_x,
    pos_y: table.pos_y,
    width: table.width,
    height: table.height,
  };
};

const assertValidPlacement = async (
  eventId: number,
  candidate: PlacedTable,
): Promise<void> => {
  const [others, event] = await Promise.all([
    prisma.table.findMany({
      where: { event_id: eventId, id: { not: candidate.id } },
    }),
    prisma.event.findUnique({ where: { id: eventId } }),
  ]);

  const effectiveCandidate = toEffectiveFootprint(candidate);

  if (
    event &&
    !isWithinRoom(effectiveCandidate, {
      width: event.room_width_m,
      height: event.room_height_m,
    })
  ) {
    throw new BadRequestError(
      "Table (including its seats) does not fit within the room boundaries",
    );
  }

  const placedOthers = others
    .map(toPlacedTable)
    .filter((t): t is PlacedTable => t !== null)
    .map(toEffectiveFootprint);

  const conflict = findConflict(effectiveCandidate, placedOthers);
  if (conflict) {
    const conflictingTable = others.find((t) => t.id === conflict.id);
    throw new ConflictError(
      `Table overlaps or is too close to "${conflictingTable?.name ?? "another table"}" (minimum ${MIN_TABLE_GAP_METERS}m gap required, including seats)`,
    );
  }
};

export const TablesService = {
  list: async (eventId: number): Promise<Table[]> => {
    return prisma.table.findMany({
      where: { event_id: eventId },
      orderBy: { id: "asc" },
    });
  },

  create: async (
    eventId: number,
    data: Omit<Prisma.TableUncheckedCreateInput, "event_id">,
  ): Promise<Table> => {
    assertValidCapacity(data.seats as number, data.min_seats as number | null | undefined);

    if (data.pos_x != null && data.pos_y != null) {
      await assertValidPlacement(eventId, {
        shape: data.shape as PlacedTable["shape"],
        pos_x: data.pos_x as number,
        pos_y: data.pos_y as number,
        width: (data.width as number) ?? 1.5,
        height: (data.height as number) ?? 1.5,
      });
    }

    return prisma.table.create({
      data: {
        ...data,
        event_id: eventId,
      },
    });
  },

  update: async (
    eventId: number,
    id: number,
    data: Prisma.TableUncheckedUpdateInput,
  ): Promise<Table> => {
    const existing = await prisma.table.findFirst({
      where: { id, event_id: eventId },
    });
    if (!existing) {
      throw new NotFoundError("Table not found");
    }

    const mergedSeats = (data.seats as number | undefined) ?? existing.seats;
    const mergedMinSeats =
      data.min_seats !== undefined
        ? (data.min_seats as number | null)
        : existing.min_seats;
    assertValidCapacity(mergedSeats, mergedMinSeats);

    const merged: PlacedTable = {
      id,
      shape: (data.shape as PlacedTable["shape"]) ?? existing.shape,
      pos_x: (data.pos_x as number | null | undefined) ?? existing.pos_x ?? NaN,
      pos_y: (data.pos_y as number | null | undefined) ?? existing.pos_y ?? NaN,
      width: (data.width as number) ?? existing.width,
      height: (data.height as number) ?? existing.height,
    };

    if (!Number.isNaN(merged.pos_x) && !Number.isNaN(merged.pos_y)) {
      await assertValidPlacement(eventId, merged);
    }

    return prisma.table.update({
      where: { id },
      data,
    });
  },

  delete: async (eventId: number, id: number): Promise<void> => {
    const result = await prisma.table.deleteMany({
      where: { id, event_id: eventId },
    });
    if (result.count === 0) {
      throw new NotFoundError("Table not found");
    }
  },
};
