import { requireUser } from "@/lib/auth/session";

export default async function ExecutiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser("EXECUTIVE");
  return <>{children}</>;
}
