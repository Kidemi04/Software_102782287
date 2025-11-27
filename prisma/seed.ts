import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const parks = [
  {
    id: "P01",
    name: "Yellowstone",
    location: "Wyoming",
    ticketTypes: [
      { id: "T01", name: "Adult Day Pass", price: 20 },
      { id: "T02", name: "Child Day Pass", price: 10 },
    ],
  },
  {
    id: "P02",
    name: "Yosemite",
    location: "California",
    ticketTypes: [
      { id: "T03", name: "Vehicle Pass", price: 35 },
      { id: "T04", name: "Annual Pass", price: 70 },
    ],
  },
];

async function main() {
  // Reset parks/tickets to match the seed data (orders/visitors are left intact).
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.ticketType.deleteMany({});
  await prisma.park.deleteMany({});

  for (const park of parks) {
    await prisma.park.create({
      data: {
        id: park.id,
        name: park.name,
        location: park.location,
        ticketTypes: {
          create: park.ticketTypes.map((t) => ({
            id: t.id,
            name: t.name,
            price: t.price,
          })),
        },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
