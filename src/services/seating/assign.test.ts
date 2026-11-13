import { describe, expect, it } from "vitest";
import { generateAssignment } from "./assign.js";
import type {
  SeatingGuestDTO,
  SeatingPlanningInput,
  SeatingTableDTO,
  SeatingWeights,
} from "./ia-planning-input.js";

const noWeights: SeatingWeights = {
  host: { mode: "indifferent", weight: 0 },
  family: 0,
  affinity: 0,
  groups: 0,
  age: 0,
};

const guest = (overrides: Partial<SeatingGuestDTO> & { id: number }): SeatingGuestDTO => ({
  full_name: `Guest ${overrides.id}`,
  guest_type: "MAIN_GUEST",
  main_guest_id: null,
  host_name: null,
  age_range: "ADULT",
  status: "CONFIRMED",
  ...overrides,
});

const table = (overrides: Partial<SeatingTableDTO> & { id: number }): SeatingTableDTO => ({
  name: `Mesa ${overrides.id}`,
  seats: 4,
  min_seats: null,
  ...overrides,
});

const baseInput = (
  overrides: Partial<SeatingPlanningInput> = {},
): SeatingPlanningInput => ({
  event: { id: 1, name: "Test" },
  guests: [],
  tables: [],
  groups: [],
  relations: [],
  lockedAssignments: [],
  ...overrides,
});

const tableOf = (result: ReturnType<typeof generateAssignment>, guestId: number) =>
  result.assignments.find((a) => a.guestId === guestId)?.tableId;

describe("generateAssignment: +1 always with main guest", () => {
  it("keeps a plus-one at the same table as their main guest", () => {
    const input = baseInput({
      guests: [
        guest({ id: 1 }),
        guest({ id: 2, guest_type: "PLUS_ONE", main_guest_id: 1 }),
        guest({ id: 3 }),
      ],
      tables: [table({ id: 10, seats: 2 }), table({ id: 20, seats: 2 })],
    });

    const result = generateAssignment(input, noWeights, { seed: 1 });

    expect(tableOf(result, 1)).toBe(tableOf(result, 2));
  });
});

describe("generateAssignment: conflicts", () => {
  it("seats conflicting guests at different tables when possible", () => {
    const input = baseInput({
      guests: [guest({ id: 1 }), guest({ id: 2 })],
      tables: [table({ id: 10, seats: 2 }), table({ id: 20, seats: 2 })],
      relations: [
        { guest_a_id: 1, guest_b_id: 2, kind: "CONFLICT", strength: 5 },
      ],
    });

    const result = generateAssignment(input, noWeights, { seed: 1 });

    expect(tableOf(result, 1)).not.toBe(tableOf(result, 2));
    expect(
      result.alerts.some((a) => a.type === "conflict_unavoidable"),
    ).toBe(false);
  });

  it("seats conflicting guests together as a last resort and raises an alert when there is only one table", () => {
    const input = baseInput({
      guests: [guest({ id: 1 }), guest({ id: 2 })],
      tables: [table({ id: 10, seats: 2 })],
      relations: [
        { guest_a_id: 1, guest_b_id: 2, kind: "CONFLICT", strength: 5 },
      ],
    });

    const result = generateAssignment(input, noWeights, { seed: 1 });

    expect(tableOf(result, 1)).toBe(tableOf(result, 2));
    const alert = result.alerts.find((a) => a.type === "conflict_unavoidable");
    expect(alert).toBeDefined();
  });
});

describe("generateAssignment: locked assignments", () => {
  it("never moves a locked guest, and free guests get placed around it", () => {
    const input = baseInput({
      guests: [guest({ id: 1 }), guest({ id: 2 }), guest({ id: 3 })],
      tables: [table({ id: 10, seats: 1 }), table({ id: 20, seats: 2 })],
      lockedAssignments: [{ guest_id: 1, table_id: 10 }],
    });

    const result = generateAssignment(input, noWeights, { seed: 1 });

    expect(tableOf(result, 1)).toBe(10);
    const lockedEntry = result.assignments.find((a) => a.guestId === 1);
    expect(lockedEntry?.locked).toBe(true);
    // table 10 only has 1 seat and it's taken by the locked guest
    expect(tableOf(result, 2)).toBe(20);
    expect(tableOf(result, 3)).toBe(20);
  });

  it("keeps a locked main guest's un-locked plus-one with them even though only the main is locked", () => {
    const input = baseInput({
      guests: [
        guest({ id: 1 }),
        guest({ id: 2, guest_type: "PLUS_ONE", main_guest_id: 1 }),
      ],
      tables: [table({ id: 10, seats: 4 }), table({ id: 20, seats: 4 })],
      lockedAssignments: [{ guest_id: 1, table_id: 10 }],
    });

    const result = generateAssignment(input, noWeights, { seed: 1 });

    expect(tableOf(result, 1)).toBe(10);
    expect(tableOf(result, 2)).toBe(10);
  });
});

