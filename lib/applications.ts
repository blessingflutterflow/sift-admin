import { getAdminDb } from "./firebaseAdmin";

export type ApplicationStatus = "pending" | "approved" | "rejected";

export type Application = {
  uid: string;
  role: string;
  status: ApplicationStatus;
  vehicle: Record<string, string>;
  documents: Record<string, string>;
  submittedAt: string | null;
  name: string;
  phone: string;
  email: string;
  rejectionReason?: string;
};

/** All driver applications, newest first, joined with the user's profile. */
export async function listApplications(): Promise<Application[]> {
  const adminDb = getAdminDb();
  const snap = await adminDb.collection("applications").get();

  const apps = await Promise.all(
    snap.docs.map(async (d) => {
      const data = d.data();
      const userSnap = await adminDb.collection("users").doc(d.id).get();
      const user = userSnap.data() ?? {};
      const submittedAt = data.submittedAt?.toDate?.() ?? null;

      return {
        uid: d.id,
        role: data.role ?? "driver",
        status: (data.status ?? "pending") as ApplicationStatus,
        vehicle: data.vehicle ?? {},
        documents: data.documents ?? {},
        submittedAt: submittedAt ? submittedAt.toISOString() : null,
        name: user.name ?? "",
        phone: user.phone ?? "",
        email: user.email ?? "",
        rejectionReason: data.rejectionReason,
      } satisfies Application;
    })
  );

  // Newest first; undated last.
  apps.sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));
  return apps;
}
