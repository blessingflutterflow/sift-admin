import Link from "next/link";
import { getDriverLocation } from "@/lib/drivers";

export const dynamic = "force-dynamic";

const GREEN = "#FF6B2C";

export default async function DriverDetailPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;
  const driver = await getDriverLocation(uid);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5 flex items-center gap-3">
        <Link
          href="/"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          ← Live map
        </Link>
        <h1 className="text-lg font-bold tracking-tight text-zinc-900">Driver</h1>
      </div>

      <div
        className="mb-6 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white"
        style={{ background: GREEN }}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
        </span>
        Admin in control — you are monitoring this driver live.
      </div>

      {!driver ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
          This driver isn’t sharing a location right now (offline).
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-lg font-bold text-zinc-500">
                {driver.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-semibold">{driver.name}</h2>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{ background: "#FFE7D6", color: "#E2551C" }}
                >
                  Online
                </span>
              </div>
            </div>

            <dl className="mt-5 space-y-3 text-sm">
              <Row label="Vehicle" value={driver.vehicle ?? "—"} />
              <Row label="Latitude" value={driver.lat.toFixed(5)} />
              <Row label="Longitude" value={driver.lng.toFixed(5)} />
              <Row
                label="Last update"
                value={
                  driver.updatedAt
                    ? new Date(driver.updatedAt).toLocaleTimeString()
                    : "—"
                }
              />
            </dl>

            <div className="mt-6 flex flex-col gap-2">
              <button
                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
                style={{ background: GREEN }}
              >
                Message driver
              </button>
              <button className="rounded-lg border border-rose-300 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50">
                Suspend driver
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <iframe
              title="Driver location"
              className="h-[420px] w-full"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${driver.lng - 0.008}%2C${driver.lat - 0.006}%2C${driver.lng + 0.008}%2C${driver.lat + 0.006}&layer=mapnik&marker=${driver.lat}%2C${driver.lng}`}
            />
          </div>
        </div>
      )}
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
