"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window`, so the map is client-only.
const DriversMap = dynamic(() => import("@/components/DriversMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-zinc-500">
      Loading live map…
    </div>
  ),
});

export default function MapPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="hidden items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 md:flex">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-900">
            Live map
          </h1>
          <p className="text-xs text-zinc-500">
            Online drivers, updating every few seconds
          </p>
        </div>
      </div>
      <div className="flex-1">
        <DriversMap />
      </div>
    </div>
  );
}
