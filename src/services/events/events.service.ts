import prisma from "../../client.js";
import type { Event, Prisma } from "@prisma/client";

export const EventsService = {
  list: async (): Promise<Event[]> => {
    return prisma.event.findMany({ orderBy: { id: "asc" } });
  },

  getById: async (id: number): Promise<Event | null> => {
    return prisma.event.findUnique({ where: { id } });
  },

  create: async (data: Prisma.EventCreateInput): Promise<Event> => {
    return prisma.event.create({ data });
  },

  update: async (id: number, data: Prisma.EventUpdateInput): Promise<Event> => {
    return prisma.event.update({ where: { id }, data });
  },

  remove: async (id: number): Promise<void> => {
    await prisma.event.delete({ where: { id } });
  },
};
