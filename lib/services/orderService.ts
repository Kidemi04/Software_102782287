import type { OrderStatus } from "@prisma/client";
import { calculateCartTotal, buildReceipt } from "../domain/domainHelpers";
import type { CartItemInput, TransactionReceipt } from "../domain/domainTypes";
import { orderRepository } from "../repositories/orderRepository";
import { productRepository } from "../repositories/productRepository";
import { userRepository } from "../repositories/userRepository";

const toOrderDTO = (order: Awaited<ReturnType<typeof orderRepository.findByUser>>[number]) => ({
  orderId: order.orderId.toString(),
  createdAt: order.createdAt.toISOString(),
  totalAmount: Number(order.totalAmount),
  status: order.status as OrderStatus,
  items: order.items.map((item) => ({
    itemId: item.itemId.toString(),
    productId: item.productId.toString(),
    productName: item.product.productName,
    quantity: item.quantity,
    lockedPrice: Number(item.lockedPrice),
  })),
});

export const orderService = {
  async processCheckout(
    userIdInput: string,
    cartItems: CartItemInput[],
    paymentMethod: string
  ): Promise<
    | { success: false; message: string }
    | { success: true; message: string; receipt: TransactionReceipt }
  > {
    if (!userIdInput) {
      return { success: false, message: "User is required." };
    }
    if (!cartItems.length) {
      return { success: false, message: "Cart is empty." };
    }

    let userId: bigint;
    try {
      userId = BigInt(userIdInput);
    } catch {
      return { success: false, message: "User is invalid." };
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      return { success: false, message: "User not found." };
    }

    const productIds = cartItems.map((c) => BigInt(c.productId));
    const products = await productRepository.findByIds(productIds);
    if (products.length !== cartItems.length) {
      return { success: false, message: "One or more products are invalid." };
    }

    const items = cartItems.map((item) => {
      const product = products.find((p) => p.productId === BigInt(item.productId))!;
      return {
        productId: product.productId,
        quantity: item.quantity,
        lockedPrice: Number(product.unitPrice),
      };
    });

    const totalAmount = calculateCartTotal(items);
    const created = await orderRepository.createOrder(
      userId,
      items,
      "CONFIRMED"
    );

    return {
      success: true,
      message: `Order confirmed via ${paymentMethod}.`,
      receipt: buildReceipt({
        orderId: created.orderId.toString(),
        totalAmount,
        status: created.status,
      }),
    };
  },

  async cancelOrder(orderIdInput: string) {
    if (!orderIdInput) {
      return { success: false, message: "Order ID required." };
    }
    try {
      const orderId = BigInt(orderIdInput);
      const result = await orderRepository.cancelOrder(orderId);
      if (result.count === 0) {
        return { success: false, message: "Order not found or already cancelled." };
      }
      return { success: true, message: "Order cancelled." };
    } catch {
      return { success: false, message: "Invalid order id." };
    }
  },

  async getOrdersByUser(userIdInput: string) {
    try {
      const userId = BigInt(userIdInput);
      const orders = await orderRepository.findByUser(userId);
      return orders.map(toOrderDTO);
    } catch {
      return [];
    }
  },
};
