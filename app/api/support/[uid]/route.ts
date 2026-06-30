import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { SESSION_COOKIE, verifySession, canAccess } from "@/lib/adminAuth";
import { getThread } from "@/lib/support";
import { getAdminDb } from "@/lib/firebaseAdmin";

/** Cookie-gated (the /api path is excluded from the proxy, so verify here). */
async function guard() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session || !canAccess(session.role, "/support")) return null;
  return session;
}

/** Live messages for a thread; also clears the admin-unread flag. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  if (!(await guard()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { uid } = await params;
  const { thread, messages } = await getThread(uid);
  await getAdminDb()
    .collection("support_threads")
    .doc(uid)
    .set({ unreadForAdmin: false }, { merge: true })
    .catch(() => {});
  return NextResponse.json({ thread, messages });
}

/** Post an admin reply. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  if (!(await guard()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { uid } = await params;
  const body = await req.json().catch(() => ({}));
  const text = String(body.text ?? "").trim();
  if (!text) return NextResponse.json({ ok: false }, { status: 400 });

  const db = getAdminDb();
  await db
    .collection("support_threads")
    .doc(uid)
    .collection("messages")
    .add({ text, senderRole: "admin", createdAt: FieldValue.serverTimestamp() });
  await db.collection("support_threads").doc(uid).set(
    {
      lastMessage: text,
      lastAt: FieldValue.serverTimestamp(),
      unreadForAdmin: false,
      unreadForUser: true,
    },
    { merge: true }
  );
  return NextResponse.json({ ok: true });
}
