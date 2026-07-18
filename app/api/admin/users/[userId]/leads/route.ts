import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "SUPER_ADMIN", "COMPANY_ADMIN", "HR"].includes(current.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await context.params;
  if (!userId) {
    return NextResponse.json({ message: "Missing user ID." }, { status: 400 });
  }

  try {
    const result = await prisma.lead.deleteMany({ where: { assignedToId: userId } });
    return NextResponse.json({ deleted: result.count });
  } catch (err: any) {
    console.error("/api/admin/users/[userId]/leads DELETE error:", err);
    return NextResponse.json({ message: err?.message || "Failed to delete leads." }, { status: 500 });
  }
}
