import { NextResponse } from "next/server";
import { parkRepository } from "@/lib/repositories/parkRepository";

export async function GET() {
  const parks = await parkRepository.getAllParksWithTicketTypes();
  const payload = parks.map((park) => ({
    id: park.id,
    name: park.name,
    location: park.location,
    ticketTypes: park.ticketTypes.map((t) => ({
      id: t.id,
      name: t.name,
      price: t.price,
      parkId: park.id,
      parkName: park.name,
    })),
  }));
  return NextResponse.json(payload);
}
