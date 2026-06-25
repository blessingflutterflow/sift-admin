import Link from "next/link";
import {
  ACTIVE_STATUSES,
  listRides,
  loadKpis,
  type Ride,
  type RideStatus,
} from "@/lib/rides";

export const dynamic = "force-dynamic";

const FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Expired", value: "expired" },
];

export default async function RidesPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>;
}) {
  const { f = "" } = await searchParams;
  const [kpis, rides] = await Promise.all([loadKpis(), listRides()]);

  const filtered = rides.filter((r) => {
    if (!f) return true;
    if (f === "active") return ACTIVE_STATUSES.includes(r.status);
    return r.status === (f as RideStatus);
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Rides</h1>
        <p className="text-sm text-zinc-500">The pulse of the business</p>
      </div>

      {/* KPI strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Rides today" value={String(kpis.ridesToday)} />
        <Kpi label="Rides this week" value={String(kpis.ridesWeek)} />
        <Kpi label="GMV (week)" value={`R${kpis.gmvWeek}`} />
        <Kpi label="Commission (week)" value={`R${kpis.commissionWeek}`} accent />
        <Kpi label="Completion rate" value={`${kpis.completionRateWeek}%`} />
        <Kpi
          label="Right now"
          value={`${kpis.activeNow} rides · ${kpis.onlineDrivers} online`}
        />
      </div>

      {/* Filter pills */}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((x) => (
          <Link
            key={x.value}
            href={x.value ? `/rides?f=${x.value}` : "/rides"}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              f === x.value
                ? "bg-zinc-900 text-white"
                : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            {x.label}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-3 font-semibold">When</th>
                <th className="px-5 py-3 font-semibold">Trip</th>
                <th className="px-5 py-3 font-semibold">Driver</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Payment</th>
                <th className="px-5 py-3 text-right font-semibold">Fare</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-50">
                  <td className="whitespace-nowrap px-5 py-3 text-zinc-500">
                    <Link href={`/rides/${r.id}`} className="block">
                      {when(r.createdAt)}
                    </Link>
                  </td>
                  <td className="max-w-65 px-5 py-3">
                    <Link href={`/rides/${r.id}`} className="block">
                      <p className="truncate font-medium text-zinc-900">
                        {r.destLabel || "—"}
                      </p>
                      <p className="truncate text-xs text-zinc-400">
                        {r.riderName} · from {r.pickupAddress || "—"}
                      </p>
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-zinc-600">
                    {r.driverName ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    <RideStatusBadge status={r.status} />
                  </td>
                  <td className="px-5 py-3">
                    <PaymentBadge r={r} />
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-zinc-900">
                    R{Math.round(r.finalFare ?? r.fare)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-zinc-500">
            No rides match this filter.
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p
        className="mt-1 text-lg font-bold tracking-tight"
        style={accent ? { color: "#FF6B2C" } : undefined}
      >
        {value}
      </p>
    </div>
  );
}

export function RideStatusBadge({ status }: { status: RideStatus }) {
  const styles: Record<string, string> = {
    requested: "bg-amber-100 text-amber-700",
    accepted: "bg-blue-50 text-blue-700",
    arriving: "bg-blue-50 text-blue-700",
    arrived: "bg-indigo-50 text-indigo-700",
    in_progress: "bg-violet-50 text-violet-700",
    completed: "bg-emerald-50 text-emerald-700",
    cancelled: "bg-rose-50 text-rose-700",
    expired: "bg-zinc-100 text-zinc-500",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export function PaymentBadge({ r }: { r: Ride }) {
  if (r.paymentMethod !== "card") {
    return (
      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600">
        cash
      </span>
    );
  }
  const styles: Record<string, string> = {
    paid: "bg-emerald-50 text-emerald-700",
    processing: "bg-amber-100 text-amber-700",
    due: "bg-rose-50 text-rose-700",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        styles[r.paymentStatus] ?? "bg-zinc-100 text-zinc-500"
      }`}
    >
      card · {r.paymentStatus}
    </span>
  );
}

function when(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
