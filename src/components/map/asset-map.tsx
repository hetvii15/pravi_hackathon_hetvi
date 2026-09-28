"use client";

import { MapContainer, TileLayer } from "react-leaflet";

// Ahmedabad/Gandhinagar region — matches the seed data's geography.
const DEFAULT_CENTER: [number, number] = [23.05, 72.55];
const DEFAULT_ZOOM = 11;

export function AssetMap() {
  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* Asset markers render here once the database layer provides live coordinates. */}
    </MapContainer>
  );
}
