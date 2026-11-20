import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { deleteLeads } from "@/lib/leads";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  await requireUser("ADMIN");

  const { userId } = await context.params;
  if (!userId) {
    return NextResponse.json({ message: "Missing user ID." }, { status: 400 });
  }

  const deleted = await deleteLeads({ assignedToId: userId });
  return NextResponse.json({ deleted });
}
