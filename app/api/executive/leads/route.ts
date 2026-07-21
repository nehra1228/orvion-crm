import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { LeadRemark, LeadStatus } from "@prisma/client";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || (user.role !== "EXECUTIVE" && user.role !== "TEAM_LEADER")) {
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

  const isAuthorizedForLead = user.role === "TEAM_LEADER"
    ? lead?.teamId === user.teamId
    : lead?.assignedToId === user.id;

  if (!lead || !isAuthorizedForLead) {
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
export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!user || (user.role !== "EXECUTIVE" && user.role !== "TEAM_LEADER")) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const leadId = body.leadId;

    const lead = await prisma.lead.findUnique({
      where: {
        id: leadId,
      },
    });

    const isAuthorizedForLead = lead
      ? user.role === "TEAM_LEADER"
        ? lead.teamId === user.teamId
        : lead.assignedToId === user.id
      : false;

    if (!lead || !isAuthorizedForLead) {
      return NextResponse.json(
        { message: "Lead not found." },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (body.remark !== undefined) {
      updateData.remark = body.remark || null;
      if (body.remark === "INTERESTED") {
        updateData.status = LeadStatus.INTERESTED;
      } else if (body.remark === "NOT_INTERESTED") {
        updateData.status = LeadStatus.LOST;
      }
    }

    if (body.status && updateData.status === undefined) {
      updateData.status = body.status;
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes || null;
    }

    if (body.followUpDate !== undefined) {
      updateData.followUpDate = body.followUpDate
        ? new Date(body.followUpDate)
        : null;
    }

    const updatedLead = await prisma.lead.update({
      where: {
        id: leadId,
      },
      data: updateData,
    });

    await prisma.activity.create({
      data: {
        leadId,
        userId: user.id,
        oldStatus: lead.status,
        newStatus: updatedLead.status,
        remark: updatedLead.remark,
        note: "Lead updated from Calling Module",
      },
    });

    return NextResponse.json({
      success: true,
      lead: updatedLead,
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Update failed",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();

  if (!user || (user.role !== "EXECUTIVE" && user.role !== "TEAM_LEADER")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const params = new URL(request.url).searchParams;
    const leadId = String(body?.leadId || params.get("leadId") || "");

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

    await prisma.$transaction([
      prisma.activity.deleteMany({ where: { leadId } }),
      prisma.call.deleteMany({ where: { leadId } }),
      prisma.lead.delete({ where: { id: leadId } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Delete failed." }, { status: 500 });
  }
}