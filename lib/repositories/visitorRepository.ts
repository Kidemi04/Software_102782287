import { prisma } from "../db";

export const visitorRepository = {
  async findByEmail(email: string) {
    return prisma.visitor.findUnique({
      where: { email },
    });
  },

  async getById(id: string) {
    return prisma.visitor.findUnique({
      where: { id },
    });
  },

  async createVisitor(name: string, email: string, password: string) {
    return prisma.visitor.create({
      data: {
        name,
        email,
        password,
      },
    });
  },

  async countVisitors() {
    return prisma.visitor.count();
  },
};
