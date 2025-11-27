import { NextResponse } from "next/server";
import { authService } from "@/lib/services/authService";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, password } = body ?? {};
  const result = await authService.register(name ?? "", email ?? "", password ?? "");
  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json({
    success: true,
    message: result.message,
    visitor: {
      id: result.visitor?.id,
      name: result.visitor?.name,
      email: result.visitor?.email,
    },
  });
}
