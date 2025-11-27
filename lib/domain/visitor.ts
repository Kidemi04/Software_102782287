import type { OrderDTO } from "./domainTypes";

export type Visitor = {
  id: string;
  name: string;
  email: string;
  password: string;
  orderHistory?: OrderDTO[];
};
