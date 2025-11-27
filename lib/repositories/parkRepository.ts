import { prisma } from "../db";

export const parkRepository = {
  async getAllParksWithTicketTypes() {
    return prisma.park.findMany({
      include: {
        ticketTypes: true,
      },
      orderBy: { id: "asc" },
    });
  },

  async getParkByIdWithTicketTypes(id: string) {
    return prisma.park.findUnique({
      where: { id },
      include: {
        ticketTypes: true,
      },
    });
  },

  async getTicketTypesByIds(ids: string[]) {
    return prisma.ticketType.findMany({
      where: { id: { in: ids } },
      include: { park: true },
    });
  },
};
