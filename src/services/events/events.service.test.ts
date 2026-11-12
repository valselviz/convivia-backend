import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../client.js", () => ({
  default: {
    event: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import prisma from "../../client.js";
import { EventsService } from "./events.service.js";

const mockedPrisma = vi.mocked(prisma, { deep: true });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("EventsService", () => {
  it("lists events ordered by id", async () => {
    mockedPrisma.event.findMany.mockResolvedValue([] as never);

    await EventsService.list();

    expect(mockedPrisma.event.findMany).toHaveBeenCalledWith({
      orderBy: { id: "asc" },
    });
  });

  it("creates an event with the given data", async () => {
    mockedPrisma.event.create.mockResolvedValue({ id: 1, name: "Boda" } as never);

    const result = await EventsService.create({ name: "Boda" });

    expect(mockedPrisma.event.create).toHaveBeenCalledWith({
      data: { name: "Boda" },
    });
    expect(result).toEqual({ id: 1, name: "Boda" });
  });
});
