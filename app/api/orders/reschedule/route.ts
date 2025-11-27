import { NextResponse } from "next/server";
import { orderService } from "@/lib/services/orderService";

export async function POST(request: Request) {
  const body = await request.json();
  const { visitorId, orderId, visitDate } = body ?? {};
  const result = await orderService.reschedule(visitorId ?? "", orderId ?? "", visitDate ?? "");
  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
