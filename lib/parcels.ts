import { getAdminDb } from "@/lib/firebaseAdmin";

export type ParcelStopRow = {
  recipientName: string;
  address: string;
  size: string;
  status: string; // pending | delivered | failed
  receivedBy?: string;
  podPhotoUrl?: string;
  podSignatureUrl?: string;
  failReason?: string;
};

export type ParcelRow = {
  id: string;
  senderName: string;
  driverName: string | null;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  fare: number;
  distanceKm: number;
  pickupAddress: string;
  stops: ParcelStopRow[];
  createdAt: number | null; // epoch ms
};

const num = (v: unknown, d = 0) =>
  typeof v === "number" && Number.isFinite(v) ? v : d;

/** Recent parcels, newest first (admin orders list + POD audit). */
export async function loadParcels(limit = 60): Promise<ParcelRow[]> {
  const snap = await getAdminDb()
    .collection("parcels")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((d) => {
    const x = d.data() as Record<string, unknown>;
    const stops = Array.isArray(x.stops) ? (x.stops as Record<string, unknown>[]) : [];
    const created = x.createdAt as { toMillis?: () => number } | undefined;
    return {
      id: d.id,
      senderName: String(x.senderName ?? "Sender"),
      driverName: (x.driverName as string) ?? null,
      status: String(x.status ?? "requested"),
      paymentMethod: String(x.paymentMethod ?? "cash"),
      paymentStatus: String(x.paymentStatus ?? "unpaid"),
      fare: num(x.finalFare ?? x.fare),
      distanceKm: num(x.distanceKm),
      pickupAddress: String(x.pickupAddress ?? ""),
      stops: stops.map((s) => ({
        recipientName: String(s.recipientName ?? ""),
        address: String(s.address ?? ""),
        size: String(s.size ?? "small"),
        status: String(s.status ?? "pending"),
        receivedBy: (s.receivedBy as string) || undefined,
        podPhotoUrl: (s.podPhotoUrl as string) || undefined,
        podSignatureUrl: (s.podSignatureUrl as string) || undefined,
        failReason: (s.failReason as string) || undefined,
      })),
      createdAt: created?.toMillis ? created.toMillis() : null,
    };
  });
}

export type ParcelPricing = {
  base: number;
  perKm: number;
  perStop: number;
  sizeSurcharge: { small: number; medium: number; large: number };
  commissionPct: number;
  cancelFee: number;
};

const PARCEL_DEFAULTS: ParcelPricing = {
  base: 25,
  perKm: 6,
  perStop: 10,
  sizeSurcharge: { small: 0, medium: 15, large: 35 },
  commissionPct: 0.2,
  cancelFee: 20,
};

export async function loadParcelPricing(): Promise<ParcelPricing> {
  const d = await getAdminDb().collection("config").doc("parcelPricing").get();
  const x = (d.data() ?? {}) as Record<string, unknown>;
  return {
    ...PARCEL_DEFAULTS,
    ...x,
    sizeSurcharge: {
      ...PARCEL_DEFAULTS.sizeSurcharge,
      ...((x.sizeSurcharge as Record<string, number>) ?? {}),
    },
  } as ParcelPricing;
}
