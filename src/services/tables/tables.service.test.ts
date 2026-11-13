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
  },
}));

import prisma from "../../client.js";
import { TablesService } from "./tables.service.js";

const mockedPrisma = vi.mocked(prisma, { deep: true });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TablesService.create", () => {
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
});

describe("TablesService.delete", () => {
  it("throws NotFoundError when nothing was deleted", async () => {
    mockedPrisma.table.deleteMany.mockResolvedValue({ count: 0 } as never);

    await expect(TablesService.delete(1, 999)).rejects.toThrow(
      "Table not found",
    );
  });
});
