import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../client.js", () => ({
  default: {
    table: {
      findFirst: vi.fn(),
    },
    guest: {
      findFirst: vi.fn(),
    },
    tableAssignment: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import prisma from "../../client.js";
import { TableAssignmentsService } from "./table-assignments.service.js";

const mockedPrisma = vi.mocked(prisma, { deep: true });

const baseInput = { eventId: 1, tableId: 1, guestId: 1 };

beforeEach(() => {
  vi.clearAllMocks();
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

  it("throws ConflictError when the guest is already assigned to the table", async () => {
    mockedPrisma.table.findFirst.mockResolvedValue({ id: 1, seats: 8 } as never);
    mockedPrisma.guest.findFirst.mockResolvedValue({ id: 1 } as never);
    mockedPrisma.tableAssignment.findFirst.mockResolvedValue({ id: 5 } as never);

    await expect(TableAssignmentsService.assign(baseInput)).rejects.toThrow(
      "Guest already assigned to this table",
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
