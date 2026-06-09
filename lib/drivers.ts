import { getAdminDb } from "./firebaseAdmin";

export type DriverLocation = {
  uid: string;
  name: string;
  vehicle: string | null;
  lat: number;
  lng: number;
  online: boolean;
  updatedAt: string | null;
};

function map(id: string, x: FirebaseFirestore.DocumentData): DriverLocation {
  return {
    uid: id,
    name: x.name ?? "Driver",
    vehicle: x.vehicle ?? null,
    lat: typeof x.lat === "number" ? x.lat : NaN,
    lng: typeof x.lng === "number" ? x.lng : NaN,
    online: !!x.online,
    updatedAt: x.updatedAt?.toDate?.().toISOString() ?? null,
  };
}

/** Online drivers with a valid position. */
export async function listDriverLocations(): Promise<DriverLocation[]> {
  const snap = await getAdminDb().collection("driver_locations").get();
  return snap.docs
    .map((d) => map(d.id, d.data()))
    .filter((d) => d.online && !Number.isNaN(d.lat) && !Number.isNaN(d.lng));
}

export async function getDriverLocation(uid: string): Promise<DriverLocation | null> {
  const doc = await getAdminDb().collection("driver_locations").doc(uid).get();
  if (!doc.exists) return null;
  return map(doc.id, doc.data()!);
}
