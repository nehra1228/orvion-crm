import type { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "EXECUTIVE";

    const users = await prisma.user.findMany({
      where: {
        role: role as Role,
        active: true,
      },

      orderBy: {
        username: "asc",
      },

      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        companyId: true,
        departmentId: true,
        teamId: true,
        company: {
          select: {
            id: true,
            name: true,
            businessType: true,
          },
        },
      },
    });

    return NextResponse.json(users);

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch executives" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.create({
      data: {
        username: body.username,
        email: body.email,
        password: hashedPassword,
        role: body.role,
        active: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}