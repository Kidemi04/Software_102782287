import { NextResponse } from "next/server";
import { adminService } from "@/lib/services/adminService";

export async function GET(request: Request) {
  const username = request.headers.get("x-admin-user") ?? "";
  const password = request.headers.get("x-admin-pass") ?? "";
  const login = adminService.login(username, password);
  if (!login.success) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const report = await adminService.getReport();
  return NextResponse.json({ success: true, report });
}
