import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["ADMIN", "SUPER_ADMIN", "COMPANY_ADMIN", "HR"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const leadIds = Array.isArray(body?.leadIds) ? body.leadIds.filter((id: unknown) => typeof id === "string") : [];
    if (!leadIds.length) {
      return NextResponse.json({ error: "No leads selected" }, { status: 400 });
    }

    const result = await prisma.lead.deleteMany({ where: { id: { in: leadIds } } });

    return NextResponse.json({ success: true, deleted: result.count });
  } catch (error) {
    const e = error as any;
    console.error("Bulk delete leads error:", e?.stack || e?.message || e);
    return NextResponse.json({ error: "Failed to delete selected leads", detail: e?.message || String(e) }, { status: 500 });
  }
}
