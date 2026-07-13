import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    const { leadIds, executiveId } = await req.json();

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

    await prisma.lead.updateMany({
      where: {
        id: {
          in: leadIds,
        },
      },
      data: {
        assignedToId: executiveId,
      },
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