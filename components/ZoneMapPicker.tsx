"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  createZoneAction,
  toggleZoneAction,
  deleteZoneAction,
} from "@/app/actions";

const GREEN = "#FF6B2C";
const JHB: [number, number] = [-26.2041, 28.0473];

export type ZoneLite = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusKm: number;
  surgeMultiplier: number;
  active: boolean;
};

const centerIcon = L.divIcon({
  className: "",
  html: `<div style="width:20px;height:20px;border-radius:50%;background:${GREEN};
    border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function ClickToPlace({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function ZoneMapPicker({ zones }: { zones: ZoneLite[] }) {
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [radiusKm, setRadiusKm] = useState(3);

  const mapCenter: [number, number] =
    zones.length > 0 ? [zones[0].lat, zones[0].lng] : JHB;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={mapCenter}
        zoom={11}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <ClickToPlace onPick={(lat, lng) => setCenter([lat, lng])} />

        {/* Existing zones for context */}
        {zones.map((z) => (
          <Circle
            key={z.id}
            center={[z.lat, z.lng]}
            radius={z.radiusKm * 1000}
            pathOptions={{
              color: z.active ? "#6B7280" : "#D1D5DB",
              fillColor: "#9CA3AF",
              fillOpacity: 0.08,
              weight: 1,
            }}
          />
        ))}

        {/* The zone being created */}
        {center && (
          <>
            <Marker position={center} icon={centerIcon} />
            <Circle
              center={center}
              radius={radiusKm * 1000}
              pathOptions={{
                color: GREEN,
                fillColor: GREEN,
                fillOpacity: 0.15,
                weight: 2,
              }}
            />
          </>
        )}
      </MapContainer>

      {/* Floating control panel over the full-screen map */}
      <div className="absolute right-3 top-3 z-[1200] flex max-h-[calc(100%-1.5rem)] w-[330px] max-w-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
        <div className="overflow-y-auto p-4">
          {/* Create */}
          <h2 className="text-sm font-bold text-zinc-900">Add a zone</h2>
          <p className="mb-3 mt-0.5 text-xs text-zinc-500">
            Click the map to drop the center, then set the radius.
          </p>

          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between text-xs font-semibold text-zinc-500">
              <span>Radius</span>
              <span className="text-zinc-900">{radiusKm.toFixed(1)} km</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={20}
              step={0.5}
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full accent-orange-500"
            />
          </div>

          <form action={createZoneAction}>
            <input type="hidden" name="lat" value={center?.[0] ?? ""} readOnly />
            <input type="hidden" name="lng" value={center?.[1] ?? ""} readOnly />
            <input type="hidden" name="radiusKm" value={radiusKm} readOnly />
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold text-zinc-500">
                  Name
                </span>
                <input
                  name="name"
                  type="text"
                  placeholder="CBD"
                  required
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold text-zinc-500">
                  Surge (×)
                </span>
                <input
                  name="surgeMultiplier"
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="5"
                  placeholder="1.5"
                  required
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
                />
              </label>
            </div>
            <button
              disabled={!center}
              className="mt-3 w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: GREEN }}
            >
              {center ? "Add zone" : "Click the map first"}
            </button>
          </form>

          {/* Existing zones */}
          {zones.length > 0 && (
            <div className="mt-4 border-t border-zinc-100 pt-3">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-400">
                Zones ({zones.length})
              </h3>
              <ul className="space-y-2">
                {zones.map((z) => (
                  <li
                    key={z.id}
                    className="flex items-center gap-2 rounded-lg border border-zinc-100 px-2.5 py-2"
                  >
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-bold text-white"
                      style={{ background: z.active ? GREEN : "#A1A1AA" }}
                    >
                      {z.surgeMultiplier}×
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-900">
                        {z.name}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {z.radiusKm} km {z.active ? "" : "· disabled"}
                      </p>
                    </div>
                    <form action={toggleZoneAction}>
                      <input type="hidden" name="id" value={z.id} />
                      <input
                        type="hidden"
                        name="active"
                        value={(!z.active).toString()}
                      />
                      <button
                        className="rounded-md border border-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50"
                        title={z.active ? "Disable" : "Enable"}
                      >
                        {z.active ? "Off" : "On"}
                      </button>
                    </form>
                    <form action={deleteZoneAction}>
                      <input type="hidden" name="id" value={z.id} />
                      <button
                        className="rounded-md border border-rose-200 px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
