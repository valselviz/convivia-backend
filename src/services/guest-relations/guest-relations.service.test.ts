import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../client.js", () => ({
  default: {
    guest: {
      findMany: vi.fn(),
    },
    guestRelation: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import prisma from "../../client.js";
import { GuestRelationsService, normalizePair } from "./guest-relations.service.js";

const mockedPrisma = vi.mocked(prisma, { deep: true });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("normalizePair", () => {
  it("keeps the order when the first id is already smaller", () => {
    expect(normalizePair(1, 2)).toEqual({ guest_a_id: 1, guest_b_id: 2 });
  });

  it("swaps the order when the first id is larger", () => {
    expect(normalizePair(5, 2)).toEqual({ guest_a_id: 2, guest_b_id: 5 });
  });
});

describe("GuestRelationsService.create", () => {
  it("rejects relating a guest to themselves", async () => {
    await expect(
      GuestRelationsService.create(1, { guest_id_1: 7, guest_id_2: 7, kind: "AFFINITY" }),
    ).rejects.toThrow("Cannot relate a guest to themselves");

    expect(mockedPrisma.guest.findMany).not.toHaveBeenCalled();
  });

  it("throws NotFoundError when a guest does not belong to the event", async () => {
    mockedPrisma.guest.findMany.mockResolvedValue([{ id: 1 }] as never);

    await expect(
      GuestRelationsService.create(1, { guest_id_1: 1, guest_id_2: 2, kind: "AFFINITY" }),
    ).rejects.toThrow("One or more guests not found in this event");
  });

  it("clamps strength between 1 and 5", async () => {
    mockedPrisma.guest.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }] as never);
    mockedPrisma.guestRelation.create.mockResolvedValue({ id: 1 } as never);

    await GuestRelationsService.create(1, {
      guest_id_1: 1,
      guest_id_2: 2,
      kind: "CONFLICT",
      strength: 99,
    });

    expect(mockedPrisma.guestRelation.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ strength: 5 }) }),
    );
  });

  it("defaults strength to 3 when not provided", async () => {
    mockedPrisma.guest.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }] as never);
    mockedPrisma.guestRelation.create.mockResolvedValue({ id: 1 } as never);

    await GuestRelationsService.create(1, {
      guest_id_1: 1,
      guest_id_2: 2,
      kind: "SOCIAL",
    });

    expect(mockedPrisma.guestRelation.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ strength: 3 }) }),
    );
  });
});

describe("GuestRelationsService.update / remove", () => {
  it("throws NotFoundError when updating a relation that doesn't exist", async () => {
    mockedPrisma.guestRelation.findFirst.mockResolvedValue(null);

    await expect(
      GuestRelationsService.update(1, 999, { notes: "hi" }),
    ).rejects.toThrow("Relation not found");
  });

  it("throws NotFoundError when removing a relation that doesn't exist", async () => {
    mockedPrisma.guestRelation.deleteMany.mockResolvedValue({ count: 0 } as never);

    await expect(GuestRelationsService.remove(1, 999)).rejects.toThrow(
      "Relation not found",
    );
  });
});
