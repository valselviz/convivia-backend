import prisma from "../../client.js";

type HostDTO = { id: number; name: string };

const normalizeNames = (names: unknown): string[] => {
  if (!Array.isArray(names)) return [];
  const cleaned = names
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim())
    .filter(Boolean);
  return Array.from(new Set(cleaned));
};

export const HostsService = {
  list: async (eventId: number): Promise<HostDTO[]> => {
    return prisma.host.findMany({
      where: { event_id: eventId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  },

  replace: async (
    eventId: number,
    namesInput: unknown,
  ): Promise<HostDTO[]> => {
    const names = normalizeNames(namesInput);

    for (const name of names) {
      await prisma.host.upsert({
        where: {
          event_id_name: { event_id: eventId, name },
        },
        update: {},
        create: { event_id: eventId, name },
      });
    }

    const hostsToDelete = await prisma.host.findMany({
      where:
        names.length > 0
          ? { event_id: eventId, name: { notIn: names } }
          : { event_id: eventId },
      select: { id: true, name: true },
    });

    if (hostsToDelete.length) {
      const ids = hostsToDelete.map((h) => h.id);
      const namesToDelete = hostsToDelete.map((h) => h.name);
      await prisma.guest.updateMany({
        where: {
          event_id: eventId,
          OR: [{ host_id: { in: ids } }, { host_name: { in: namesToDelete } }],
        },
        data: { host_name: null, host_id: null },
      });
      await prisma.host.deleteMany({ where: { id: { in: ids } } });
    }

    return HostsService.list(eventId);
  },
};
