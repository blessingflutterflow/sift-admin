import { saveParcelPricingAction } from "@/app/actions";
import { loadParcels, loadParcelPricing, type ParcelRow } from "@/lib/parcels";

export const dynamic = "force-dynamic";

const GREEN = "#FF6B2C";

const STATUS_COLORS: Record<string, string> = {
  requested: "#F59E0B",
  accepted: "#3B82F6",
  arriving: "#3B82F6",
  delivering: "#8B5CF6",
  completed: "#22C55E",
  cancelled: "#9CA3AF",
  expired: "#9CA3AF",
};

export default async function ParcelsPage() {
  const [parcels, pricing] = await Promise.all([
    loadParcels(),
    loadParcelPricing(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">
          Parcels
        </h1>
        <p className="text-sm text-zinc-500">
          Delivery orders, proof-of-delivery audit, and parcel pricing.
        </p>
      </div>

      {/* Pricing */}
      <form
        action={saveParcelPricingAction}
        className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6"
      >
        <h2 className="mb-3 text-sm font-bold text-zinc-900">
          Parcel pricing (ZAR)
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <PField label="Collection base" name="base" value={pricing.base} />
          <PField label="Per km" name="perKm" value={pricing.perKm} />
          <PField label="Per drop-off" name="perStop" value={pricing.perStop} />
          <PField label="Size: medium +" name="sizeMedium" value={pricing.sizeSurcharge.medium} />
          <PField label="Size: large +" name="sizeLarge" value={pricing.sizeSurcharge.large} />
          <PField
            label="Commission (%)"
            name="commissionPctPercent"
            value={Math.round(pricing.commissionPct * 100)}
          />
        </div>
        <button
          className="mt-5 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
          style={{ background: GREEN }}
        >
          Save parcel pricing
        </button>
      </form>

      {/* Orders */}
      <h2 className="mb-3 text-sm font-bold text-zinc-900">
        Recent orders ({parcels.length})
      </h2>
      <div className="space-y-3">
        {parcels.length === 0 ? (
          <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
            No parcels yet.
          </p>
        ) : (
          parcels.map((p) => <ParcelCard key={p.id} p={p} />)
        )}
      </div>
    </div>
  );
}

function ParcelCard({ p }: { p: ParcelRow }) {
  const delivered = p.stops.filter((s) => s.status === "delivered").length;
  const failed = p.stops.filter((s) => s.status === "failed").length;
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
          style={{ background: STATUS_COLORS[p.status] ?? "#9CA3AF" }}
        >
          {p.status}
        </span>
        <span className="font-semibold text-zinc-900">{p.senderName}</span>
        <span className="text-sm text-zinc-500">
          → {p.driverName ?? "unassigned"}
        </span>
        <span className="ml-auto font-bold text-zinc-900">
          R{p.fare.toFixed(0)}
        </span>
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        {p.stops.length} drop-off{p.stops.length === 1 ? "" : "s"} ·{" "}
        {delivered} delivered{failed ? ` · ${failed} failed` : ""} ·{" "}
        {p.distanceKm.toFixed(1)} km · {p.paymentMethod} ({p.paymentStatus})
      </p>
      <p className="mt-1 text-xs text-zinc-400">From {p.pickupAddress}</p>

      {/* Stops + POD audit */}
      <ul className="mt-3 space-y-2">
        {p.stops.map((s, i) => (
          <li
            key={i}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-100 px-3 py-2 text-sm"
          >
            <span className="font-semibold text-zinc-700">{i + 1}.</span>
            <span className="text-zinc-900">{s.recipientName}</span>
            <span className="text-zinc-400">· {s.size}</span>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{
                background:
                  s.status === "delivered"
                    ? "#DCFCE7"
                    : s.status === "failed"
                      ? "#FEE2E2"
                      : "#F3F4F6",
                color:
                  s.status === "delivered"
                    ? "#15803D"
                    : s.status === "failed"
                      ? "#B91C1C"
                      : "#6B7280",
              }}
            >
              {s.status}
            </span>
            {s.failReason && (
              <span className="text-xs text-rose-600">{s.failReason}</span>
            )}
            <span className="ml-auto flex items-center gap-3">
              {s.receivedBy && (
                <span className="text-xs text-zinc-500">
                  by {s.receivedBy}
                </span>
              )}
              {s.podPhotoUrl && (
                <a
                  href={s.podPhotoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold"
                  style={{ color: GREEN }}
                >
                  Photo
                </a>
              )}
              {s.podSignatureUrl && (
                <a
                  href={s.podSignatureUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold"
                  style={{ color: GREEN }}
                >
                  Signature
                </a>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PField({
  label,
  name,
  value,
}: {
  label: string;
  name: string;
  value: number;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-semibold text-zinc-500">
        {label}
      </span>
      <input
        name={name}
        type="number"
        step="0.01"
        min="0"
        defaultValue={value}
        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
        required
      />
    </label>
  );
}
