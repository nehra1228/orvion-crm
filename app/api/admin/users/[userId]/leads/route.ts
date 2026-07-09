import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  await requireUser("ADMIN");

  const { userId } = await context.params;
  if (!userId) {
    return NextResponse.json({ message: "Missing user ID." }, { status: 400 });
  }

  const result = await prisma.lead.deleteMany({ where: { assignedToId: userId } });
  return NextResponse.json({ deleted: result.count });
}
