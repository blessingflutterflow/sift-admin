import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "./firebaseAdmin";

export type RideStatus =
  | "requested"
  | "accepted"
  | "arriving"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "expired";

export const ACTIVE_STATUSES: RideStatus[] = [
  "requested",
  "accepted",
  "arriving",
  "arrived",
  "in_progress",
];

export type Ride = {
  id: string;
  riderId: string;
  riderName: string;
  riderPhone: string;
  driverId: string | null;
  driverName: string | null;
  driverVehicle: string | null;
  pickupAddress: string;
  destLabel: string;
  tierName: string;
  status: RideStatus;
  distanceKm: number;
  fare: number;
  finalFare: number | null;
  waitFee: number | null;
  commission: number | null;
  driverEarning: number | null;
  paymentMethod: string;
  paymentStatus: string;
  cancelledBy: string | null;
  createdAt: Date | null;
  acceptedAt: Date | null;
  arrivedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  paidAt: Date | null;
};

function toDate(v: unknown): Date | null {
  return v instanceof Timestamp ? v.toDate() : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRide(id: string, x: Record<string, any>): Ride {
  return {
    id,
    riderId: x.riderId ?? "",
    riderName: x.riderName ?? "Rider",
    riderPhone: x.riderPhone ?? "",
    driverId: x.driverId ?? null,
    driverName: x.driverName ?? null,
    driverVehicle: x.driverVehicle ?? null,
    pickupAddress: x.pickupAddress ?? "",
    destLabel: x.destLabel ?? "",
    tierName: x.tierName ?? "",
    status: (x.status ?? "requested") as RideStatus,
    distanceKm: Number(x.distanceKm ?? 0),
    fare: Number(x.fare ?? 0),
    finalFare: x.finalFare != null ? Number(x.finalFare) : null,
    waitFee: x.waitFee != null ? Number(x.waitFee) : null,
    commission: x.commission != null ? Number(x.commission) : null,
    driverEarning: x.driverEarning != null ? Number(x.driverEarning) : null,
    paymentMethod: x.paymentMethod ?? "cash",
    paymentStatus: x.paymentStatus ?? "unpaid",
    cancelledBy: x.cancelledBy ?? null,
    createdAt: toDate(x.createdAt),
    acceptedAt: toDate(x.acceptedAt),
    arrivedAt: toDate(x.arrivedAt),
    startedAt: toDate(x.startedAt),
    completedAt: toDate(x.completedAt),
    paidAt: toDate(x.paidAt),
  };
}

/** Newest rides, optionally filtered to one status. */
export async function listRides(opts?: {
  status?: RideStatus;
  limit?: number;
}): Promise<Ride[]> {
  let q = getAdminDb()
    .collection("rides")
    .orderBy("createdAt", "desc")
    .limit(opts?.limit ?? 100);
  if (opts?.status) {
    q = getAdminDb()
      .collection("rides")
      .where("status", "==", opts.status)
      .orderBy("createdAt", "desc")
      .limit(opts?.limit ?? 100);
  }
  const snap = await q.get();
  return snap.docs.map((d) => mapRide(d.id, d.data()));
}

export async function getRide(id: string): Promise<Ride | null> {
  const d = await getAdminDb().collection("rides").doc(id).get();
  if (!d.exists) return null;
  return mapRide(d.id, d.data()!);
}

export type Kpis = {
  ridesToday: number;
  ridesWeek: number;
  gmvWeek: number;
  commissionWeek: number;
  completionRateWeek: number; // completed / (completed+cancelled+expired)
  activeNow: number;
  onlineDrivers: number;
};

/** Business pulse for the dashboard. Fine at launch scale (single scan/week). */
export async function loadKpis(): Promise<Kpis> {
  const db = getAdminDb();
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(dayStart);
  weekStart.setDate(weekStart.getDate() - ((now.getDay() + 6) % 7));

  const [weekSnap, activeSnap, onlineSnap] = await Promise.all([
    db
      .collection("rides")
      .where("createdAt", ">=", Timestamp.fromDate(weekStart))
      .get(),
    db.collection("rides").where("status", "in", ACTIVE_STATUSES).get(),
    db.collection("driver_locations").where("online", "==", true).get(),
  ]);

  let ridesToday = 0;
  let completed = 0;
  let ended = 0;
  let gmv = 0;
  let commission = 0;
  weekSnap.forEach((d) => {
    const x = d.data();
    const at = toDate(x.createdAt);
    if (at && at >= dayStart) ridesToday++;
    if (x.status === "completed") {
      completed++;
      ended++;
      gmv += Number(x.finalFare ?? x.fare ?? 0);
      commission += Number(x.commission ?? 0);
    } else if (x.status === "cancelled" || x.status === "expired") {
      ended++;
    }
  });

  return {
    ridesToday,
    ridesWeek: weekSnap.size,
    gmvWeek: Math.round(gmv),
    commissionWeek: Math.round(commission),
    completionRateWeek: ended === 0 ? 0 : Math.round((completed / ended) * 100),
    activeNow: activeSnap.size,
    onlineDrivers: onlineSnap.size,
  };
}
