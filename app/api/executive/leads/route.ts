import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { LeadRemark, LeadStatus } from "@prisma/client";

function normalizeRemark(value: unknown): LeadRemark | null {
  const candidate = String(value ?? "").trim().toUpperCase();

  if (!candidate) {
    return null;
  }

  if (candidate === "FOLLOW_UP" || candidate === "FOLLOW UP" || candidate === "FOLLOWUP") {
    return LeadRemark.CALLBACK;
  }

  return Object.values(LeadRemark).includes(candidate as LeadRemark)
    ? (candidate as LeadRemark)
    : null;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || (user.role !== "EXECUTIVE" && user.role !== "TEAM_LEADER")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const leadId = String(body?.leadId || "");
  const remark = normalizeRemark(body?.remark);

  if (!leadId || !remark) {
    return NextResponse.json({ message: "Lead ID and remark are required." }, { status: 400 });
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
    remark,
  };

  if (remark === LeadRemark.INTERESTED) {
    updateData.status = LeadStatus.INTERESTED;
  }

  if (remark === LeadRemark.NOT_INTERESTED) {
    updateData.status = LeadStatus.LOST;
  }
  // Treat callback-style follow-ups as scheduling a follow up
  if (remark === LeadRemark.CALLBACK) {
    updateData.status = LeadStatus.FOLLOW_UP;
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
      remark,
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

    const updateData: {
      remark?: LeadRemark | null;
      status?: LeadStatus;
      notes?: string | null;
      followUpDate?: Date | null;
    } = {};

    const remarkValue = body.remark ?? (body.field === "remark" ? body.value : undefined);
    const normalizedRemark = normalizeRemark(remarkValue);

    if (remarkValue !== undefined) {
      updateData.remark = normalizedRemark ?? null;
      if (normalizedRemark === LeadRemark.INTERESTED) {
        updateData.status = LeadStatus.INTERESTED;
      } else if (normalizedRemark === LeadRemark.NOT_INTERESTED) {
        updateData.status = LeadStatus.LOST;
      }
      if (normalizedRemark === LeadRemark.CALLBACK) {
        updateData.status = LeadStatus.FOLLOW_UP;
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
      if (updateData.followUpDate) {
        updateData.status = LeadStatus.FOLLOW_UP;
      }
    } else if (normalizedRemark === LeadRemark.CALLBACK) {
      updateData.followUpDate = new Date();
      updateData.status = LeadStatus.FOLLOW_UP;
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

    // Prevent deletion of protected leads
    if (lead.status === "INTERESTED" || lead.status === "FOLLOW_UP") {
      return NextResponse.json({ message: "Lead is protected and cannot be deleted." }, { status: 403 });
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