import { describe, expect, it } from "vitest";
import {
  findConflict,
  hasConflict,
  isWithinRoom,
  toEffectiveFootprint,
  type PlacedTable,
} from "./geometry.js";

const round = (
  overrides: Partial<PlacedTable> = {},
): PlacedTable => ({
  shape: "redonda",
  pos_x: 0,
  pos_y: 0,
  width: 1.5,
  height: 1.5,
  ...overrides,
});

const rect = (
  overrides: Partial<PlacedTable> = {},
): PlacedTable => ({
  shape: "rectangular",
  pos_x: 0,
  pos_y: 0,
  width: 2,
  height: 1,
  ...overrides,
});

describe("hasConflict: circle vs circle", () => {
  it("flags two round tables placed on top of each other", () => {
    const a = round({ pos_x: 0, pos_y: 0 });
    const b = round({ pos_x: 0.5, pos_y: 0 });
    expect(hasConflict(a, b)).toBe(true);
  });

  it("flags two round tables closer than the minimum gap", () => {
    const a = round({ pos_x: 0, pos_y: 0, width: 1 });
    const b = round({ pos_x: 1.2, pos_y: 0, width: 1 });
    // edge-to-edge distance = 1.2 - 0.5 - 0.5 = 0.2m, less than the minimum gap
    expect(hasConflict(a, b)).toBe(true);
  });

  it("allows two round tables with at least the minimum gap", () => {
    const a = round({ pos_x: 0, pos_y: 0, width: 1 });
    const b = round({ pos_x: 2.5, pos_y: 0, width: 1 });
    // edge-to-edge distance = 2.5 - 0.5 - 0.5 = 1.5m
    expect(hasConflict(a, b)).toBe(false);
  });
});

describe("hasConflict: rectangle vs rectangle", () => {
  it("flags two rectangular tables that overlap", () => {
    const a = rect({ pos_x: 0, pos_y: 0 });
    const b = rect({ pos_x: 1, pos_y: 0 });
    expect(hasConflict(a, b)).toBe(true);
  });

  it("flags two rectangular tables closer than the minimum gap", () => {
    const a = rect({ pos_x: 0, pos_y: 0, width: 2, height: 1 });
    const b = rect({ pos_x: 2.2, pos_y: 0, width: 2, height: 1 });
    // gap between edges = 2.2 - 1 - 1 = 0.2m
    expect(hasConflict(a, b)).toBe(true);
  });

  it("allows two rectangular tables with at least the minimum gap", () => {
    const a = rect({ pos_x: 0, pos_y: 0, width: 2, height: 1 });
    const b = rect({ pos_x: 4, pos_y: 0, width: 2, height: 1 });
    // gap between edges = 4 - 1 - 1 = 2m
    expect(hasConflict(a, b)).toBe(false);
  });
});

describe("hasConflict: circle vs rectangle", () => {
  it("flags a round table overlapping a rectangular one", () => {
    const circle = round({ pos_x: 0, pos_y: 0, width: 1 });
    const rectangle = rect({ pos_x: 1, pos_y: 0, width: 2, height: 1 });
    expect(hasConflict(circle, rectangle)).toBe(true);
  });

  it("allows a round table far enough from a rectangular one", () => {
    const circle = round({ pos_x: 0, pos_y: 0, width: 1 });
    const rectangle = rect({ pos_x: 5, pos_y: 0, width: 2, height: 1 });
    expect(hasConflict(circle, rectangle)).toBe(false);
  });
});

describe("findConflict", () => {
  it("returns the conflicting table", () => {
    const candidate = round({ id: 1, pos_x: 0, pos_y: 0 });
    const others = [
      round({ id: 2, pos_x: 10, pos_y: 10 }),
      round({ id: 3, pos_x: 0.2, pos_y: 0 }),
    ];
    expect(findConflict(candidate, others)?.id).toBe(3);
  });

  it("ignores the candidate itself when present in the list", () => {
    const candidate = round({ id: 1, pos_x: 0, pos_y: 0 });
    const others = [candidate, round({ id: 2, pos_x: 10, pos_y: 10 })];
    expect(findConflict(candidate, others)).toBeNull();
  });

  it("returns null when there is no conflict", () => {
    const candidate = round({ id: 1, pos_x: 0, pos_y: 0, width: 1 });
    const others = [round({ id: 2, pos_x: 10, pos_y: 10 })];
    expect(findConflict(candidate, others)).toBeNull();
  });
});

describe("toEffectiveFootprint", () => {
  it("inflates a round table's diameter to account for its seat ring", () => {
    const table = round({ width: 1.5, height: 1.5 });
    const effective = toEffectiveFootprint(table);
    expect(effective.width).toBeCloseTo(1.5 + 2 * (0.05 + 2 * 0.15));
    expect(effective.height).toBeCloseTo(1.5 + 2 * (0.05 + 2 * 0.15));
  });

  it("flags two tables as conflicting once seats are accounted for, even though the bare tables keep the 1m gap", () => {
    // 1.5m round tables, centers 2.5m apart => bare edge-to-edge gap is exactly 1m.
    const a = toEffectiveFootprint(round({ id: 1, pos_x: 0, pos_y: 0 }));
    const b = toEffectiveFootprint(round({ id: 2, pos_x: 2.5, pos_y: 0 }));
    expect(hasConflict(round({ pos_x: 0 }), round({ pos_x: 2.5 }))).toBe(false);
    expect(hasConflict(a, b)).toBe(true);
  });
});

describe("isWithinRoom", () => {
  const room = { width: 10, height: 6 };

  it("accepts a round table fully inside the room", () => {
    const table = round({ pos_x: 2, pos_y: 2, width: 1.5 });
    expect(isWithinRoom(table, room)).toBe(true);
  });

  it("rejects a round table that would poke outside the room edge", () => {
    const table = round({ pos_x: 0.3, pos_y: 2, width: 1.5 });
    expect(isWithinRoom(table, room)).toBe(false);
  });

  it("rejects a rectangular table that exceeds the room on the far side", () => {
    const table = rect({ pos_x: 9.5, pos_y: 2, width: 2, height: 1 });
    expect(isWithinRoom(table, room)).toBe(false);
  });
});
