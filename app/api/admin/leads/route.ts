import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";

export async function DELETE() {
  await requireUser("ADMIN");

  const result = await prisma.lead.deleteMany({});
  return NextResponse.json({ deleted: result.count });
}
