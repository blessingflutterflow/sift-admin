import Link from "next/link";
import { ledgerAdjustAction, refundAction } from "@/app/actions";
import {
  listDriverBalances,
  listTransactions,
} from "@/lib/finance";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const [balances, txns] = await Promise.all([
    listDriverBalances(),
    listTransactions(),
  ]);
  const owedTotal = balances.reduce((s, b) => s + Math.max(0, b.balance), 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">
          Finance
        </h1>
        <p className="text-sm text-zinc-500">
          Driver balances · R{owedTotal.toFixed(0)} cash commission outstanding
        </p>
      </div>

      {/* Driver balances */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-5 py-3 text-sm font-bold text-zinc-900">
          Driver ledgers
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Driver</th>
                <th className="px-5 py-3 font-semibold">Payout</th>
                <th className="px-5 py-3 text-right font-semibold">Owes Sift</th>
                <th className="px-5 py-3 font-semibold">Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {balances.map((b) => (
                <tr key={b.uid} className="hover:bg-zinc-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-zinc-900">{b.name}</p>
                    <p className="text-xs text-zinc-400">{b.phone}</p>
                  </td>
                  <td className="px-5 py-3">
                    {b.subaccountCode ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        bank linked
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                        no bank
                      </span>
                    )}
                  </td>
                  <td
                    className={`px-5 py-3 text-right font-bold ${
                      b.balance > 0 ? "text-rose-600" : "text-zinc-900"
                    }`}
                  >
                    R{b.balance.toFixed(2)}
                  </td>
                  <td className="px-5 py-3">
                    <form
                      action={ledgerAdjustAction}
                      className="flex items-center gap-2"
                    >
                      <input type="hidden" name="uid" value={b.uid} />
                      <input
                        name="amount"
                        type="number"
                        step="0.01"
                        placeholder="±R"
                        className="w-20 rounded-lg border border-zinc-200 px-2 py-1.5 text-xs"
                        required
                      />
                      <input
                        name="note"
                        placeholder="note"
                        className="w-28 rounded-lg border border-zinc-200 px-2 py-1.5 text-xs"
                      />
                      <button className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
                        Apply
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {balances.length === 0 && (
          <div className="p-8 text-center text-sm text-zinc-500">
            No driver ledgers yet — they appear after the first trip.
          </div>
        )}
      </div>

      {/* Transactions */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-5 py-3 text-sm font-bold text-zinc-900">
          Paystack transactions
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-3 font-semibold">When</th>
                <th className="px-5 py-3 font-semibold">Reference</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 text-right font-semibold">Amount</th>
                <th className="px-5 py-3 text-right font-semibold">Commission</th>
                <th className="px-5 py-3 font-semibold">Refund</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {txns.map((t) => (
                <tr key={t.reference} className="hover:bg-zinc-50">
                  <td className="whitespace-nowrap px-5 py-3 text-zinc-500">
                    {t.createdAt
                      ? t.createdAt.toLocaleString("en-ZA", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td className="px-5 py-3">
                    {t.rideId ? (
                      <Link
                        href={`/rides/${t.rideId}`}
                        className="font-mono text-xs text-zinc-600 underline-offset-2 hover:underline"
                      >
                        {t.reference}
                      </Link>
                    ) : (
                      <span className="font-mono text-xs text-zinc-500">
                        {t.reference}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-zinc-600">{t.type}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-zinc-900">
                    R{t.amount.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right text-zinc-600">
                    {t.commission != null ? `R${t.commission.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-5 py-3">
                    {t.refundStatus ? (
                      <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-600">
                        {t.refundStatus}
                      </span>
                    ) : (
                      <form action={refundAction}>
                        <input
                          type="hidden"
                          name="reference"
                          value={t.reference}
                        />
                        <button className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-semibold text-zinc-600 hover:bg-rose-50 hover:text-rose-600">
                          Refund
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {txns.length === 0 && (
          <div className="p-8 text-center text-sm text-zinc-500">
            No transactions yet.
          </div>
        )}
      </div>
    </div>
  );
}
