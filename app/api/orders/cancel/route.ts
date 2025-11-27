import { NextResponse } from "next/server";
import { orderService } from "@/lib/services/orderService";

export async function POST(request: Request) {
  const body = await request.json();
  const { visitorId, orderId } = body ?? {};
  const result = await orderService.cancel(visitorId ?? "", orderId ?? "");
  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
