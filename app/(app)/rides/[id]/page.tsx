import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelRideAction, refundAction } from "@/app/actions";
import { transactionsForRide } from "@/lib/finance";
import { ACTIVE_STATUSES, getRide } from "@/lib/rides";
import { PaymentBadge, RideStatusBadge } from "../page";

export const dynamic = "force-dynamic";

export default async function RideDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ride = await getRide(id);
  if (!ride) notFound();
  const txns = await transactionsForRide(id);
  const active = ACTIVE_STATUSES.includes(ride.status);
  const paidTxn = txns.find((t) => t.status === "success" && !t.refundStatus);

  const timeline: [string, Date | null][] = [
    ["Requested", ride.createdAt],
    ["Accepted", ride.acceptedAt],
    ["Arrived", ride.arrivedAt],
    ["Started", ride.startedAt],
    ["Completed", ride.completedAt],
    ["Paid", ride.paidAt],
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <Link href="/rides" className="text-sm text-zinc-500 hover:text-zinc-900">
        ← Rides
      </Link>
      <div className="mb-6 mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">
          {ride.destLabel || "Ride"}
        </h1>
        <RideStatusBadge status={ride.status} />
        <PaymentBadge r={ride} />
        {ride.cancelledBy && (
          <span className="text-xs text-zinc-400">
            cancelled by {ride.cancelledBy}
          </span>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Trip */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-bold text-zinc-900">Trip</h2>
          <Row k="Pickup" v={ride.pickupAddress || "—"} />
          <Row k="Destination" v={ride.destLabel || "—"} />
          <Row k="Distance" v={`${ride.distanceKm.toFixed(1)} km`} />
          <Row k="Tier" v={ride.tierName || "—"} />
          <Row k="Rider" v={`${ride.riderName} · ${ride.riderPhone}`} />
          <Row
            k="Driver"
            v={
              ride.driverName
                ? `${ride.driverName} · ${ride.driverVehicle ?? ""}`
                : "—"
            }
          />
        </section>

        {/* Money */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-bold text-zinc-900">Money</h2>
          <Row k="Quoted fare" v={`R${ride.fare.toFixed(2)}`} />
          {ride.waitFee != null && ride.waitFee > 0 && (
            <Row k="Waiting fee" v={`R${ride.waitFee.toFixed(2)}`} />
          )}
          {ride.finalFare != null && (
            <Row k="Final fare" v={`R${ride.finalFare.toFixed(2)}`} bold />
          )}
          {ride.commission != null && (
            <Row k="Sift commission" v={`R${ride.commission.toFixed(2)}`} />
          )}
          {ride.driverEarning != null && (
            <Row k="Driver earning" v={`R${ride.driverEarning.toFixed(2)}`} />
          )}
          <Row k="Method" v={ride.paymentMethod} />
          <Row k="Payment status" v={ride.paymentStatus} />

          {txns.length > 0 && (
            <div className="mt-4 border-t border-zinc-100 pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Paystack
              </p>
              {txns.map((t) => (
                <div
                  key={t.reference}
                  className="flex items-center justify-between py-1 text-sm"
                >
                  <span className="truncate font-mono text-xs text-zinc-500">
                    {t.reference}
                  </span>
                  <span className="ml-3 whitespace-nowrap text-zinc-700">
                    R{t.amount.toFixed(2)}
                    {t.refundStatus ? ` · ${t.refundStatus}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Timeline */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-bold text-zinc-900">Timeline</h2>
          {timeline.map(([label, at]) => (
            <div
              key={label}
              className="flex items-center justify-between py-1.5 text-sm"
            >
              <span className={at ? "text-zinc-900" : "text-zinc-300"}>
                {label}
              </span>
              <span className={at ? "text-zinc-500" : "text-zinc-300"}>
                {at
                  ? at.toLocaleString("en-ZA", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "—"}
              </span>
            </div>
          ))}
        </section>

        {/* Actions */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-bold text-zinc-900">Actions</h2>
          {active ? (
            <form action={cancelRideAction}>
              <input type="hidden" name="rideId" value={ride.id} />
              <button className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
                Force-cancel this ride
              </button>
              <p className="mt-2 text-xs text-zinc-400">
                Both parties are notified. Use for stuck or abusive trips.
              </p>
            </form>
          ) : paidTxn ? (
            <form action={refundAction}>
              <input type="hidden" name="reference" value={paidTxn.reference} />
              <button className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50">
                Refund R{paidTxn.amount.toFixed(2)}
              </button>
              <p className="mt-2 text-xs text-zinc-400">
                Full refund via Paystack; the webhook records the outcome.
              </p>
            </form>
          ) : (
            <p className="text-sm text-zinc-400">
              No actions available for this ride.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="text-zinc-500">{k}</span>
      <span
        className={`text-right ${bold ? "font-bold text-zinc-900" : "text-zinc-700"}`}
      >
        {v}
      </span>
    </div>
  );
}
