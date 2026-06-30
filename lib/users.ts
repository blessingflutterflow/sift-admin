import { getAdminDb } from "./firebaseAdmin";
import { worstExpiry, type ExpiryStatus } from "./docExpiry";

export type AppUser = {
  uid: string;
  name: string;
  phone: string;
  email: string;
  role: "rider" | "driver" | "unknown";
  status: "none" | "pending" | "approved" | "rejected";
  blocked: boolean;
  /** Number plate (drivers only) — surfaced so admins can search by it. */
  plate: string;
  vehicle: string;
  /** Worst document-expiry status across the driver's docs (for a list flag). */
  docFlag: ExpiryStatus;
};

export async function listUsers(): Promise<AppUser[]> {
  const db = getAdminDb();
  // Pull users + driver applications together so the list can show/search by
  // vehicle plate without an extra round-trip per row.
  const [usersSnap, appsSnap] = await Promise.all([
    db.collection("users").get(),
    db.collection("applications").get(),
  ]);

  const vehicleByUid = new Map<
    string,
    { plate: string; vehicle: string; docFlag: ExpiryStatus }
  >();
  appsSnap.forEach((d) => {
    const v = (d.data().vehicle ?? {}) as Record<string, string>;
    const vehicle = [v.color, v.make, v.model].filter(Boolean).join(" ");
    const docFlag = worstExpiry(
      (d.data().docExpiry ?? {}) as Record<string, string>
    );
    vehicleByUid.set(d.id, { plate: v.plate ?? "", vehicle, docFlag });
  });

  const users = usersSnap.docs.map((d) => {
    const x = d.data();
    const role = x.role === "rider" || x.role === "driver" ? x.role : "unknown";
    const veh = vehicleByUid.get(d.id);
    return {
      uid: d.id,
      name: x.name ?? "",
      phone: x.phone ?? "",
      email: x.email ?? "",
      role,
      status: (x.status ?? "none") as AppUser["status"],
      blocked: x.blocked === true,
      plate: veh?.plate ?? "",
      vehicle: veh?.vehicle ?? "",
      docFlag: veh?.docFlag ?? "none",
    } satisfies AppUser;
  });
  users.sort((a, b) => a.name.localeCompare(b.name));
  return users;
}

export type UserProfile = {
  uid: string;
  name: string;
  phone: string;
  email: string;
  role: "rider" | "driver" | "unknown";
  status: string;
  blocked: boolean;
  ratingAvg: number | null;
  ratingCount: number;
  verificationStatus: string | null;
  category: string | null;
  vehicle: Record<string, string>;
  documents: Record<string, string>;
  /** Expiry dates (ISO yyyy-mm-dd) per document type: license / prdp / insurance. */
  docExpiry: Record<string, string>;
  online: boolean;
  lastSeen: string | null;
};

/** Everything we hold on one person — profile, KYC docs, vehicle, live state. */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getAdminDb();
  const [u, a, loc] = await Promise.all([
    db.collection("users").doc(uid).get(),
    db.collection("applications").doc(uid).get(),
    db.collection("driver_locations").doc(uid).get(),
  ]);
  if (!u.exists) return null;
  const x = u.data() ?? {};
  const app = a.data() ?? {};
  const l = loc.data() ?? {};
  const role = x.role === "rider" || x.role === "driver" ? x.role : "unknown";
  return {
    uid,
    name: x.name ?? "",
    phone: x.phone ?? "",
    email: x.email ?? "",
    role,
    status: (app.status ?? x.status ?? "none") as string,
    blocked: x.blocked === true,
    ratingAvg: typeof x.ratingAvg === "number" ? x.ratingAvg : null,
    ratingCount: x.ratingCount ?? 0,
    verificationStatus: (x.verificationStatus as string) ?? null,
    category: (x.category as string) ?? null,
    vehicle: (app.vehicle ?? {}) as Record<string, string>,
    documents: (app.documents ?? {}) as Record<string, string>,
    docExpiry: (app.docExpiry ?? {}) as Record<string, string>,
    online: l.online === true,
    lastSeen: l.updatedAt?.toDate?.().toISOString() ?? null,
  };
}
