import type { OrderStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "../db";

type CreateOrderItem = {
  productId: bigint;
  quantity: number;
  lockedPrice: number;
};

export const orderRepository = {
  async createOrder(userId: bigint, items: CreateOrderItem[], status: OrderStatus) {
    const totalAmountNumber = items.reduce((sum, i) => sum + i.lockedPrice * i.quantity, 0);
    return prisma.order.create({
      data: {
        userId,
        status,
        totalAmount: new Prisma.Decimal(totalAmountNumber),
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            lockedPrice: new Prisma.Decimal(item.lockedPrice),
          })),
        },
      },
      include: {
        items: { include: { product: true } },
      },
    });
  },

  async findByUser(userId: bigint) {
    return prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  async findAll() {
    return prisma.order.findMany({
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  async cancelOrder(orderId: bigint) {
    return prisma.order.updateMany({
      where: { orderId },
      data: { status: "CANCELLED" },
    });
  },
};
