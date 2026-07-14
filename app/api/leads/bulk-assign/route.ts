import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    const { leadIds, executiveId, teamId } = await req.json();

    if (
      !leadIds ||
      !Array.isArray(leadIds) ||
      leadIds.length === 0
    ) {
      return NextResponse.json(
        { error: "No leads selected." },
        { status: 400 }
      );
    }

    if (!executiveId) {
      return NextResponse.json(
        { error: "Executive is required." },
        { status: 400 }
      );
    }

    const selectedLeads = await prisma.lead.findMany({
      where: { id: { in: leadIds } },
      include: {
        company: true,
      },
    });

    const businessTypes = Array.from(
      new Set(
        selectedLeads
          .map((lead) => lead.company?.businessType)
          .filter((value): value is NonNullable<typeof value> => value != null)
      )
    );

    if (businessTypes.length > 1) {
      return NextResponse.json(
        { error: "Cannot assign leads with mixed business types." },
        { status: 400 }
      );
    }

    const leadBusinessType = businessTypes[0] || null;

    const executive = await prisma.user.findUnique({
      where: { id: executiveId },
      include: {
        company: true,
      },
    });

    if (!executive) {
      return NextResponse.json(
        { error: "Executive not found." },
        { status: 404 }
      );
    }

    if (
      leadBusinessType &&
      executive.company?.businessType !== leadBusinessType
    ) {
      return NextResponse.json(
        { error: "Executive business type does not match selected leads." },
        { status: 400 }
      );
    }

    if (teamId) {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          company: true,
        },
      });

      if (!team) {
        return NextResponse.json(
          { error: "Team leader not found." },
          { status: 404 }
        );
      }

      if (
        leadBusinessType &&
        team.company?.businessType !== leadBusinessType
      ) {
        return NextResponse.json(
          { error: "Team leader business type does not match selected leads." },
          { status: 400 }
        );
      }
    }

    const updateData: any = {
      assignedToId: executiveId,
    };

    if (teamId) {
      updateData.teamId = teamId;
    }

    await prisma.lead.updateMany({
      where: {
        id: {
          in: leadIds,
        },
      },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `${leadIds.length} leads assigned.`,
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        error: "Assignment failed.",
      },
      {
        status: 500,
      }
    );
  }
}