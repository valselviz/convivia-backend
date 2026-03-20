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
  list: async (): Promise<HostDTO[]> => {
    return prisma.host.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  },

  // Replace hosts set. Guests pointing to deleted hosts will be unassigned.
  replace: async (namesInput: unknown): Promise<HostDTO[]> => {
    const names = normalizeNames(namesInput);

    // Create/ensure hosts
    for (const name of names) {
      await prisma.host.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }

    // Delete hosts not present in the new set.
    // Before deleting, nullify guest host_name/host_id so filtering and UI stay consistent.
    const hostsToDelete = await prisma.host.findMany({
      where: names.length ? { name: { notIn: names } } : {},
      select: { id: true, name: true },
    });

    if (hostsToDelete.length) {
      const ids = hostsToDelete.map((h) => h.id);
      const namesToDelete = hostsToDelete.map((h) => h.name);
      await prisma.guest.updateMany({
        where: {
          OR: [{ host_id: { in: ids } }, { host_name: { in: namesToDelete } }],
        },
        data: { host_name: null, host_id: null },
      });
      await prisma.host.deleteMany({ where: { id: { in: ids } } });
    }

    return HostsService.list();
  },
};

