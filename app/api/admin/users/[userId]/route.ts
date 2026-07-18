import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "SUPER_ADMIN", "COMPANY_ADMIN", "HR"].includes(current.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
  if (!["ADMIN", "SUPER_ADMIN", "COMPANY_ADMIN", "HR"].includes(current.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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

  if (user.role === "SUPER_ADMIN" || user.role === "COMPANY_ADMIN") {
    return NextResponse.json(
      { message: "Admins cannot be deleted." },
      { status: 400 }
    );
  }

  const leadCount = await prisma.lead.count({
    where: { assignedToId: userId },
  });

  if (leadCount > 0) {
    return NextResponse.json(
      {
        message:
          "Please delete this executive's leads first.",
      },
      { status: 400 }
    );
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  return NextResponse.json({ success: true });
}