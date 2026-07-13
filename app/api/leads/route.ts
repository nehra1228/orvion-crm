import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET ALL LEADS
export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      include: {
        assignedTo: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error("GET Leads Error:", error);

    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

// CREATE NEW LEAD
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const lead = await prisma.lead.create({
      data: {
        name: body.name,
        mobile: body.mobile,
        project: body.project || null,
        city: body.city || null,
        source: body.source || null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json(lead, {
      status: 201,
    });
  } catch (error) {
    console.error("POST Lead Error:", error);

    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 }
    );
  }
}