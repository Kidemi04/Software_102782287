import type { PaymentMethod } from "../domain/domainTypes";
import { orderRepository } from "../repositories/orderRepository";
import { visitorRepository } from "../repositories/visitorRepository";

const toOrderDTO = (order: Awaited<ReturnType<typeof orderRepository.getAllOrders>>[number]) => ({
  id: order.id,
  createdAt: order.createdAt.toISOString(),
  visitDate: order.visitDate.toISOString(),
  paymentMethod: order.paymentMethod as PaymentMethod,
  status: order.status,
  totalAmount: order.totalAmount,
  items: order.items.map((item) => ({
    id: item.id,
    ticketTypeId: item.ticketTypeId,
    ticketTypeName: item.ticketType.name,
    parkName: item.ticketType.park.name,
    quantity: item.quantity,
    price: item.price,
  })),
});

export const reportService = {
  async getSystemReport() {
    const visitorCount = await visitorRepository.countVisitors();
    const orders = await orderRepository.getAllOrders();
    const ordersDto = orders.map(toOrderDTO);
    const totalRevenue = ordersDto.reduce((sum, o) => sum + o.totalAmount, 0);
    return {
      totalVisitors: visitorCount,
      totalOrders: ordersDto.length,
      totalRevenue,
      orders: ordersDto,
    };
  },
};
