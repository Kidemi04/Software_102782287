export type PaymentMethod = "CARD" | "WALLET" | "DUMMY";

export type CartItemInput = {
  ticketTypeId: string;
  quantity: number;
};

export type OrderItemDTO = {
  id: string;
  ticketTypeId: string;
  ticketTypeName: string;
  parkName: string;
  quantity: number;
  price: number;
};

export type OrderDTO = {
  id: string;
  createdAt: string;
  visitDate: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status: string;
  items: OrderItemDTO[];
};
