"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { audit } from "@/lib/audit";
import { ACTIVE_STATUSES } from "@/lib/rides";

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
  await audit("application.approve", uid);
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
  await audit("application.reject", uid, reason);
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

/** Force-cancel a stuck/abusive active ride. */
export async function cancelRideAction(formData: FormData) {
  const rideId = String(formData.get("rideId") ?? "");
  if (!rideId) return;
  const ref = getAdminDb().collection("rides").doc(rideId);
  const snap = await ref.get();
  const status = snap.data()?.status;
  if (!snap.exists || !ACTIVE_STATUSES.includes(status)) return;
  await ref.update({
    status: "cancelled",
    offeredTo: null,
    cancelledBy: "admin",
  });
  await audit("ride.cancel", rideId, `was ${status}`);
  revalidatePath("/rides");
  revalidatePath(`/rides/${rideId}`);
}

/** Refund a Paystack charge (full, or partial via amountZar). */
export async function refundAction(formData: FormData) {
  const reference = String(formData.get("reference") ?? "");
  if (!reference) return;
  const amountZar = Number(formData.get("amountZar") ?? 0);
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured");

  const res = await fetch("https://api.paystack.co/refund", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transaction: reference,
      ...(amountZar > 0 ? { amount: Math.round(amountZar * 100) } : {}),
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.status === false) {
    throw new Error(body?.message || "Refund failed");
  }

  await getAdminDb()
    .collection("transactions")
    .doc(reference)
    .set({ refundStatus: "requested" }, { merge: true });
  await audit("transaction.refund", reference, amountZar > 0 ? `R${amountZar}` : "full");
  revalidatePath("/finance");
}

/** Live pricing-config editor — the next quote uses these immediately. */
export async function savePricingAction(formData: FormData) {
  const num = (k: string, fallback: number) => {
    const v = Number(formData.get(k));
    return Number.isFinite(v) && v >= 0 ? v : fallback;
  };
  const next = {
    fareBase: num("fareBase", 30),
    farePerKm: num("farePerKm", 5),
    commissionPct: Math.min(num("commissionPctPercent", 20), 90) / 100,
    waitFreeMin: num("waitFreeMin", 5),
    waitPerMin: num("waitPerMin", 1.5),
    cancelFee: num("cancelFee", 25),
    cashDebtCapZar: num("cashDebtCapZar", 300),
    cashEnabled: formData.get("cashEnabled") === "on",
    // City-wide surge applied when no zone covers the pickup (0.5×–5×).
    surgeMultiplier: Math.min(5, Math.max(0.5, num("surgeMultiplier", 1))),
    tierMultipliers: {
      bike: num("multBike", 0.7),
      go: num("multGo", 1.0),
      xl: num("multXl", 1.45),
      max: num("multMax", 1.9),
    },
    updatedAt: FieldValue.serverTimestamp(),
  };
  await getAdminDb().collection("config").doc("pricing").set(next, { merge: true });
  await audit("pricing.update", "config/pricing", JSON.stringify({ ...next, updatedAt: undefined }));
  revalidatePath("/pricing");
}

/** Manual ledger adjustment: positive = driver owes more, negative = credit. */
export async function ledgerAdjustAction(formData: FormData) {
  const uid = String(formData.get("uid") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const note = String(formData.get("note") ?? "").slice(0, 200);
  if (!uid || !Number.isFinite(amount) || amount === 0) return;

  const db = getAdminDb();
  const ledgerRef = db.collection("ledgers").doc(uid);
  const batch = db.batch();
  batch.set(
    ledgerRef,
    {
      balance: FieldValue.increment(amount),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  batch.set(ledgerRef.collection("entries").doc(), {
    type: "adjustment",
    balanceDelta: amount,
    note: note || null,
    createdAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
  await audit("ledger.adjust", uid, `R${amount}${note ? ` — ${note}` : ""}`);
  revalidatePath("/finance");
}

/** Live parcel-pricing editor — the next parcel quote uses these immediately. */
export async function saveParcelPricingAction(formData: FormData) {
  const num = (k: string, fallback: number) => {
    const v = Number(formData.get(k));
    return Number.isFinite(v) && v >= 0 ? v : fallback;
  };
  const next = {
    base: num("base", 25),
    perKm: num("perKm", 6),
    perStop: num("perStop", 10),
    commissionPct: Math.min(num("commissionPctPercent", 20), 90) / 100,
    cancelFee: num("cancelFee", 20),
    sizeSurcharge: {
      small: num("sizeSmall", 0),
      medium: num("sizeMedium", 15),
      large: num("sizeLarge", 35),
    },
    updatedAt: FieldValue.serverTimestamp(),
  };
  await getAdminDb().collection("config").doc("parcelPricing").set(next, { merge: true });
  await audit("parcelPricing.update", "config/parcelPricing",
    JSON.stringify({ ...next, updatedAt: undefined }));
  revalidatePath("/parcels");
}

// --- Surge zones (circles) -------------------------------------------------

/** Create a surge zone: name + center (lat/lng) + radius + multiplier. */
export async function createZoneAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  const radiusKm = Number(formData.get("radiusKm"));
  const surgeMultiplier = Math.min(
    5,
    Math.max(0.5, Number(formData.get("surgeMultiplier")) || 1)
  );
  if (
    !name ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    !Number.isFinite(radiusKm) ||
    radiusKm <= 0
  ) {
    return;
  }
  const ref = await getAdminDb().collection("zones").add({
    name,
    lat,
    lng,
    radiusKm,
    surgeMultiplier,
    active: true,
    createdAt: FieldValue.serverTimestamp(),
  });
  await audit("zone.create", ref.id, `${name} · ${surgeMultiplier}×`);
  revalidatePath("/zones");
}

/** Enable/disable a zone without deleting it. */
export async function toggleZoneAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!id) return;
  await getAdminDb().collection("zones").doc(id).set({ active }, { merge: true });
  await audit(active ? "zone.enable" : "zone.disable", id);
  revalidatePath("/zones");
}

export async function deleteZoneAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await getAdminDb().collection("zones").doc(id).delete();
  await audit("zone.delete", id);
  revalidatePath("/zones");
}

/** Approve/reject a rider's identity verification (manual review of a
 *  borderline face-match). */
export async function reviewVerificationAction(formData: FormData) {
  const uid = String(formData.get("uid") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!uid || !["approved", "rejected"].includes(decision)) return;
  await getAdminDb()
    .collection("users")
    .doc(uid)
    .set({ verificationStatus: decision }, { merge: true });
  await audit(`verification.${decision}`, uid);
  revalidatePath("/verifications");
}

/** Block/unblock a user (enforced server-side in dispatch). */
export async function toggleBlockAction(formData: FormData) {
  const uid = String(formData.get("uid") ?? "");
  const block = String(formData.get("block") ?? "") === "true";
  if (!uid) return;
  await getAdminDb()
    .collection("users")
    .doc(uid)
    .set({ blocked: block }, { merge: true });
  await audit(block ? "user.block" : "user.unblock", uid);
  revalidatePath("/users");
}
