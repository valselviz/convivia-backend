import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../client.js", () => ({
  default: {
    guestGroup: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    guest: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    guestGroupMember: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import prisma from "../../client.js";
import { GuestGroupsService } from "./guest-groups.service.js";

const mockedPrisma = vi.mocked(prisma, { deep: true });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GuestGroupsService.update", () => {
  it("throws NotFoundError when the group does not exist in the event", async () => {
    mockedPrisma.guestGroup.findFirst.mockResolvedValue(null);

    await expect(
      GuestGroupsService.update(1, 999, { name: "New name" }),
    ).rejects.toThrow("Group not found");
  });
});

describe("GuestGroupsService.delete", () => {
  it("throws NotFoundError when nothing was deleted", async () => {
    mockedPrisma.guestGroup.deleteMany.mockResolvedValue({ count: 0 } as never);

    await expect(GuestGroupsService.delete(1, 999)).rejects.toThrow(
      "Group not found",
    );
  });
});

describe("GuestGroupsService.addMembers", () => {
  it("throws NotFoundError when the group does not exist", async () => {
    mockedPrisma.guestGroup.findFirst.mockResolvedValue(null);

    await expect(
      GuestGroupsService.addMembers(1, 999, [1, 2]),
    ).rejects.toThrow("Group not found");
  });

  it("throws NotFoundError when some guests don't belong to the event", async () => {
    mockedPrisma.guestGroup.findFirst.mockResolvedValue({ id: 1 } as never);
    mockedPrisma.guest.findMany.mockResolvedValue([{ id: 1 }] as never);

    await expect(
      GuestGroupsService.addMembers(1, 1, [1, 2]),
    ).rejects.toThrow("One or more guests not found in this event");
  });

  it("only inserts members that are not already in the group", async () => {
    mockedPrisma.guestGroup.findFirst.mockResolvedValue({ id: 1 } as never);
    mockedPrisma.guest.findMany.mockResolvedValue([
      { id: 1 },
      { id: 2 },
    ] as never);
    mockedPrisma.guestGroupMember.findMany.mockResolvedValue([
      { guest_id: 1 },
    ] as never);

    await GuestGroupsService.addMembers(1, 1, [1, 2]);

    expect(mockedPrisma.guestGroupMember.createMany).toHaveBeenCalledWith({
      data: [{ group_id: 1, guest_id: 2 }],
    });
  });
});
