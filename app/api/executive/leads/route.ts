import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { LeadRemark, LeadStatus } from "@prisma/client";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || user.role !== "EXECUTIVE") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const leadId = String(body?.leadId || "");
  const remark = String(body?.remark || "").toUpperCase();

  if (!leadId || !remark) {
    return NextResponse.json({ message: "Lead ID and remark are required." }, { status: 400 });
  }

  const allowedRemarks = Object.values(LeadRemark);

  if (!allowedRemarks.includes(remark as LeadRemark)) {
    return NextResponse.json({ message: "Invalid remark." }, { status: 400 });
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });

  if (!lead || lead.assignedToId !== user.id) {
    return NextResponse.json({ message: "Lead not found or unauthorized." }, { status: 404 });
  }

  const oldStatus = lead.status;
  const updateData: { remark: LeadRemark; status?: LeadStatus } = {
    remark: remark as LeadRemark,
  };

  if (remark === "INTERESTED") {
    updateData.status = LeadStatus.INTERESTED;
  }

  if (remark === "NOT_INTERESTED") {
    updateData.status = LeadStatus.LOST;
  }

  const updatedLead = await prisma.lead.update({
    where: { id: leadId },
    data: updateData,
  });

  await prisma.activity.create({
    data: {
      leadId,
      userId: user.id,
      oldStatus,
      newStatus: updateData.status ?? oldStatus,
      remark: remark as LeadRemark,
      note: `Executive ${user.username} updated remark to ${remark}`,
    },
  });

  return NextResponse.json({ lead: updatedLead });
}
