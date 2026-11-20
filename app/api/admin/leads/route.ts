import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { deleteLeads } from "@/lib/leads";

export async function DELETE() {
  await requireUser("ADMIN");

  const deleted = await deleteLeads({});
  return NextResponse.json({ deleted });
}
