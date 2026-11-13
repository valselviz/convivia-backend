export type TableShape = "redonda" | "rectangular";

export type PlacedTable = {
  id?: number;
  shape: TableShape;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
};

export const MIN_TABLE_GAP_METERS = 1;

/** Radio de una silla individual, en metros. Chico a propósito: a veces hay que apretar sillas. */
export const SEAT_RADIUS_M = 0.15;
/** Separación entre el borde de la mesa y el centro de la silla. */
export const SEAT_TABLE_GAP_M = 0.05;

const SEAT_EXTRA_PER_SIDE_M = SEAT_TABLE_GAP_M + 2 * SEAT_RADIUS_M;

/**
 * Contorno real de una mesa incluyendo el anillo de sillas a su alrededor —
 * es lo que hay que usar para chequear superposición con otras mesas y límites del salón,
 * no el cuerpo desnudo de la mesa.
 */
export const toEffectiveFootprint = <T extends PlacedTable>(table: T): T => ({
  ...table,
  width: table.width + 2 * SEAT_EXTRA_PER_SIDE_M,
  height: table.height + 2 * SEAT_EXTRA_PER_SIDE_M,
});

export type RoomBounds = { width: number; height: number };

export const isWithinRoom = (
  table: PlacedTable,
  room: RoomBounds,
): boolean => {
  const halfW = table.width / 2;
  const halfH = table.shape === "redonda" ? table.width / 2 : table.height / 2;
  return (
    table.pos_x - halfW >= 0 &&
    table.pos_x + halfW <= room.width &&
    table.pos_y - halfH >= 0 &&
    table.pos_y + halfH <= room.height
  );
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const circleRectDistance = (
  cx: number,
  cy: number,
  rect: PlacedTable,
): number => {
  const closestX = clamp(cx, rect.pos_x - rect.width / 2, rect.pos_x + rect.width / 2);
  const closestY = clamp(cy, rect.pos_y - rect.height / 2, rect.pos_y + rect.height / 2);
  return Math.hypot(cx - closestX, cy - closestY);
};

export const hasConflict = (
  a: PlacedTable,
  b: PlacedTable,
  minGapMeters: number = MIN_TABLE_GAP_METERS,
): boolean => {
  if (a.shape === "redonda" && b.shape === "redonda") {
    const distance = Math.hypot(a.pos_x - b.pos_x, a.pos_y - b.pos_y);
    return distance < a.width / 2 + b.width / 2 + minGapMeters;
  }

  if (a.shape === "rectangular" && b.shape === "rectangular") {
    const halfGap = minGapMeters / 2;
    const aLeft = a.pos_x - a.width / 2 - halfGap;
    const aRight = a.pos_x + a.width / 2 + halfGap;
    const aTop = a.pos_y - a.height / 2 - halfGap;
    const aBottom = a.pos_y + a.height / 2 + halfGap;
    const bLeft = b.pos_x - b.width / 2 - halfGap;
    const bRight = b.pos_x + b.width / 2 + halfGap;
    const bTop = b.pos_y - b.height / 2 - halfGap;
    const bBottom = b.pos_y + b.height / 2 + halfGap;
    return aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop;
  }

  const circle = a.shape === "redonda" ? a : b;
  const rect = a.shape === "redonda" ? b : a;
  const distance = circleRectDistance(circle.pos_x, circle.pos_y, rect);
  return distance < circle.width / 2 + minGapMeters;
};

export const findConflict = <T extends PlacedTable>(
  candidate: T,
  others: T[],
  minGapMeters: number = MIN_TABLE_GAP_METERS,
): T | null => {
  for (const other of others) {
    if (
      candidate.id !== undefined &&
      other.id !== undefined &&
      candidate.id === other.id
    ) {
      continue;
    }
    if (hasConflict(candidate, other, minGapMeters)) {
      return other;
    }
  }
  return null;
};
