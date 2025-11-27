import { NextResponse } from "next/server";
import { orderService } from "@/lib/services/orderService";

export async function POST(request: Request) {
  const body = await request.json();
  const { visitorId, cartItems, paymentMethod, paymentDetails, visitDate } = body ?? {};

  const result = await orderService.checkout({
    visitorId: visitorId ?? "",
    cartItems: Array.isArray(cartItems) ? cartItems : [],
    paymentMethod,
    visitDate,
    paymentDetails,
  });

  if (!result.success) {
    return NextResponse.json({ success: false, message: result.message }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: result.message,
    order: result.order,
  });
}
