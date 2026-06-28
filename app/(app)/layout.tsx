import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import { getSession } from "@/lib/adminSession";

/// Auth gate + responsive sidebar shell for all dashboard pages. Role-based
/// path gating is handled in middleware; here we pass the role to the Shell so
/// the nav only shows what this admin can reach.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  return (
    <Shell role={session.role} name={session.name}>
      {children}
    </Shell>
  );
}
