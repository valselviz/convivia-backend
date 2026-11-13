import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../client.js", () => ({
  default: {
    table: {
      findFirst: vi.fn(),
    },
    guest: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    tableAssignment: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
    guestRelation: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import prisma from "../../client.js";
import { TableAssignmentsService } from "./table-assignments.service.js";

const mockedPrisma = vi.mocked(prisma, { deep: true });

const baseInput = { eventId: 1, tableId: 1, guestId: 1 };

beforeEach(() => {
  vi.clearAllMocks();
  mockedPrisma.$transaction.mockImplementation((callback: never) =>
    (callback as (tx: typeof mockedPrisma) => unknown)(mockedPrisma),
  );
  mockedPrisma.guestRelation.findMany.mockResolvedValue([] as never);
  mockedPrisma.tableAssignment.findMany.mockResolvedValue([] as never);
});

describe("TableAssignmentsService.assign", () => {
  it("throws NotFoundError when the table doesn't belong to the event", async () => {
    mockedPrisma.table.findFirst.mockResolvedValue(null);
    mockedPrisma.guest.findFirst.mockResolvedValue({ id: 1 } as never);

    await expect(TableAssignmentsService.assign(baseInput)).rejects.toThrow(
      "Table not found in this event",
    );
  });

  it("throws NotFoundError when the guest doesn't belong to the event", async () => {
    mockedPrisma.table.findFirst.mockResolvedValue({ id: 1, seats: 8 } as never);
    mockedPrisma.guest.findFirst.mockResolvedValue(null);

    await expect(TableAssignmentsService.assign(baseInput)).rejects.toThrow(
      "Guest not found in this event",
    );
  });

  it("throws ConflictError when the guest is already assigned to a table", async () => {
    mockedPrisma.table.findFirst.mockResolvedValue({ id: 1, seats: 8 } as never);
    mockedPrisma.guest.findFirst.mockResolvedValue({ id: 1 } as never);
    mockedPrisma.tableAssignment.findFirst.mockResolvedValue({ id: 5 } as never);

    await expect(TableAssignmentsService.assign(baseInput)).rejects.toThrow(
      "Guest is already assigned to a table",
    );
  });

  it("throws BadRequestError when the seat number exceeds capacity", async () => {
    mockedPrisma.table.findFirst.mockResolvedValue({ id: 1, seats: 4 } as never);
    mockedPrisma.guest.findFirst.mockResolvedValue({ id: 1 } as never);
    mockedPrisma.tableAssignment.findFirst
      .mockResolvedValueOnce(null) // existing assignment check
      .mockResolvedValueOnce(null); // seat taken check

    await expect(
      TableAssignmentsService.assign({ ...baseInput, seatNumber: 10 }),
    ).rejects.toThrow("Seat number exceeds table capacity");
  });

  it("throws ConflictError when the seat is already taken", async () => {
    mockedPrisma.table.findFirst.mockResolvedValue({ id: 1, seats: 8 } as never);
    mockedPrisma.guest.findFirst.mockResolvedValue({ id: 1 } as never);
    mockedPrisma.tableAssignment.findFirst
      .mockResolvedValueOnce(null) // existing assignment check
      .mockResolvedValueOnce({ id: 9 } as never); // seat taken check

    await expect(
      TableAssignmentsService.assign({ ...baseInput, seatNumber: 3 }),
    ).rejects.toThrow("Seat number already taken");
  });

  it("creates the assignment when everything is valid", async () => {
    mockedPrisma.table.findFirst.mockResolvedValue({ id: 1, seats: 8 } as never);
    mockedPrisma.guest.findFirst.mockResolvedValue({ id: 1 } as never);
    mockedPrisma.tableAssignment.findFirst.mockResolvedValue(null);
    mockedPrisma.tableAssignment.create.mockResolvedValue({ id: 1 } as never);

    await TableAssignmentsService.assign({ ...baseInput, seatNumber: 3 });

    expect(mockedPrisma.tableAssignment.create).toHaveBeenCalledWith({
      data: { table_id: 1, guest_id: 1, seat_number: 3 },
    });
  });
});

describe("TableAssignmentsService.reassign", () => {
  it("throws NotFoundError when the table doesn't belong to the event", async () => {
    mockedPrisma.table.findFirst.mockResolvedValue(null);
    mockedPrisma.guest.findFirst.mockResolvedValue({ id: 1 } as never);

    await expect(TableAssignmentsService.reassign(baseInput)).rejects.toThrow(
      "Table not found in this event",
    );
  });

  it("throws BadRequestError when the seat number exceeds capacity", async () => {
    mockedPrisma.table.findFirst.mockResolvedValue({ id: 1, seats: 4 } as never);
    mockedPrisma.guest.findFirst.mockResolvedValue({ id: 1 } as never);

    await expect(
      TableAssignmentsService.reassign({ ...baseInput, seatNumber: 10 }),
    ).rejects.toThrow("Seat number exceeds table capacity");
  });

  it("displaces whoever was in the destination seat and locks the new assignment", async () => {
    mockedPrisma.table.findFirst.mockResolvedValue({ id: 1, seats: 8 } as never);
    mockedPrisma.guest.findFirst.mockResolvedValue({
      id: 1,
      full_name: "Valeria",
      main_guest_id: null,
      other_guests: [],
    } as never);
    mockedPrisma.tableAssignment.create.mockResolvedValue({
      id: 99,
      table_id: 1,
      guest_id: 1,
      seat_number: 3,
      locked: true,
    } as never);

    const result = await TableAssignmentsService.reassign({
      ...baseInput,
      seatNumber: 3,
    });

    expect(mockedPrisma.tableAssignment.deleteMany).toHaveBeenCalledWith({
      where: { table_id: 1, seat_number: 3, guest_id: { not: 1 } },
    });
    expect(mockedPrisma.tableAssignment.deleteMany).toHaveBeenCalledWith({
      where: { guest_id: 1 },
    });
    expect(mockedPrisma.tableAssignment.create).toHaveBeenCalledWith({
      data: { table_id: 1, guest_id: 1, seat_number: 3, locked: true },
    });
    expect(result.assignment.locked).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  it("warns (without blocking) when a +1 ends up at a different table than their main guest", async () => {
    mockedPrisma.table.findFirst.mockResolvedValue({ id: 2, seats: 8 } as never);
    mockedPrisma.guest.findFirst.mockResolvedValue({
      id: 10,
      full_name: "Plus One",
      main_guest_id: 20,
      other_guests: [],
    } as never);
    mockedPrisma.guest.findUnique.mockResolvedValue({
      id: 20,
      full_name: "Main Guest",
    } as never);
    mockedPrisma.tableAssignment.findMany.mockResolvedValue([
      { guest_id: 20, table_id: 1 },
    ] as never);
    mockedPrisma.tableAssignment.create.mockResolvedValue({
      id: 1,
      table_id: 2,
      guest_id: 10,
      seat_number: null,
      locked: true,
    } as never);

    const result = await TableAssignmentsService.reassign({
      eventId: 1,
      guestId: 10,
      tableId: 2,
    });

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("Main Guest");
  });

  it("warns (without blocking) when seating two guests with a CONFLICT relation at the same table", async () => {
    mockedPrisma.table.findFirst.mockResolvedValue({ id: 2, seats: 8 } as never);
    mockedPrisma.guest.findFirst.mockResolvedValue({
      id: 10,
      full_name: "Guest A",
      main_guest_id: null,
      other_guests: [],
    } as never);
    mockedPrisma.guestRelation.findMany.mockResolvedValue([
      { guest_a_id: 10, guest_b_id: 11 },
    ] as never);
    mockedPrisma.tableAssignment.findMany.mockResolvedValue([
      {
        guest_id: 11,
        table_id: 2,
        guest: { full_name: "Guest B" },
      },
    ] as never);
    mockedPrisma.tableAssignment.create.mockResolvedValue({
      id: 1,
      table_id: 2,
      guest_id: 10,
      seat_number: null,
      locked: true,
    } as never);

    const result = await TableAssignmentsService.reassign({
      eventId: 1,
      guestId: 10,
      tableId: 2,
    });

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("Guest B");
  });
});

describe("TableAssignmentsService.unassign", () => {
  it("throws NotFoundError when the guest doesn't belong to the event", async () => {
    mockedPrisma.guest.findFirst.mockResolvedValue(null);

    await expect(TableAssignmentsService.unassign(1, 999)).rejects.toThrow(
      "Guest not found in this event",
    );
  });

  it("deletes the guest's assignment", async () => {
    mockedPrisma.guest.findFirst.mockResolvedValue({ id: 1 } as never);

    await TableAssignmentsService.unassign(1, 1);

    expect(mockedPrisma.tableAssignment.deleteMany).toHaveBeenCalledWith({
      where: { guest_id: 1 },
    });
  });
});

describe("TableAssignmentsService.setLocked", () => {
  it("throws NotFoundError when the guest has no assignment", async () => {
    mockedPrisma.guest.findFirst.mockResolvedValue({ id: 1 } as never);
    mockedPrisma.tableAssignment.findFirst.mockResolvedValue(null);

    await expect(
      TableAssignmentsService.setLocked(1, 1, true),
    ).rejects.toThrow("Guest is not assigned to a table");
  });

  it("updates the locked flag", async () => {
    mockedPrisma.guest.findFirst.mockResolvedValue({ id: 1 } as never);
    mockedPrisma.tableAssignment.findFirst.mockResolvedValue({ id: 5 } as never);
    mockedPrisma.tableAssignment.update.mockResolvedValue({
      id: 5,
      locked: false,
    } as never);

    await TableAssignmentsService.setLocked(1, 1, false);

    expect(mockedPrisma.tableAssignment.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { locked: false },
    });
  });
});

describe("TableAssignmentsService.unlockAll", () => {
  it("unlocks every assignment in the event", async () => {
    mockedPrisma.tableAssignment.updateMany.mockResolvedValue({
      count: 4,
    } as never);

    const count = await TableAssignmentsService.unlockAll(1);

    expect(count).toBe(4);
    expect(mockedPrisma.tableAssignment.updateMany).toHaveBeenCalledWith({
      where: { table: { event_id: 1 } },
      data: { locked: false },
    });
  });
});
