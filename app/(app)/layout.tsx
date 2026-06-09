import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Shell from "@/components/Shell";

/// Auth gate + responsive sidebar shell for all dashboard pages.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = (await cookies()).get("sift_admin_auth")?.value === "1";
  if (!authed) redirect("/login");
  return <Shell>{children}</Shell>;
}
