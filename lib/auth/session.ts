import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const cookiesStore = await cookies();
  const token = cookiesStore.get("orvion_token")?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = verifyToken(token) as {
      sub: string;
      username: string;
      role: string;
    };

    if (!payload?.sub) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.active) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      active: user.active,
    };
  } catch {
    return null;
  }
}

export async function requireUser(role: "SUPER_ADMIN" | "EXECUTIVE") {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === role) {
    return user;
  }

  // Redirect executives away from admin routes to their dashboard
  if (role === "ADMIN" && user.role === "EXECUTIVE") {
    redirect("/executive/dashboard");
  }

  // Redirect admins away from executive routes to admin dashboard
  if (role === "EXECUTIVE" && user.role === "ADMIN") {
    redirect("/admin/dashboard");
  }

  // Fallback
  redirect("/login");
}
