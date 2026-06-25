import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "./firebaseAdmin";

export type Txn = {
  reference: string;
  rideId: string | null;
  riderId: string | null;
  driverId: string | null;
  amount: number;
  commission: number | null;
  driverEarning: number | null;
  type: string;
  status: string;
  refundStatus: string | null;
  createdAt: Date | null;
};

export type DriverBalance = {
  uid: string;
  name: string;
  phone: string;
  balance: number;
  subaccountCode: string | null;
  updatedAt: Date | null;
};

export type LedgerEntry = {
  id: string;
  type: string;
  rideId: string | null;
  finalFare: number | null;
  commission: number | null;
  driverEarning: number | null;
  balanceDelta: number;
  amount: number | null;
  note: string | null;
  createdAt: Date | null;
};

function toDate(v: unknown): Date | null {
  return v instanceof Timestamp ? v.toDate() : null;
}

export async function listTransactions(limit = 80): Promise<Txn[]> {
  const snap = await getAdminDb()
    .collection("transactions")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => {
    const x = d.data();
    return {
      reference: d.id,
      rideId: x.rideId ?? null,
      riderId: x.riderId ?? null,
      driverId: x.driverId ?? null,
      amount: Number(x.amount ?? 0),
      commission: x.commission != null ? Number(x.commission) : null,
      driverEarning: x.driverEarning != null ? Number(x.driverEarning) : null,
      type: x.type ?? "trip",
      status: x.status ?? "success",
      refundStatus: x.refundStatus ?? null,
      createdAt: toDate(x.createdAt),
    } satisfies Txn;
  });
}

export async function transactionsForRide(rideId: string): Promise<Txn[]> {
  const snap = await getAdminDb()
    .collection("transactions")
    .where("rideId", "==", rideId)
    .get();
  return snap.docs.map((d) => {
    const x = d.data();
    return {
      reference: d.id,
      rideId: x.rideId ?? null,
      riderId: x.riderId ?? null,
      driverId: x.driverId ?? null,
      amount: Number(x.amount ?? 0),
      commission: x.commission != null ? Number(x.commission) : null,
      driverEarning: x.driverEarning != null ? Number(x.driverEarning) : null,
      type: x.type ?? "trip",
      status: x.status ?? "success",
      refundStatus: x.refundStatus ?? null,
      createdAt: toDate(x.createdAt),
    } satisfies Txn;
  });
}

/** Every driver ledger, joined with name/phone + payout subaccount status. */
export async function listDriverBalances(): Promise<DriverBalance[]> {
  const db = getAdminDb();
  const ledgers = await db.collection("ledgers").get();
  if (ledgers.empty) return [];

  const uids = ledgers.docs.map((d) => d.id);
  const [userDocs, appDocs] = await Promise.all([
    Promise.all(uids.map((u) => db.collection("users").doc(u).get())),
    Promise.all(uids.map((u) => db.collection("applications").doc(u).get())),
  ]);

  const out = ledgers.docs.map((d, i) => {
    const u = userDocs[i].data() ?? {};
    const a = appDocs[i].data() ?? {};
    return {
      uid: d.id,
      name: u.name ?? "Driver",
      phone: u.phone ?? "",
      balance: Number(d.data().balance ?? 0),
      subaccountCode: a.subaccountCode ?? null,
      updatedAt: toDate(d.data().updatedAt),
    } satisfies DriverBalance;
  });
  out.sort((a, b) => b.balance - a.balance);
  return out;
}

export async function ledgerEntries(
  uid: string,
  limit = 50
): Promise<LedgerEntry[]> {
  const snap = await getAdminDb()
    .collection("ledgers")
    .doc(uid)
    .collection("entries")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => {
    const x = d.data();
    return {
      id: d.id,
      type: x.type ?? "",
      rideId: x.rideId ?? null,
      finalFare: x.finalFare != null ? Number(x.finalFare) : null,
      commission: x.commission != null ? Number(x.commission) : null,
      driverEarning: x.driverEarning != null ? Number(x.driverEarning) : null,
      balanceDelta: Number(x.balanceDelta ?? 0),
      amount: x.amount != null ? Number(x.amount) : null,
      note: x.note ?? null,
      createdAt: toDate(x.createdAt),
    } satisfies LedgerEntry;
  });
}

export type PricingConfig = {
  fareBase: number;
  farePerKm: number;
  commissionPct: number;
  waitFreeMin: number;
  waitPerMin: number;
  cancelFee: number;
  cashDebtCapZar: number;
  cashEnabled: boolean;
  surgeMultiplier: number;
  tierMultipliers: Record<string, number>;
};

const PRICING_DEFAULTS: PricingConfig = {
  fareBase: 30,
  farePerKm: 5,
  commissionPct: 0.2,
  waitFreeMin: 5,
  waitPerMin: 1.5,
  cancelFee: 25,
  cashDebtCapZar: 300,
  cashEnabled: true,
  surgeMultiplier: 1.0,
  tierMultipliers: { go: 1.0, xl: 1.45, max: 1.9 },
};

export async function loadPricing(): Promise<PricingConfig> {
  const d = await getAdminDb().collection("config").doc("pricing").get();
  const x = d.data() ?? {};
  return {
    ...PRICING_DEFAULTS,
    ...x,
    tierMultipliers: {
      ...PRICING_DEFAULTS.tierMultipliers,
      ...(x.tierMultipliers ?? {}),
    },
  } as PricingConfig;
}
