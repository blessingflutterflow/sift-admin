"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function logout() {
  (await cookies()).delete("sift_admin_auth");
  redirect("/login");
}

/**
 * Approve a driver. Mirrors the status onto both the application and the user
 * doc — the mobile app watches these and routes the driver to their home.
 */
export async function approveApplication(uid: string) {
  const adminDb = getAdminDb();
  const batch = adminDb.batch();
  batch.update(adminDb.collection("applications").doc(uid), {
    status: "approved",
    reviewedAt: FieldValue.serverTimestamp(),
    rejectionReason: FieldValue.delete(),
  });
  batch.set(
    adminDb.collection("users").doc(uid),
    { status: "approved" },
    { merge: true }
  );
  await batch.commit();
  revalidatePath("/applications");
}

/** Reject a driver with a reason shown to them in the app. */
export async function rejectApplication(uid: string, reason: string) {
  const adminDb = getAdminDb();
  const batch = adminDb.batch();
  batch.update(adminDb.collection("applications").doc(uid), {
    status: "rejected",
    rejectionReason: reason || "Your application was not approved.",
    reviewedAt: FieldValue.serverTimestamp(),
  });
  batch.set(
    adminDb.collection("users").doc(uid),
    { status: "rejected" },
    { merge: true }
  );
  await batch.commit();
  revalidatePath("/applications");
}

/** Form entry point used by the dashboard's approve/reject buttons. */
export async function reviewAction(formData: FormData) {
  const uid = String(formData.get("uid") ?? "");
  const intent = String(formData.get("intent") ?? "");
  if (!uid) return;
  if (intent === "approve") {
    await approveApplication(uid);
  } else if (intent === "reject") {
    await rejectApplication(uid, String(formData.get("reason") ?? ""));
  }
}
