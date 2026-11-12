import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../client.js", () => ({
  default: {
    host: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    guest: {
      updateMany: vi.fn(),
    },
  },
}));

import prisma from "../../client.js";
import { HostsService } from "./hosts.service.js";

const mockedPrisma = vi.mocked(prisma, { deep: true });

beforeEach(() => {
  vi.clearAllMocks();
  mockedPrisma.host.findMany.mockResolvedValue([]);
});

describe("HostsService.replace", () => {
  it("trims and deduplicates names before upserting", async () => {
    await HostsService.replace(1, [" Host A ", "Host A", "Host B", "", "   "]);

    expect(mockedPrisma.host.upsert).toHaveBeenCalledTimes(2);
    expect(mockedPrisma.host.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { event_id_name: { event_id: 1, name: "Host A" } },
      }),
    );
    expect(mockedPrisma.host.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { event_id_name: { event_id: 1, name: "Host B" } },
      }),
    );
  });

  it("reassigns orphaned guests and deletes hosts that are no longer present", async () => {
    mockedPrisma.host.findMany.mockResolvedValue([
      { id: 10, name: "Old Host" },
    ] as never);

    await HostsService.replace(1, ["New Host"]);

    expect(mockedPrisma.guest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          event_id: 1,
          OR: [{ host_id: { in: [10] } }, { host_name: { in: ["Old Host"] } }],
        }),
        data: { host_name: null, host_id: null },
      }),
    );
    expect(mockedPrisma.host.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [10] } },
    });
  });

  it("ignores non-string entries in the input array", async () => {
    await HostsService.replace(1, [123, null, "Host A"] as never);

    expect(mockedPrisma.host.upsert).toHaveBeenCalledTimes(1);
    expect(mockedPrisma.host.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { event_id_name: { event_id: 1, name: "Host A" } },
      }),
    );
  });
});
