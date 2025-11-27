import { NextResponse } from "next/server";
import { orderService } from "@/lib/services/orderService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const visitorId = searchParams.get("visitorId");
  if (!visitorId) {
    return NextResponse.json({ success: false, message: "visitorId is required" }, { status: 400 });
  }

  const orders = await orderService.history(visitorId);
  return NextResponse.json({ success: true, orders });
}
