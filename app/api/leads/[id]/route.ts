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

    await prisma.lead.delete({
      where: { id },
    });

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