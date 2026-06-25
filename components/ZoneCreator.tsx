"use client";

import dynamic from "next/dynamic";
import type { ZoneLite } from "./ZoneMapPicker";

// Leaflet touches `window`, so the picker is client-only.
const ZoneMapPicker = dynamic(() => import("./ZoneMapPicker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-zinc-50 text-sm text-zinc-500">
      Loading map…
    </div>
  ),
});

export default function ZoneCreator({ zones }: { zones: ZoneLite[] }) {
  return <ZoneMapPicker zones={zones} />;
}
