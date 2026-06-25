import { getAdminDb } from "@/lib/firebaseAdmin";
import { loadPricing } from "@/lib/finance";
import ZoneCreator from "@/components/ZoneCreator";

export const dynamic = "force-dynamic";

const GREEN = "#FF6B2C";

type Zone = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusKm: number;
  surgeMultiplier: number;
  active: boolean;
};

async function loadZones(): Promise<Zone[]> {
  const snap = await getAdminDb().collection("zones").get();
  return snap.docs
    .map((d) => {
      const x = d.data();
      // Plain, serializable shape for the client map (drop Timestamps).
      return {
        id: d.id,
        name: String(x.name ?? ""),
        lat: Number(x.lat ?? 0),
        lng: Number(x.lng ?? 0),
        radiusKm: Number(x.radiusKm ?? 0),
        surgeMultiplier: Number(x.surgeMultiplier ?? 1),
        active: x.active !== false,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default async function ZonesPage() {
  const [zones, pricing] = await Promise.all([loadZones(), loadPricing()]);

  const cityRaw = pricing.surgeMultiplier ?? 1;
  const city = Math.min(5, Math.max(0.5, cityRaw));
  const activeZones = zones.filter((z) => z.active);
  // Anything above 1× is actively raising fares right now.
  const surging =
    city > 1 || activeZones.some((z) => z.surgeMultiplier > 1);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-900">
            Surge zones
          </h1>
          <p className="text-xs text-zinc-500">
            Click the map to drop a zone center, set its radius and surge.
            Changes take effect on the next ride.
          </p>
        </div>

        {/* Live surge status — what riders are seeing right now. */}
        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 px-3 py-2">
          <span
            className="flex h-2.5 w-2.5 rounded-full"
            style={{ background: surging ? GREEN : "#22C55E" }}
            title={surging ? "Surge active" : "Normal pricing"}
          />
          <div className="text-xs">
            <span className="font-bold text-zinc-900">
              {surging ? "Surge live" : "Normal pricing"}
            </span>
            <span className="text-zinc-500">
              {" · "}City-wide {city.toFixed(1)}× ·{" "}
              {activeZones.length} active zone
              {activeZones.length === 1 ? "" : "s"}
              {activeZones.length > 0 &&
                ` (${activeZones
                  .map((z) => `${z.surgeMultiplier}×`)
                  .join(", ")})`}
            </span>
          </div>
        </div>
      </div>
      <div className="flex-1">
        <ZoneCreator zones={zones} />
      </div>
    </div>
  );
}