describe("generateAssignment: determinism", () => {
  it("produces the exact same result for the same input and seed", () => {
    const input = baseInput({
      guests: [
        guest({ id: 1, host_name: "Host A" }),
        guest({ id: 2, host_name: "Host B" }),
        guest({ id: 3, host_name: "Host A" }),
        guest({ id: 4, host_name: "Host B" }),
      ],
      tables: [table({ id: 10, seats: 2 }), table({ id: 20, seats: 2 })],
    });
    const weights: SeatingWeights = {
      ...noWeights,
      host: { mode: "separate", weight: 2 },
    };

    const resultA = generateAssignment(input, weights, { seed: 7 });
    const resultB = generateAssignment(input, weights, { seed: 7 });

    expect(resultA.assignments).toEqual(resultB.assignments);
  });
});

describe("generateAssignment: host weighting", () => {
  it("groups guests from the same host together when host mode is 'separate'", () => {
    const input = baseInput({
      guests: [
        guest({ id: 1, host_name: "Host A" }),
        guest({ id: 2, host_name: "Host A" }),
        guest({ id: 3, host_name: "Host B" }),
        guest({ id: 4, host_name: "Host B" }),
      ],
      tables: [table({ id: 10, seats: 2 }), table({ id: 20, seats: 2 })],
    });
    const weights: SeatingWeights = {
      ...noWeights,
      host: { mode: "separate", weight: 3 },
    };

    const result = generateAssignment(input, weights, { seed: 3 });

    expect(tableOf(result, 1)).toBe(tableOf(result, 2));
    expect(tableOf(result, 3)).toBe(tableOf(result, 4));
    expect(tableOf(result, 1)).not.toBe(tableOf(result, 3));
  });

  it("spreads guests from the same host across tables when host mode is 'mixed'", () => {
    const input = baseInput({
      guests: [
        guest({ id: 1, host_name: "Host A" }),
        guest({ id: 2, host_name: "Host A" }),
        guest({ id: 3, host_name: "Host B" }),
        guest({ id: 4, host_name: "Host B" }),
      ],
      tables: [table({ id: 10, seats: 2 }), table({ id: 20, seats: 2 })],
    });
    const weights: SeatingWeights = {
      ...noWeights,
      host: { mode: "mixed", weight: 3 },
    };

    const result = generateAssignment(input, weights, { seed: 3 });

    expect(tableOf(result, 1)).not.toBe(tableOf(result, 2));
    expect(tableOf(result, 3)).not.toBe(tableOf(result, 4));
  });
});

describe("generateAssignment: capacity", () => {
  it("never exceeds a table's max seats", () => {
    const input = baseInput({
      guests: [guest({ id: 1 }), guest({ id: 2 }), guest({ id: 3 })],
      tables: [table({ id: 10, seats: 2 })],
    });

    const result = generateAssignment(input, noWeights, { seed: 1 });

    const atTable10 = result.assignments.filter((a) => a.tableId === 10);
    expect(atTable10.length).toBeLessThanOrEqual(2);
    expect(result.unassignedGuestIds.length).toBe(1);
  });

  it("raises a capacity_insufficient alert when total capacity is below the guest count", () => {
    const input = baseInput({
      guests: [guest({ id: 1 }), guest({ id: 2 }), guest({ id: 3 })],
      tables: [table({ id: 10, seats: 2 })],
    });

    const result = generateAssignment(input, noWeights, { seed: 1 });

    expect(
      result.alerts.some((a) => a.type === "capacity_insufficient"),
    ).toBe(true);
    expect(
      result.alerts.some((a) => a.type === "guest_unassigned"),
    ).toBe(true);
  });

  it("flags a table that ends up below its minimum", () => {
    const input = baseInput({
      guests: [guest({ id: 1 })],
      tables: [table({ id: 10, seats: 6, min_seats: 4 })],
    });

    const result = generateAssignment(input, noWeights, { seed: 1 });

    const alert = result.alerts.find((a) => a.type === "table_below_minimum");
    expect(alert).toBeDefined();
  });
});

describe("generateAssignment: guest status", () => {
  it("only places confirmed guests", () => {
    const input = baseInput({
      guests: [
        guest({ id: 1, status: "CONFIRMED" }),
        guest({ id: 2, status: "INVITED" }),
        guest({ id: 3, status: "DECLINED" }),
      ],
      tables: [table({ id: 10, seats: 4 })],
    });

    const result = generateAssignment(input, noWeights, { seed: 1 });

    expect(result.assignments.map((a) => a.guestId)).toEqual([1]);
    expect(result.unassignedGuestIds).toEqual([]);
  });
});
