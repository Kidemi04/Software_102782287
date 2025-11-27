import type { TicketType } from "./ticketType";

export type Park = {
  id: string;
  name: string;
  location: string;
  ticketTypes: TicketType[];
};
