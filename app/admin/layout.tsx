import { requireUser } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser("ADMIN");
  return <>{children}</>;
}
