import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const current = await getCurrentUser();
    if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["ADMIN", "SUPER_ADMIN", "COMPANY_ADMIN", "HR", "SUPER_HR"].includes(current.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json().catch(() => ({} as any));
    const action = body?.action as string | undefined;
    const userIds = Array.isArray(body?.userIds) ? body.userIds as string[] : [];

    if (!action || !userIds.length) {
      return NextResponse.json({ error: "action and userIds required" }, { status: 400 });
    }

    if (action === "deactivate") {
      const result = await prisma.user.updateMany({
        where: { id: { in: userIds }, role: { notIn: ["SUPER_ADMIN", "COMPANY_ADMIN", "SUPER_HR"] } },
        data: { active: false },
      });
      return NextResponse.json({ success: true, count: result.count });
    }

    if (action === "delete") {
      const succeeded: string[] = [];
      const failed: Array<{ id: string; reason: string }> = [];

      for (const id of userIds) {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
          failed.push({ id, reason: "Not found" });
          continue;
        }
        if (["SUPER_ADMIN", "COMPANY_ADMIN", "SUPER_HR"].includes(user.role)) {
          failed.push({ id, reason: "Cannot delete admin user" });
          continue;
        }
        const leadCount = await prisma.lead.count({ where: { assignedToId: id } });
        if (leadCount > 0) {
          failed.push({ id, reason: "Has assigned leads" });
          continue;
        }
        await prisma.user.delete({ where: { id } });
        succeeded.push(id);
      }

      return NextResponse.json({ success: true, deleted: succeeded, failed });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (err: any) {
    console.error("/api/admin/users/bulk error:", err?.stack || err?.message || err);
    return NextResponse.json({ error: "Server error", detail: err?.message || String(err) }, { status: 500 });
  }
}
