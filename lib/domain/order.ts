import type { OrderDTO, OrderItemDTO, PaymentMethod } from "./domainTypes";

export type Order = OrderDTO;
export type OrderItem = OrderItemDTO;

export type OrderCreateInput = {
  visitorId: string;
  paymentMethod: PaymentMethod;
  visitDate: Date;
  items: {
    ticketTypeId: string;
    quantity: number;
    price: number;
    ticketTypeName: string;
    parkName: string;
  }[];
  totalAmount: number;
};
