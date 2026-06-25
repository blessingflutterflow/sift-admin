import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "./firebaseAdmin";

export type AuditEntry = {
  id: string;
  action: string;
  target: string;
  details: string;
  at: Date | null;
};

/** Record an admin mutation — every money/status override leaves a trace. */
export async function audit(action: string, target: string, details = "") {
  await getAdminDb()
    .collection("admin_audit")
    .add({
      action,
      target,
      details,
      at: FieldValue.serverTimestamp(),
    })
    .catch(() => {});
}

export async function listAudit(limit = 100): Promise<AuditEntry[]> {
  const snap = await getAdminDb()
    .collection("admin_audit")
    .orderBy("at", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => {
    const x = d.data();
    return {
      id: d.id,
      action: x.action ?? "",
      target: x.target ?? "",
      details: x.details ?? "",
      at: x.at instanceof Timestamp ? x.at.toDate() : null,
    };
  });
}
