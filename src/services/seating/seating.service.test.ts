import { describe, expect, it } from "vitest";
import { assignSeatNumbers } from "./seating.service.js";

describe("assignSeatNumbers", () => {
  it("assigns sequential seat numbers per table starting at 1", () => {
    const result = assignSeatNumbers(
      [
        { tableId: 10, guestId: 1 },
        { tableId: 10, guestId: 2 },
        { tableId: 20, guestId: 3 },
      ],
      new Map(),
    );

    expect(result).toEqual([
      { table_id: 10, guest_id: 1, seat_number: 1 },
      { table_id: 10, guest_id: 2, seat_number: 2 },
      { table_id: 20, guest_id: 3, seat_number: 1 },
    ]);
  });

  it("skips seat numbers already taken by locked assignments", () => {
    const taken = new Map([[10, new Set([1, 2])]]);

    const result = assignSeatNumbers(
      [{ tableId: 10, guestId: 5 }],
      taken,
    );

    expect(result).toEqual([{ table_id: 10, guest_id: 5, seat_number: 3 }]);
  });
});
