"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { audit } from "@/lib/audit";
import { ACTIVE_STATUSES } from "@/lib/rides";
import { getSession } from "@/lib/adminSession";
import { hashPassword, type AdminRole } from "@/lib/adminAuth";

const ADMIN_ROLES: AdminRole[] = [
  "dispatcher", "onboarding", "support", "finance", "fleet", "superadmin",
];

async function requireSuperadmin() {
  const s = await getSession();
  if (!s || s.role !== "superadmin") throw new Error("Forbidden");
}

export async function logout() {
  (await cookies()).delete("sift_admin_session");
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
    // How far (km) a request reaches for a driver. Clamp to a sane 1–100 km.
    dispatchRadiusKm: Math.min(100, Math.max(1, num("dispatchRadiusKm", 20))),
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

// --- Sub-admins (super-admin only) -----------------------------------------

export async function createAdminAction(formData: FormData) {
  await requireSuperadmin();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "") as AdminRole;
  if (!username || password.length < 6 || !ADMIN_ROLES.includes(role)) return;

  await getAdminDb().collection("admin_users").doc(username).set({
    username,
    name: name || username,
    role,
    passwordHash: await hashPassword(password),
    active: true,
    createdAt: FieldValue.serverTimestamp(),
  });
  await audit("admin.create", username, role);
  revalidatePath("/admins");
}

export async function toggleAdminAction(formData: FormData) {
  await requireSuperadmin();
  const username = String(formData.get("username") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!username) return;
  await getAdminDb()
    .collection("admin_users")
    .doc(username)
    .set({ active }, { merge: true });
  await audit(active ? "admin.enable" : "admin.disable", username);
  revalidatePath("/admins");
}

export async function deleteAdminAction(formData: FormData) {
  await requireSuperadmin();
  const username = String(formData.get("username") ?? "");
  if (!username) return;
  await getAdminDb().collection("admin_users").doc(username).delete();
  await audit("admin.delete", username);
  revalidatePath("/admins");
}

/** Assign a driver's service category. Dispatch only offers matching requests
 *  (rides match the tier; parcels go to 'parcel'). Empty = eligible for all. */
const DRIVER_CATEGORIES = ["bike", "go", "xl", "max", "parcel"];
export async function setDriverCategoryAction(formData: FormData) {
  const uid = String(formData.get("uid") ?? "");
  const category = String(formData.get("category") ?? "");
  if (!uid) return;
  const value =
    DRIVER_CATEGORIES.includes(category) ? category : null; // "" clears it
  await getAdminDb()
    .collection("users")
    .doc(uid)
    .set({ category: value }, { merge: true });
  await audit("driver.category", uid, value ?? "any");
  revalidatePath(`/users/${uid}`);
}

/** Save driver document expiry dates (licence / PrDP / insurance). Stored as
 *  ISO yyyy-mm-dd strings on the application so the admin can flag lapses. */
export async function setDocExpiryAction(formData: FormData) {
  const uid = String(formData.get("uid") ?? "");
  if (!uid) return;
  const clean = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "";
  };
  const docExpiry = {
    license: clean("license"),
    prdp: clean("prdp"),
    insurance: clean("insurance"),
  };
  await getAdminDb()
    .collection("applications")
    .doc(uid)
    .set({ docExpiry }, { merge: true });
  await audit("driver.docExpiry", uid, JSON.stringify(docExpiry));
  revalidatePath(`/users/${uid}`);
}

/** Reply to a user's support thread (admin → user). */
export async function replyToSupportAction(formData: FormData) {
  const uid = String(formData.get("uid") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  if (!uid || !text) return;
  const db = getAdminDb();
  await db
    .collection("support_threads")
    .doc(uid)
    .collection("messages")
    .add({
      text,
      senderRole: "admin",
      createdAt: FieldValue.serverTimestamp(),
    });
  await db.collection("support_threads").doc(uid).set(
    {
      lastMessage: text,
      lastAt: FieldValue.serverTimestamp(),
      unreadForAdmin: false,
      unreadForUser: true,
    },
    { merge: true }
  );
  revalidatePath(`/support/${uid}`);
  revalidatePath("/support");
}

/** Mark a support thread read by the admin (no reply). */
export async function markSupportReadAction(formData: FormData) {
  const uid = String(formData.get("uid") ?? "");
  if (!uid) return;
  await getAdminDb()
    .collection("support_threads")
    .doc(uid)
    .set({ unreadForAdmin: false }, { merge: true });
  revalidatePath("/support");
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

/**
 * Broadcast a full-screen announcement to all drivers. Writing the doc triggers
 * onAnnouncementCreated, which pushes it to the `drivers` FCM topic; the driver
 * app streams active ones and shows them full-screen until each driver dismisses.
 */
export async function sendAnnouncementAction(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const rawSev = String(formData.get("severity") ?? "info");
  const severity = ["info", "warning", "critical"].includes(rawSev)
    ? rawSev
    : "info";
  const rawAud = String(formData.get("audience") ?? "all_drivers");
  const audience = ["all_drivers", "all_riders", "everyone", "specific"].includes(
    rawAud
  )
    ? rawAud
    : "all_drivers";
  // Deduped list of recipient uids — only meaningful when audience is 'specific'.
  const targetUids =
    audience === "specific"
      ? [...new Set(formData.getAll("targetUids").map(String).filter(Boolean))]
      : [];
  if (!title || !body) return;
  // A 'specific' send with no one selected is a no-op — don't create an
  // undeliverable announcement.
  if (audience === "specific" && targetUids.length === 0) return;

  const ref = await getAdminDb().collection("announcements").add({
    title,
    body,
    severity,
    audience,
    targetUids,
    active: true,
    createdAt: FieldValue.serverTimestamp(),
  });
  const who =
    audience === "specific" ? `${targetUids.length} people` : audience;
  await audit("announcement.send", ref.id, `${severity} → ${who}: ${title}`);
  revalidatePath("/announcements");
}

/** Turn an announcement on/off. Off pulls it from every driver at once. */
export async function toggleAnnouncementAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!id) return;
  await getAdminDb()
    .collection("announcements")
    .doc(id)
    .set({ active }, { merge: true });
  await audit(active ? "announcement.activate" : "announcement.deactivate", id);
  revalidatePath("/announcements");
}
