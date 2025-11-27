import type { Park } from "./park";

export const seedParks: Park[] = [
  {
    id: "P01",
    name: "Yellowstone",
    location: "Wyoming",
    ticketTypes: [
      { id: "T01", name: "Adult Day Pass", price: 20, parkId: "P01", parkName: "Yellowstone" },
      { id: "T02", name: "Child Day Pass", price: 10, parkId: "P01", parkName: "Yellowstone" },
    ],
  },
  {
    id: "P02",
    name: "Yosemite",
    location: "California",
    ticketTypes: [
      { id: "T03", name: "Vehicle Pass", price: 35, parkId: "P02", parkName: "Yosemite" },
      { id: "T04", name: "Annual Pass", price: 70, parkId: "P02", parkName: "Yosemite" },
    ],
  },
];
