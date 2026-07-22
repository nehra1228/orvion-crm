import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || (user.role !== "EXECUTIVE" && user.role !== "TEAM_LEADER")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const leadId = String(body?.leadId || "");

  if (!leadId) {
    return NextResponse.json({ message: "Lead ID is required." }, { status: 400 });
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });

  const isAuthorizedForLead = lead
    ? user.role === "TEAM_LEADER"
      ? lead.teamId === user.teamId
      : lead.assignedToId === user.id
    : false;

  if (!lead || !isAuthorizedForLead) {
    return NextResponse.json({ message: "Lead not found or unauthorized." }, { status: 404 });
  }

  const call = await prisma.call.create({
    data: {
      leadId,
      executiveId: user.id,
      campaignId: lead.campaignId ?? undefined,
      startedAt: new Date(),
      metadata: { source: "manual-call-button" },
    },
  });

  return NextResponse.json({ success: true, call });
}
