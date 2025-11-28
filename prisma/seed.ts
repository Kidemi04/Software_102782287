import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const parks = [
  { parkId: BigInt(1), name: "Yellowstone", dailyCapacity: 5000 },
  { parkId: BigInt(2), name: "Yosemite", dailyCapacity: 4500 },
  { parkId: BigInt(3), name: "Zion", dailyCapacity: 3000 },
];

const products = [
  { productId: BigInt(1), productName: "Yellowstone Day Ticket", unitPrice: new Prisma.Decimal(25), type: "TICKET" },
  { productId: BigInt(2), productName: "Yosemite Day Ticket", unitPrice: new Prisma.Decimal(30), type: "TICKET" },
  { productId: BigInt(3), productName: "Zion Day Ticket", unitPrice: new Prisma.Decimal(20), type: "TICKET" },
  { productId: BigInt(4), productName: "Park Hoodie", unitPrice: new Prisma.Decimal(55), type: "MERCH" },
  { productId: BigInt(5), productName: "Sticker Pack", unitPrice: new Prisma.Decimal(8), type: "MERCH" },
];

async function main() {
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.park.deleteMany({});
  await prisma.user.deleteMany({});

  await prisma.park.createMany({ data: parks });
  await prisma.product.createMany({ data: products });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
