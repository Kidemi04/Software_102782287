import type { CartItemInput, PaymentMethod } from "../domain/domainTypes";
import { calculateCartTotal, calculateTicketCount } from "../domain/domainHelpers";
import { paymentStrategyFactory } from "../factory/paymentStrategyFactory";
import { orderRepository } from "../repositories/orderRepository";
import { parkRepository } from "../repositories/parkRepository";
import { systemConfiguration } from "../config/systemConfiguration";
import type { OrderDTO } from "../domain/domainTypes";

const toOrderDTO = (order: Awaited<ReturnType<typeof orderRepository.createOrder>>): OrderDTO => ({
  id: order.id,
  createdAt: order.createdAt.toISOString(),
  visitDate: order.visitDate.toISOString(),
  status: order.status,
  paymentMethod: order.paymentMethod as PaymentMethod,
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

export const orderService = {
  async checkout(params: {
    visitorId: string;
    cartItems: CartItemInput[];
    paymentMethod: PaymentMethod;
    visitDate: string;
    paymentDetails?: { cardNumber?: string; cvv?: string; walletId?: string };
  }) {
    if (!params.visitorId) {
      return { success: false, message: "You must be logged in to checkout." };
    }
    if (!params.cartItems.length) {
      return { success: false, message: "Your cart is empty." };
    }
    if (!params.visitDate) {
      return { success: false, message: "Please select a visit date." };
    }
    const visitDate = new Date(params.visitDate);
    if (Number.isNaN(visitDate.getTime())) {
      return { success: false, message: "Visit date is invalid." };
    }

    const totalTickets = calculateTicketCount(params.cartItems);
    if (totalTickets > systemConfiguration.maxTicketsPerOrder) {
      return {
        success: false,
        message: `Max ${systemConfiguration.maxTicketsPerOrder} tickets per order.`,
      };
    }

    // Load ticket details from DB.
    const requestedIds = params.cartItems.map((i) => i.ticketTypeId);
    const ticketTypes = await parkRepository.getTicketTypesByIds(requestedIds);
    if (ticketTypes.length !== requestedIds.length) {
      return { success: false, message: "Some ticket types are invalid." };
    }

    const itemsWithPricing = params.cartItems.map((item) => {
      const ticket = ticketTypes.find((t) => t.id === item.ticketTypeId)!;
      return {
        ticketTypeId: item.ticketTypeId,
        quantity: item.quantity,
        price: ticket.price,
        ticketTypeName: ticket.name,
        parkName: ticket.park.name,
      };
    });

    const totalAmount = calculateCartTotal(itemsWithPricing);

    const strategy = paymentStrategyFactory(params.paymentMethod, {
      cardNumber: params.paymentDetails?.cardNumber,
      cvv: params.paymentDetails?.cvv,
      walletId: params.paymentDetails?.walletId,
    });
    const paymentResult = await strategy.execute(totalAmount);
    if (!paymentResult.success) {
      return { success: false, message: paymentResult.message };
    }

    const created = await orderRepository.createOrder({
      visitorId: params.visitorId,
      paymentMethod: params.paymentMethod,
      totalAmount,
      visitDate,
      items: itemsWithPricing.map((i) => ({
        ticketTypeId: i.ticketTypeId,
        quantity: i.quantity,
        price: i.price,
      })),
    });

    return { success: true, message: paymentResult.message, order: toOrderDTO(created) };
  },

  async history(visitorId: string) {
    const orders = await orderRepository.getOrdersByVisitor(visitorId);
    return orders.map((order) => toOrderDTO(order));
  },

  async cancel(visitorId: string, orderId: string) {
    if (!visitorId || !orderId) {
      return { success: false, message: "Missing visitor or order." };
    }
    const result = await orderRepository.cancelOrder(orderId, visitorId);
    if (result.count === 0) {
      return { success: false, message: "Order not found or already cancelled." };
    }
    return { success: true, message: "Order cancelled." };
  },

  async reschedule(visitorId: string, orderId: string, visitDate: string) {
    if (!visitorId || !orderId) {
      return { success: false, message: "Missing visitor or order." };
    }
    const parsed = new Date(visitDate);
    if (Number.isNaN(parsed.getTime())) {
      return { success: false, message: "Invalid visit date." };
    }
    const result = await orderRepository.rescheduleOrder(orderId, visitorId, parsed);
    if (result.count === 0) {
      return { success: false, message: "Order not found or cannot be rescheduled." };
    }
    return { success: true, message: "Order rescheduled." };
  },
};
