import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "SUPER_ADMIN", "COMPANY_ADMIN", "HR", "SUPER_HR"].includes(current.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await params;
  const body = await request.json();

  const { username, email, active } = body;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      username,
      email: email || null,
      active,
    },
  });

  return NextResponse.json(updatedUser);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "SUPER_ADMIN", "COMPANY_ADMIN", "HR", "SUPER_HR"].includes(current.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json(
      { message: "User not found." },
      { status: 404 }
    );
  }

  // Log current admin and target user for debugging.
  try {
    console.info("admin delete attempt:", {
      by: { id: current.id, role: current.role, companyId: current.companyId },
      target: { id: userId, role: user?.role, companyId: user?.companyId },
    });

    // Allow admins to delete any user. Remove dependent rows that use RESTRICT, nullify optional owners, then delete user.
    const result = await prisma.$transaction([
      prisma.activity.deleteMany({ where: { userId } }),
      prisma.call.deleteMany({ where: { executiveId: userId } }),
      prisma.upload.deleteMany({ where: { uploadedById: userId } }),
      prisma.executiveState.deleteMany({ where: { userId } }),
      // Do not delete leads that are INTERESTED or FOLLOW_UP; only remove other assigned leads
      prisma.lead.deleteMany({ where: { assignedToId: userId, status: { notIn: ["INTERESTED", "FOLLOW_UP"] } } }),
      prisma.campaign.updateMany({ where: { ownerId: userId }, data: { ownerId: null } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    const deletedLeads = result[4]?.count ?? null;
    return NextResponse.json({ success: true, deletedLeads });
  } catch (err: unknown) {
    console.error("admin delete user error:", err);
    const message = err && typeof err === "object" && "message" in err ? (err as Error & { message?: string }).message : "Failed to delete user.";
    return NextResponse.json({ message }, { status: 500 });
  }
}