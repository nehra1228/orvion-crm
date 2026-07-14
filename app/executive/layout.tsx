import { requireUser } from "@/lib/auth/session";
import ExecutiveLayout from "@/components/layout/ExecutiveLayout";

export default async function ExecutiveRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser("EXECUTIVE");
  return <ExecutiveLayout>{children}</ExecutiveLayout>;
}
