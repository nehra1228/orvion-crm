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

    const body = await req.json().catch(() => ({} as any));
    const leadIds = Array.isArray(body?.leadIds) ? body.leadIds.filter((id: unknown) => typeof id === "string") : [];
    const all = Boolean(body?.all);

    if (!leadIds.length && !all) {
      return NextResponse.json({ error: "No leads selected" }, { status: 400 });
    }

    // Build where clause — if `all` is true, scope deletion by user role.
    let where: any = {};
    if (all) {
      if (user.role === "EXECUTIVE") {
        where.assignedToId = user.id;
      } else if (user.role === "TEAM_LEADER") {
        where.teamId = user.teamId;
      } else {
        // ADMIN-like roles may delete all leads
        where = {};
      }
    } else {
      where = { id: { in: leadIds } };
    }

    const result = await prisma.lead.deleteMany({ where });

    return NextResponse.json({ success: true, deleted: result.count });
  } catch (error) {
    const e = error as any;
    console.error("Bulk delete leads error:", e?.stack || e?.message || e);
    return NextResponse.json({ error: "Failed to delete selected leads", detail: e?.message || String(e) }, { status: 500 });
  }
}
