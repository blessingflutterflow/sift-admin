import Link from "next/link";
import { notFound } from "next/navigation";
import {
  toggleBlockAction,
  setDriverCategoryAction,
  setDocExpiryAction,
} from "@/app/actions";
import { getUserProfile } from "@/lib/users";
import {
  expiryStatus,
  worstExpiry,
  DOC_LABELS,
  type ExpiryStatus,
} from "@/lib/docExpiry";

export const dynamic = "force-dynamic";
const GREEN = "#FF6B2C";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;
  const p = await getUserProfile(uid);
  if (!p) notFound();

  const isDriver = p.role === "driver";
  const docs = Object.entries(p.documents);
  const photo = p.documents.photo;
  const worst = worstExpiry(p.docExpiry);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5 flex items-center gap-3">
        <Link
          href="/users"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          ← Users
        </Link>
        <h1 className="text-lg font-bold tracking-tight text-zinc-900">Profile</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_1.3fr]">
        {/* Identity card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-4">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt={p.name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-2xl font-bold text-zinc-500">
                {(p.name || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-zinc-900">
                {p.name || "Unnamed"}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Pill className="bg-violet-50 capitalize text-violet-700">{p.role}</Pill>
                {p.online && <Pill className="bg-emerald-50 text-emerald-700">online</Pill>}
                {p.blocked && <Pill className="bg-rose-50 text-rose-600">blocked</Pill>}
                {p.verificationStatus && (
                  <Pill className="bg-amber-50 text-amber-700">
                    ID: {p.verificationStatus}
                  </Pill>
                )}
                {worst === "expired" && (
                  <Pill className="bg-rose-50 text-rose-600">Docs expired</Pill>
                )}
                {worst === "soon" && (
                  <Pill className="bg-amber-50 text-amber-700">
                    Docs expiring
                  </Pill>
                )}
              </div>
            </div>
          </div>

          <dl className="mt-5 space-y-3 text-sm">
            <Row label="Phone" value={p.phone || "—"} />
            <Row label="Email" value={p.email || "—"} />
            <Row label="Status" value={p.status} />
            {isDriver && (
              <Row
                label="Rating"
                value={
                  p.ratingAvg != null
                    ? `★ ${p.ratingAvg.toFixed(2)} (${p.ratingCount})`
                    : "No ratings yet"
                }
              />
            )}
            <Row
              label="Last seen"
              value={p.lastSeen ? new Date(p.lastSeen).toLocaleString() : "—"}
            />
          </dl>

          <form action={toggleBlockAction} className="mt-6">
            <input type="hidden" name="uid" value={p.uid} />
            <input type="hidden" name="block" value={String(!p.blocked)} />
            <button
              className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold ${
                p.blocked
                  ? "text-white"
                  : "border border-rose-300 text-rose-600 hover:bg-rose-50"
              }`}
              style={p.blocked ? { background: GREEN } : undefined}
            >
              {p.blocked ? "Unblock user" : "Block user"}
            </button>
          </form>
        </div>

        {/* Vehicle + documents (drivers) */}
        <div className="space-y-6">
          {isDriver && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <h3 className="mb-3 text-sm font-bold text-zinc-900">Vehicle</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                <Field label="Make" value={p.vehicle.make} />
                <Field label="Model" value={p.vehicle.model} />
                <Field label="Year" value={p.vehicle.year} />
                <Field label="Colour" value={p.vehicle.color} />
                <Field label="Plate" value={p.vehicle.plate} />
              </div>
            </div>
          )}

          {isDriver && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <h3 className="mb-1 text-sm font-bold text-zinc-900">
                Service category
              </h3>
              <p className="mb-3 text-xs text-zinc-500">
                The driver only receives requests for this category. &ldquo;Any&rdquo;
                = receives everything.
              </p>
              <form action={setDriverCategoryAction} className="flex gap-2">
                <input type="hidden" name="uid" value={p.uid} />
                <select
                  name="category"
                  defaultValue={p.category ?? ""}
                  className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
                >
                  <option value="">Any (all requests)</option>
                  <option value="bike">Sift Bike</option>
                  <option value="go">Sift Go</option>
                  <option value="xl">Sift XL</option>
                  <option value="max">Sift Premium</option>
                  <option value="parcel">Parcel delivery</option>
                </select>
                <button
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                  style={{ background: GREEN }}
                >
                  Save
                </button>
              </form>
            </div>
          )}

          {isDriver && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <h3 className="mb-1 text-sm font-bold text-zinc-900">
                Document expiry
              </h3>
              <p className="mb-3 text-xs text-zinc-500">
                Set each document&apos;s expiry date — drivers nearing or past
                expiry are flagged.
              </p>
              <form action={setDocExpiryAction} className="space-y-3">
                <input type="hidden" name="uid" value={p.uid} />
                {(["license", "prdp", "insurance"] as const).map((k) => (
                  <div key={k} className="flex items-center gap-3">
                    <label className="w-32 shrink-0 text-sm text-zinc-700">
                      {DOC_LABELS[k]}
                    </label>
                    <input
                      type="date"
                      name={k}
                      defaultValue={p.docExpiry[k] ?? ""}
                      className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
                    />
                    <ExpiryBadge status={expiryStatus(p.docExpiry[k])} />
                  </div>
                ))}
                <button
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                  style={{ background: GREEN }}
                >
                  Save expiry dates
                </button>
              </form>
            </div>
          )}

          {docs.length > 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <h3 className="mb-3 text-sm font-bold text-zinc-900">
                Documents &amp; photos
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {docs.map(([type, url]) => (
                  <a
                    key={type}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="group block overflow-hidden rounded-xl border border-zinc-200 hover:border-zinc-400"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={type}
                      className="h-28 w-full bg-zinc-50 object-cover"
                    />
                    <span className="block px-2 py-1.5 text-xs font-medium capitalize text-zinc-600">
                      {type.replace(/_/g, " ")}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            isDriver && (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500">
                No documents on file.
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-zinc-100 pb-2">
      <dt className="text-zinc-400">{label}</dt>
      <dd className="font-medium text-zinc-800">{value}</dd>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <span className="text-zinc-400">{label}: </span>
      <span className="font-medium text-zinc-800">{value || "—"}</span>
    </div>
  );
}

function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

function ExpiryBadge({ status }: { status: ExpiryStatus }) {
  if (status === "none") return <span className="text-xs text-zinc-400">—</span>;
  const map: Record<string, [string, string]> = {
    valid: ["bg-emerald-50 text-emerald-700", "valid"],
    soon: ["bg-amber-50 text-amber-700", "expiring soon"],
    expired: ["bg-rose-50 text-rose-600", "EXPIRED"],
  };
  const [cls, label] = map[status];
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}
