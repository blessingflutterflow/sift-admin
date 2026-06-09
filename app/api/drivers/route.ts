import { cookies } from "next/headers";
import { listDriverLocations } from "@/lib/drivers";

export const dynamic = "force-dynamic";

export async function GET() {
  // Behind the same admin cookie gate as the pages.
  const authed = (await cookies()).get("sift_admin_auth")?.value === "1";
  if (!authed) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const drivers = await listDriverLocations();
  return Response.json({ drivers });
}
