import { reviewVerificationAction } from "@/app/actions";
import { loadPendingVerifications } from "@/lib/verifications";

export const dynamic = "force-dynamic";

const GREEN = "#FF6B2C";

export default async function VerificationsPage() {
  const rows = await loadPendingVerifications();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">
          Rider verifications
        </h1>
        <p className="text-sm text-zinc-500">
          Borderline face-matches that need a human check. Compare the ID to the
          selfie, then approve or reject.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
          Nothing to review — no riders are pending.
        </p>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <div
              key={r.uid}
              className="rounded-2xl border border-zinc-200 bg-white p-4"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="font-semibold text-zinc-900">{r.name}</span>
                <span className="text-sm text-zinc-500">{r.phone}</span>
                <span
                  className="ml-auto rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
                  style={{ background: GREEN }}
                >
                  {r.score.toFixed(0)}% match
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Photo label="ID" url={r.idUrl} />
                <Photo label="Selfie" url={r.selfieUrl} />
              </div>

              <div className="mt-4 flex gap-3">
                <form action={reviewVerificationAction} className="flex-1">
                  <input type="hidden" name="uid" value={r.uid} />
                  <input type="hidden" name="decision" value="rejected" />
                  <button className="w-full rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50">
                    Reject
                  </button>
                </form>
                <form action={reviewVerificationAction} className="flex-1">
                  <input type="hidden" name="uid" value={r.uid} />
                  <input type="hidden" name="decision" value="approved" />
                  <button
                    className="w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white"
                    style={{ background: GREEN }}
                  >
                    Approve
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Photo({ label, url }: { label: string; url: string | null }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-zinc-500">{label}</p>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={label}
          className="h-56 w-full rounded-lg border border-zinc-200 object-cover"
        />
      ) : (
        <div className="flex h-56 w-full items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-400">
          No image
        </div>
      )}
    </div>
  );
}
