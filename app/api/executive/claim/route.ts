import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { LeadStatus } from "@prisma/client";

export async function POST() {
  const user = await getCurrentUser();

  if (!user || (user.role !== "EXECUTIVE" && user.role !== "TEAM_LEADER")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Attempt to claim the next NEW lead assigned to this executive (or team)
  for (let attempt = 0; attempt < 6; attempt++) {
    // Prefer leads explicitly assigned to the user first
    const where: any = {
      status: "NEW",
    };

    if (user.role === "EXECUTIVE") {
      where.assignedToId = user.id;
    } else if (user.role === "TEAM_LEADER") {
      // Team leaders can claim team leads (if assigned to their team and not to an exec)
      where.teamId = user.teamId;
      where.assignedToId = null;
    }

    const candidate = await prisma.lead.findFirst({
      where,
      orderBy: { createdAt: "asc" },
    });

    if (!candidate) {
      return NextResponse.json({ message: "No leads available" }, { status: 204 });
    }

    // Try to atomically update the status from NEW -> CALLED
    const result = await prisma.lead.updateMany({
      where: { id: candidate.id, status: "NEW" },
      data: { status: LeadStatus.CALLED },
    });

    if (result.count === 1) {
      // Claim succeeded — record activity and return the lead
      const updated = await prisma.lead.findUnique({
        where: { id: candidate.id },
        include: { assignedTo: true, activities: { orderBy: { createdAt: "desc" }, take: 5 } },
      });

      try {
        await prisma.activity.create({
          data: {
            leadId: candidate.id,
            userId: user.id,
            oldStatus: candidate.status as LeadStatus,
            newStatus: LeadStatus.CALLED,
            remark: null,
            note: `Claimed by ${user.username}`,
          },
        });
      } catch (e) {
        console.error("Failed to create claim activity", e);
      }

      return NextResponse.json({ lead: updated });
    }

    // Otherwise another process likely claimed it; try again
  }

  return NextResponse.json({ message: "Could not claim a lead right now" }, { status: 409 });
}
