import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { username: "asc" }],
  });

  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { username, email, password, role } = body;

  if (!username || !password || !role) {
    return NextResponse.json({ message: "Username, password and role are required." }, { status: 400 });
  }

  const hashedPassword = await hashPassword(password);

  const data: any = {
    username,
    password: hashedPassword,
    role,
    active: true,
  };

  if (email) data.email = email;

  try {
    const user = await prisma.user.create({ data });
    return NextResponse.json(user);
  } catch (err: any) {
    console.error("Error creating user:", err);
    // Prisma unique constraint error
    if (err?.code === "P2002") {
      const target = err?.meta?.target ?? "field";
      return NextResponse.json({ message: `A record with that ${target} already exists.` }, { status: 409 });
    }
    // If Prisma complains about an unknown 'email' argument (older client/schema mismatch), retry without email as a fallback
    const message = err?.message || "";
    if (message.includes("Unknown argument `email`") || message.includes("Unknown arg `email`")) {
      try {
        const fallbackData = { username, password: hashedPassword, role, active: true } as any;
        const user = await prisma.user.create({ data: fallbackData });
        return NextResponse.json({ message: "User created (email not saved due to schema mismatch).", user });
      } catch (err2: any) {
        console.error("Fallback create without email also failed:", err2);
      }
    }

    // Expose error message in non-production for easier debugging
    const devMsg = process.env.NODE_ENV === "production" ? "Could not create user." : (err?.message || "Could not create user.");
    return NextResponse.json({ message: devMsg, details: process.env.NODE_ENV === "production" ? undefined : err }, { status: 500 });
  }
}
