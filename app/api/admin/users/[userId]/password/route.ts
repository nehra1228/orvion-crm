import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { requireUser } from "@/lib/auth/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  await requireUser("ADMIN");

  const { userId } = await params;

  const body = await request.json();

  if (!body.password) {
    return NextResponse.json(
      {
        message: "Password required.",
      },
      {
        status: 400,
      }
    );
  }

  const hashed = await hashPassword(body.password);

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: hashed,
    },
  });

  return NextResponse.json({
    success: true,
  });
}