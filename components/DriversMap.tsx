"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";

type Driver = {
  uid: string;
  name: string;
  vehicle: string | null;
  lat: number;
  lng: number;
};

const JHB: [number, number] = [-26.2041, 28.0473];

const driverIcon = L.divIcon({
  className: "",
  html: `<div style="width:34px;height:34px;border-radius:50%;background:#FF6B2C;
    border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);
    display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;">🚗</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

export default function DriversMap() {
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch("/api/drivers", { cache: "no-store" });
        const json = await res.json();
        if (active) setDrivers(json.drivers ?? []);
      } catch {
        /* keep last known */
      }
    };
    load();
    const id = setInterval(load, 4000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const center: [number, number] =
    drivers.length > 0 ? [drivers[0].lat, drivers[0].lng] : JHB;

  return (
    <MapContainer center={center} zoom={11} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {drivers.map((d) => (
        <Marker key={d.uid} position={[d.lat, d.lng]} icon={driverIcon}>
          <Popup>
            <div style={{ minWidth: 140 }}>
              <strong>{d.name}</strong>
              <br />
              <span style={{ color: "#666" }}>{d.vehicle ?? "Driver"}</span>
              <br />
              <Link href={`/drivers/${d.uid}`} style={{ color: "#FF6B2C", fontWeight: 600 }}>
                Open details →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
