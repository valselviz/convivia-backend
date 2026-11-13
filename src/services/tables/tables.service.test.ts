import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../client.js", () => ({
  default: {
    table: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    event: {
      findUnique: vi.fn(),
    },
  },
}));

import prisma from "../../client.js";
import { TablesService } from "./tables.service.js";

const mockedPrisma = vi.mocked(prisma, { deep: true });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TablesService.create", () => {
  it("throws BadRequestError when min_seats exceeds seats", async () => {
    await expect(
      TablesService.create(1, {
        name: "Mesa 1",
        shape: "redonda",
        seats: 4,
        min_seats: 6,
      } as never),
    ).rejects.toThrow("min_seats cannot exceed seats");

    expect(mockedPrisma.table.create).not.toHaveBeenCalled();
  });

  it("creates the table without checking conflicts when no position is given", async () => {
    mockedPrisma.table.create.mockResolvedValue({ id: 1 } as never);

    await TablesService.create(1, {
      name: "Mesa 1",
      shape: "redonda",
      seats: 8,
    } as never);

    expect(mockedPrisma.table.findMany).not.toHaveBeenCalled();
    expect(mockedPrisma.table.create).toHaveBeenCalled();
  });

  it("throws ConflictError when the given position overlaps an existing table", async () => {
    mockedPrisma.table.findMany.mockResolvedValue([
      {
        id: 2,
        name: "Mesa existente",
        shape: "redonda",
        pos_x: 0,
        pos_y: 0,
        width: 1.5,
        height: 1.5,
      },
    ] as never);

    await expect(
      TablesService.create(1, {
        name: "Mesa 1",
        shape: "redonda",
        seats: 8,
        pos_x: 0.2,
        pos_y: 0,
        width: 1.5,
        height: 1.5,
      } as never),
    ).rejects.toThrow('Mesa existente');

    expect(mockedPrisma.table.create).not.toHaveBeenCalled();
  });
});

describe("TablesService.update", () => {
  it("throws BadRequestError when the new min_seats exceeds the existing seats", async () => {
    mockedPrisma.table.findFirst.mockResolvedValue({
      id: 1,
      seats: 4,
      min_seats: null,
      shape: "redonda",
      pos_x: null,
      pos_y: null,
      width: 1.5,
      height: 1.5,
    } as never);

    await expect(
      TablesService.update(1, 1, { min_seats: 6 }),
    ).rejects.toThrow("min_seats cannot exceed seats");

    expect(mockedPrisma.table.update).not.toHaveBeenCalled();
  });

  it("throws NotFoundError when the table doesn't exist in the event", async () => {
    mockedPrisma.table.findFirst.mockResolvedValue(null);

    await expect(
      TablesService.update(1, 999, { seats: 10 }),
    ).rejects.toThrow("Table not found");
  });

  it("skips the conflict check when neither the existing nor the incoming data has a position", async () => {
    mockedPrisma.table.findFirst.mockResolvedValue({
      id: 1,
      shape: "redonda",
      pos_x: null,
      pos_y: null,
      width: 1.5,
      height: 1.5,
    } as never);
    mockedPrisma.table.update.mockResolvedValue({ id: 1 } as never);

    await TablesService.update(1, 1, { seats: 10 });

    expect(mockedPrisma.table.findMany).not.toHaveBeenCalled();
    expect(mockedPrisma.table.update).toHaveBeenCalled();
  });

  it("throws ConflictError when moving a table too close to another", async () => {
    mockedPrisma.table.findFirst.mockResolvedValue({
      id: 1,
      shape: "redonda",
      pos_x: 10,
      pos_y: 10,
      width: 1.5,
      height: 1.5,
    } as never);
    mockedPrisma.table.findMany.mockResolvedValue([
      {
        id: 2,
        name: "Mesa vecina",
        shape: "redonda",
        pos_x: 0,
        pos_y: 0,
        width: 1.5,
        height: 1.5,
      },
    ] as never);

    await expect(
      TablesService.update(1, 1, { pos_x: 0.3, pos_y: 0 }),
    ).rejects.toThrow("Mesa vecina");

    expect(mockedPrisma.table.update).not.toHaveBeenCalled();
  });

  it("allows moving a table to a free spot", async () => {
    mockedPrisma.table.findFirst.mockResolvedValue({
      id: 1,
      shape: "redonda",
      pos_x: null,
      pos_y: null,
      width: 1.5,
      height: 1.5,
    } as never);
    mockedPrisma.table.findMany.mockResolvedValue([
      {
        id: 2,
        name: "Mesa vecina",
        shape: "redonda",
        pos_x: 0,
        pos_y: 0,
        width: 1.5,
        height: 1.5,
      },
    ] as never);
    mockedPrisma.table.update.mockResolvedValue({ id: 1 } as never);

    await TablesService.update(1, 1, { pos_x: 10, pos_y: 10 });

    expect(mockedPrisma.table.update).toHaveBeenCalled();
  });

  it("throws BadRequestError when the table (with its seats) would poke outside the room", async () => {
    mockedPrisma.table.findFirst.mockResolvedValue({
      id: 1,
      shape: "redonda",
      pos_x: null,
      pos_y: null,
      width: 1.5,
      height: 1.5,
    } as never);
    mockedPrisma.table.findMany.mockResolvedValue([] as never);
    mockedPrisma.event.findUnique.mockResolvedValue({
      id: 1,
      room_width_m: 10,
      room_height_m: 10,
    } as never);

    await expect(
      TablesService.update(1, 1, { pos_x: 0.3, pos_y: 5 }),
    ).rejects.toThrow("does not fit within the room boundaries");

    expect(mockedPrisma.table.update).not.toHaveBeenCalled();
  });

  it("flags two tables as conflicting once their seat rings are considered, even if the bare tables keep the 1m gap", async () => {
    mockedPrisma.table.findFirst.mockResolvedValue({
      id: 1,
      shape: "redonda",
      pos_x: null,
      pos_y: null,
      width: 1.5,
      height: 1.5,
    } as never);
    mockedPrisma.table.findMany.mockResolvedValue([
      {
        id: 2,
        name: "Mesa vecina",
        shape: "redonda",
        pos_x: 7.5,
        pos_y: 5,
        width: 1.5,
        height: 1.5,
      },
    ] as never);
    mockedPrisma.event.findUnique.mockResolvedValue({
      id: 1,
      room_width_m: 20,
      room_height_m: 20,
    } as never);

    // bare edge-to-edge gap is exactly 1m, but seats push the two tables into conflict
    await expect(
      TablesService.update(1, 1, { pos_x: 5, pos_y: 5 }),
    ).rejects.toThrow("Mesa vecina");
  });
});

describe("TablesService.delete", () => {
  it("throws NotFoundError when nothing was deleted", async () => {
    mockedPrisma.table.deleteMany.mockResolvedValue({ count: 0 } as never);

    await expect(TablesService.delete(1, 999)).rejects.toThrow(
      "Table not found",
    );
  });
});
