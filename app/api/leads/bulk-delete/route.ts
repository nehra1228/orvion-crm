import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "SUPER_ADMIN", "COMPANY_ADMIN", "HR", "SUPER_HR"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const leadIds = Array.isArray(body?.leadIds)
      ? body.leadIds.filter((id: unknown): id is string => typeof id === "string")
      : [];
    const remark = typeof body?.remark === "string" ? body.remark.trim().toUpperCase() : "";
    const all = body?.all === true;
    const executiveId = typeof body?.executiveId === "string" && body.executiveId.trim() ? body.executiveId.trim() : "";

    if (!leadIds.length && !all && !remark && !executiveId) {
      return NextResponse.json({ error: "No leads selected" }, { status: 400 });
    }

    const where: Record<string, unknown> = {};

    if (executiveId) {
      where.assignedToId = executiveId;
    } else if (all) {
      where.id = { not: undefined };
    } else if (remark) {
      where.remark = remark;
    } else {
      where.id = { in: leadIds };
    }

    // Protect interested and follow-up leads from bulk deletion
    where.status = { notIn: ["INTERESTED", "FOLLOW_UP"] };

    const matchingLeads = await prisma.lead.findMany({
      where,
      select: { id: true },
    });

    if (!matchingLeads.length) {
      return NextResponse.json({ success: true, deleted: 0 });
    }

    const ids = matchingLeads.map((lead) => lead.id);

    await prisma.$transaction(async (tx) => {
      await tx.activity.deleteMany({ where: { leadId: { in: ids } } });
      await tx.call.deleteMany({ where: { leadId: { in: ids } } });
      await tx.lead.deleteMany({ where: { id: { in: ids } } });
    });

    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (error) {
    const e = error as Error & { message?: string; stack?: string };
    console.error("Bulk delete leads error:", e?.stack || e?.message || error);
    return NextResponse.json({ error: "Failed to delete selected leads", detail: e?.message || String(error) }, { status: 500 });
  }
}
