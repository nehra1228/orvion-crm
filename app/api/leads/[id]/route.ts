import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(
  req: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const lead = await prisma.lead.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    // protect interested and follow-up leads from deletion
    if (lead.status === "INTERESTED" || lead.status === "FOLLOW_UP") {
      return NextResponse.json({ error: "Lead is protected and cannot be deleted." }, { status: 403 });
    }

    await prisma.$transaction([
      prisma.activity.deleteMany({ where: { leadId: id } }),
      prisma.call.deleteMany({ where: { leadId: id } }),
      prisma.lead.delete({ where: { id } }),
    ]);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to delete lead" },
      { status: 500 }
    );
  }
}