import { savePricingAction } from "@/app/actions";
import { loadPricing } from "@/lib/finance";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const p = await loadPricing();

  return (
    <div className="mx-auto max-w-2xl px-4 py-7 sm:px-8 sm:py-10">
      <PageHeader
        eyebrow="Configuration"
        icon="pricing"
        title="Pricing"
        subtitle="Live config — the very next quote uses these numbers. Changes are audited."
      />

      <form
        action={savePricingAction}
        className="rounded-3xl border border-line bg-lifted p-7 shadow-soft"
      >
        <h2 className="mb-3 text-sm font-bold text-zinc-900">Fare (ZAR)</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Base fare" name="fareBase" value={p.fareBase} />
          <Field label="Per km" name="farePerKm" value={p.farePerKm} />
        </div>

        <h2 className="mb-3 mt-6 text-sm font-bold text-zinc-900">
          Tier multipliers
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Sift Bike"
            name="multBike"
            value={p.tierMultipliers.bike ?? 0.7}
          />
          <Field label="Sift Go" name="multGo" value={p.tierMultipliers.go} />
          <Field label="Sift XL" name="multXl" value={p.tierMultipliers.xl} />
          <Field label="Sift Max" name="multMax" value={p.tierMultipliers.max} />
        </div>

        <h2 className="mb-3 mt-6 text-sm font-bold text-zinc-900">
          Commission & fees
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Commission (%)"
            name="commissionPctPercent"
            value={Math.round(p.commissionPct * 100)}
          />
          <Field label="Cancel fee (R)" name="cancelFee" value={p.cancelFee} />
          <Field
            label="Free waiting (min)"
            name="waitFreeMin"
            value={p.waitFreeMin}
          />
          <Field
            label="Waiting (R/min after)"
            name="waitPerMin"
            value={p.waitPerMin}
          />
          <Field
            label="Cash-debt cap (R)"
            name="cashDebtCapZar"
            value={p.cashDebtCapZar}
          />
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              name="cashEnabled"
              defaultChecked={p.cashEnabled}
              className="h-4 w-4"
            />
            Cash trips enabled
          </label>
        </div>

        <h2 className="mb-3 mt-6 text-sm font-bold text-zinc-900">Surge</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="City-wide surge (×)"
            name="surgeMultiplier"
            value={p.surgeMultiplier ?? 1}
          />
        </div>
        <p className="mt-2 text-xs text-zinc-400">
          Applied when no zone covers the pickup. 1.0 = no surge. Per-area surge
          is managed under Surge zones.
        </p>

        <h2 className="mb-3 mt-6 text-sm font-bold text-zinc-900">Dispatch</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Max ride distance (km)"
            name="dispatchRadiusKm"
            value={p.dispatchRadiusKm ?? 20}
          />
        </div>
        <p className="mt-2 text-xs text-zinc-400">
          How far from the pickup a request is offered to drivers. Beyond this,
          a rider gets &ldquo;no drivers available.&rdquo;
        </p>

        <button
          className="mt-7 w-full rounded-xl px-4 py-3 text-sm font-bold text-white"
          style={{ background: "#FF6B2C" }}
        >
          Save pricing
        </button>
      </form>
    </div>
  );
}

function Field({
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
        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
        required
      />
    </label>
  );
}
