import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createToken } from "@/lib/auth/jwt";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, username, password } = body;

    if ((!email && !username) || !password) {
      return NextResponse.json({ success: false, message: "Email or username and password are required." }, { status: 400 });
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
      return NextResponse.json({ success: false, message: "Invalid credentials." }, { status: 401 });
    }

    const validPassword = await verifyPassword(password, user.password);

    if (!validPassword) {
      return NextResponse.json({ success: false, message: "Invalid credentials." }, { status: 401 });
    }

    const token = createToken({ sub: user.id, username: user.username, role: user.role });
    const maxAge = 60 * 60 * 24 * 7;

    const response = NextResponse.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });

    response.cookies.set({
      name: "orvion_token",
      value: token,
      httpOnly: true,
      path: "/",
      maxAge,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    console.error("LOGIN (app) ERROR:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// Temporary: support GET for quick availability checks in browser
export async function GET() {
  try {
    return NextResponse.json({ ok: true, method: "GET", message: "Login route is reachable" });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

// Temporary: respond to preflight OPTIONS requests (CORS preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
