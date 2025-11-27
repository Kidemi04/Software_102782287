import type { CartItemInput, OrderDTO, OrderItemDTO, PaymentMethod } from "./domainTypes";

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);

export const calculateCartTotal = (items: { price: number; quantity: number }[]) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

export const calculateTicketCount = (items: { quantity: number }[]) =>
  items.reduce((sum, item) => sum + item.quantity, 0);

export const buildOrderDTO = (params: {
  id: string;
  createdAt: Date;
  visitDate: Date;
  paymentMethod: PaymentMethod;
  status: string;
  items: OrderItemDTO[];
  totalAmount: number;
}): OrderDTO => ({
  id: params.id,
  createdAt: params.createdAt.toISOString(),
  visitDate: params.visitDate.toISOString(),
  paymentMethod: params.paymentMethod,
  status: params.status,
  items: params.items,
  totalAmount: params.totalAmount,
});

export type CheckoutCartItem = CartItemInput & {
  price: number;
  ticketTypeName: string;
  parkName: string;
};
