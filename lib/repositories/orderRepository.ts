import type { PaymentMethod } from "../domain/domainTypes";
import { prisma } from "../db";

type OrderItemInput = {
  ticketTypeId: string;
  quantity: number;
  price: number;
};

export const orderRepository = {
  async createOrder(params: {
    visitorId: string;
    paymentMethod: PaymentMethod;
    totalAmount: number;
    visitDate: Date;
    items: OrderItemInput[];
  }) {
    return prisma.order.create({
      data: {
        visitorId: params.visitorId,
        paymentMethod: params.paymentMethod,
        totalAmount: params.totalAmount,
        visitDate: params.visitDate,
        items: {
          create: params.items.map((item) => ({
            ticketTypeId: item.ticketTypeId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: {
          include: {
            ticketType: {
              include: { park: true },
            },
          },
        },
      },
    });
  },

  async cancelOrder(orderId: string, visitorId: string) {
    return prisma.order.updateMany({
      where: { id: orderId, visitorId },
      data: { status: "CANCELLED" },
    });
  },

  async rescheduleOrder(orderId: string, visitorId: string, visitDate: Date) {
    return prisma.order.updateMany({
      where: { id: orderId, visitorId, status: "CONFIRMED" },
      data: { visitDate },
    });
  },

  async getOrdersByVisitor(visitorId: string) {
    return prisma.order.findMany({
      where: { visitorId },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            ticketType: { include: { park: true } },
          },
        },
      },
    });
  },

  async getAllOrders() {
    return prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            ticketType: { include: { park: true } },
          },
        },
      },
    });
  },
};
