export type PaymentMethod = "CARD" | "WALLET" | "DUMMY";

export type TicketType = {
  id: string;
  name: string;
  basePrice: number;
  parkId: string;
  parkName: string;
};

export type Park = {
  id: string;
  name: string;
  location: string;
  ticketTypes: TicketType[];
};

export type CartItem = {
  ticket: TicketType;
  quantity: number;
};

export type OrderItem = {
  ticketTypeName: string;
  parkName: string;
  quantity: number;
  priceAtPurchase: number;
};

export type Order = {
  id: string;
  date: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
};

export type Visitor = {
  id: string;
  name: string;
  email: string;
  password: string;
  orderHistory: Order[];
};

export const systemConfiguration = {
  maxTicketsPerOrder: 10,
  refundAllowedDays: 7,
  systemName: "National Parks Online Portal (NPOP)",
};

export const paymentMethods: {
  key: PaymentMethod;
  label: string;
  description: string;
}[] = [
  {
    key: "CARD",
    label: "Credit Card",
    description: "Pay with card number and CVV (mirrors CardPaymentStrategy).",
  },
  {
    key: "WALLET",
    label: "Digital Wallet",
    description: "Use a wallet identifier (mirrors WalletPaymentStrategy).",
  },
  {
    key: "DUMMY",
    label: "Dummy Payment",
    description: "Always succeeds; useful for demos and tests.",
  },
];

export const seedParks: Park[] = [
  {
    id: "P01",
    name: "Yellowstone",
    location: "Wyoming",
    ticketTypes: [
      {
        id: "T01",
        name: "Adult Day Pass",
        basePrice: 20,
        parkId: "P01",
        parkName: "Yellowstone",
      },
      {
        id: "T02",
        name: "Child Day Pass",
        basePrice: 10,
        parkId: "P01",
        parkName: "Yellowstone",
      },
    ],
  },
  {
    id: "P02",
    name: "Yosemite",
    location: "California",
    ticketTypes: [
      {
        id: "T03",
        name: "Vehicle Pass",
        basePrice: 35,
        parkId: "P02",
        parkName: "Yosemite",
      },
      {
        id: "T04",
        name: "Annual Pass",
        basePrice: 70,
        parkId: "P02",
        parkName: "Yosemite",
      },
    ],
  },
];

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);

export const calculateCartTotal = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.ticket.basePrice * item.quantity, 0);

export const calculateTicketCount = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.quantity, 0);

export const buildOrder = (
  cartItems: CartItem[],
  method: PaymentMethod
): Order => {
  const id = `ORD-${Date.now()}`;
  const items: OrderItem[] = cartItems.map((item) => ({
    ticketTypeName: item.ticket.name,
    parkName: item.ticket.parkName,
    quantity: item.quantity,
    priceAtPurchase: item.ticket.basePrice,
  }));

  return {
    id,
    date: new Date().toISOString(),
    items,
    totalAmount: calculateCartTotal(cartItems),
    paymentMethod: method,
  };
};

export const createVisitor = (
  name: string,
  email: string,
  password: string
): Visitor => ({
  id: `VIS-${Date.now()}`,
  name,
  email,
  password,
  orderHistory: [],
});
