import { getAdminDb } from "./firebaseAdmin";

export type SupportThread = {
  uid: string;
  userName: string;
  userRole: string;
  lastMessage: string;
  lastAt: string | null;
  unreadForAdmin: boolean;
};

export type SupportMessage = {
  id: string;
  text: string;
  senderRole: string; // 'user' | 'admin'
  createdAt: string | null;
};

/** All support threads, most-recent first. */
export async function listThreads(): Promise<SupportThread[]> {
  const snap = await getAdminDb()
    .collection("support_threads")
    .orderBy("lastAt", "desc")
    .get();
  return snap.docs.map((d) => {
    const x = d.data();
    return {
      uid: d.id,
      userName: x.userName ?? "User",
      userRole: x.userRole ?? "",
      lastMessage: x.lastMessage ?? "",
      lastAt: x.lastAt?.toDate?.().toISOString() ?? null,
      unreadForAdmin: x.unreadForAdmin === true,
    } satisfies SupportThread;
  });
}

export async function getThread(
  uid: string
): Promise<{ thread: SupportThread | null; messages: SupportMessage[] }> {
  const db = getAdminDb();
  const [t, msgs] = await Promise.all([
    db.collection("support_threads").doc(uid).get(),
    db
      .collection("support_threads")
      .doc(uid)
      .collection("messages")
      .orderBy("createdAt")
      .get(),
  ]);
  const x = t.data();
  const thread: SupportThread | null = t.exists
    ? {
        uid,
        userName: x?.userName ?? "User",
        userRole: x?.userRole ?? "",
        lastMessage: x?.lastMessage ?? "",
        lastAt: x?.lastAt?.toDate?.().toISOString() ?? null,
        unreadForAdmin: x?.unreadForAdmin === true,
      }
    : null;
  const messages = msgs.docs.map((d) => {
    const m = d.data();
    return {
      id: d.id,
      text: m.text ?? "",
      senderRole: m.senderRole ?? "user",
      createdAt: m.createdAt?.toDate?.().toISOString() ?? null,
    } satisfies SupportMessage;
  });
  return { thread, messages };
}
