import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createToken } from "@/lib/auth/jwt";

export async function POST(req: Request) {
  const body = await req.json();
  const { email, username, password } = body;

  if ((!email && !username) || !password) {
    return NextResponse.json(
      { success: false, message: "Email or username and password are required." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        email ? { email } : undefined,
        username ? { username } : undefined,
      ].filter(Boolean) as any[],
    },
  });

  if (!user || !user.active) {
    return NextResponse.json(
      { success: false, message: "Invalid credentials." },
      { status: 401 }
    );
  }

  console.log("[auth/login] user found:", { id: user.id, username: user.username, role: user.role });

  const validPassword = await verifyPassword(password, user.password);

  if (!validPassword) {
    return NextResponse.json(
      { success: false, message: "Invalid credentials." },
      { status: 401 }
    );
  }

  const token = createToken({
    sub: user.id,
    username: user.username,
    role: user.role,
  });

  const response = NextResponse.json({
    success: true,
    message: "Logged in successfully.",
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  });

  console.log("[auth/login] response payload:", { id: user.id, username: user.username, role: user.role });

  response.cookies.set({
    name: "orvion_token",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
