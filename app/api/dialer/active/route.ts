import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const calls = await prisma.call.findMany({
    where: { endedAt: null },
    include: { lead: true, executive: true, campaign: true },
    orderBy: { startedAt: "desc" },
  });
  return NextResponse.json({ calls });
}
