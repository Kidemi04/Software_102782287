import { prisma } from "../db";

export const userRepository = {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  async createUser(fullName: string, email: string, passwordHash: string) {
    return prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
      },
    });
  },

  async findById(userId: bigint) {
    return prisma.user.findUnique({ where: { userId } });
  },

  async countUsers() {
    return prisma.user.count();
  },
};
