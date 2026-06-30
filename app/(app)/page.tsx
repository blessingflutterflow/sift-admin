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
      <div className="hidden items-center justify-between border-b border-line bg-lifted px-8 py-5 md:flex">
        <div>
          <span className="eyebrow mb-1.5">Operations</span>
          <h1 className="text-2xl font-extrabold tracking-tighter text-ink">
            Live map
          </h1>
          <p className="mt-1 text-sm font-medium text-slate">
            Online drivers, updating every few seconds
          </p>
        </div>
        <span className="flex items-center gap-2 rounded-full bg-good-soft px-3.5 py-1.5 text-sm font-bold text-good">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-good opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-good" />
          </span>
          Live
        </span>
      </div>
      <div className="flex-1">
        <DriversMap />
      </div>
    </div>
  );
}
