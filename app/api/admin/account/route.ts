import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({ id: user.id, username: user.username, role: user.role });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { username, password } = body;

  if (!username && !password) {
    return NextResponse.json({ message: "Username or password required to update." }, { status: 400 });
  }

  const data: any = {};
  if (username) data.username = username;
  if (password) data.password = await hashPassword(password);

  try {
    const updated = await prisma.user.update({ where: { id: user.id }, data });
    return NextResponse.json({ message: "Account updated", user: { id: updated.id, username: updated.username } });
  } catch (err: any) {
    const msg = err?.message || "Could not update account.";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
