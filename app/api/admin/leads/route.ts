import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const { id } = await params;

    const lead = await prisma.lead.update({
      where: {
        id,
      },
      data: {
        name: body.name,
        mobile: body.mobile,
        project: body.project,
        city: body.city,
        source: body.source,
        notes: body.notes,
        status: body.status,
      },
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