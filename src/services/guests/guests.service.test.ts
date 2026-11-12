import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../client.js", () => ({
  default: {
    guest: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    host: {
      upsert: vi.fn(),
    },
  },
}));

import prisma from "../../client.js";
import { GuestsService, getDefaultAvatarKey } from "./guests.service.js";

const mockedPrisma = vi.mocked(prisma, { deep: true });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getDefaultAvatarKey", () => {
  it("returns null when gender is missing", () => {
    expect(getDefaultAvatarKey(undefined, "ADULT")).toBeNull();
  });

  it("returns an adult female avatar by default", () => {
    expect(getDefaultAvatarKey("FEMALE", "ADULT")).toBe("female-1");
  });

  it("returns a child female avatar for CHILD age range", () => {
    expect(getDefaultAvatarKey("FEMALE", "CHILD")).toBe("girl-1");
  });

  it("returns a child female avatar for BABY age range", () => {
    expect(getDefaultAvatarKey("FEMALE", "BABY")).toBe("girl-1");
  });

  it("returns an adult male avatar by default", () => {
    expect(getDefaultAvatarKey("MALE", "ADULT")).toBe("male-1");
  });

  it("returns a child male avatar for CHILD age range", () => {
    expect(getDefaultAvatarKey("MALE", "CHILD")).toBe("boy-1");
  });
});

describe("GuestsService.create", () => {
  it("throws NotFoundError when main_guest_id does not belong to the event", async () => {
    mockedPrisma.guest.findFirst.mockResolvedValue(null);

    await expect(
      GuestsService.create(1, {
        full_name: "Plus One",
        guest_type: "PLUS_ONE",
        main_guest_id: 999,
        gender: "FEMALE",
      } as never),
    ).rejects.toThrow("Main guest not found in this event");

    expect(mockedPrisma.guest.create).not.toHaveBeenCalled();
  });

  it("resolves the host by upserting it and creates the guest", async () => {
    mockedPrisma.host.upsert.mockResolvedValue({ id: 42, name: "Host A" } as never);
    mockedPrisma.guest.create.mockResolvedValue({ id: 1 } as never);

    await GuestsService.create(1, {
      full_name: "Valeria",
      guest_type: "MAIN_GUEST",
      host_name: "Host A",
      gender: "FEMALE",
    } as never);

    expect(mockedPrisma.host.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { event_id_name: { event_id: 1, name: "Host A" } },
      }),
    );
    expect(mockedPrisma.guest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          event_id: 1,
          host_id: 42,
          avatar_key: "female-1",
        }),
      }),
    );
  });
});

describe("GuestsService.update", () => {
  it("throws NotFoundError when the guest does not exist in the event", async () => {
    mockedPrisma.guest.findFirst.mockResolvedValue(null);

    await expect(
      GuestsService.update(1, 123, { full_name: "New name" }),
    ).rejects.toThrow("Guest not found");
  });

  it("throws NotFoundError when the new main_guest_id is invalid", async () => {
    mockedPrisma.guest.findFirst
      .mockResolvedValueOnce({ id: 5, gender: "FEMALE", age_range: "ADULT" } as never)
      .mockResolvedValueOnce(null);

    await expect(
      GuestsService.update(1, 5, { main_guest_id: 999 }),
    ).rejects.toThrow("Main guest not found in this event");
  });
});
