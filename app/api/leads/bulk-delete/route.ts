import { NextResponse } from "next/server";
import { LeadRemark, LeadStatus, Prisma } from "@prisma/client";
import { deleteLeads } from "@/lib/delete-leads";
import { getCurrentUser } from "@/lib/auth/session";

export const maxDuration = 60;

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

    let targetWhere: Prisma.LeadWhereInput;

    if (executiveId) {
      targetWhere = { assignedToId: executiveId };
    } else if (all) {
      targetWhere = {};
    } else if (remark) {
      if (!Object.values(LeadRemark).includes(remark as LeadRemark)) {
        return NextResponse.json({ error: "Invalid lead remark" }, { status: 400 });
      }
      targetWhere = { remark: remark as LeadRemark };
    } else {
      targetWhere = { id: { in: leadIds } };
    }

    const where: Prisma.LeadWhereInput = {
      ...targetWhere,
      status: { notIn: [LeadStatus.INTERESTED, LeadStatus.FOLLOW_UP] },
    };

    const deleted = await deleteLeads(where);

    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    const e = error as Error & { message?: string; stack?: string };
    console.error("Bulk delete leads error:", e?.stack || e?.message || error);
    return NextResponse.json({ error: "Failed to delete selected leads", detail: e?.message || String(error) }, { status: 500 });
  }
}
