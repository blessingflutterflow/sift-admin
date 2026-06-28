import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  verifySession,
  type AdminSession,
} from "@/lib/adminAuth";

/** Server-component / server-action helper: the current admin session. */
export async function getSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySession(token);
}
