"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { LogInspectionDialog } from "@/components/assets/log-inspection-dialog";
import { NewWorkOrderDialog } from "@/components/maintenance/new-work-order-dialog";

// Ahmedabad/Gandhinagar region — matches the seed data's geography.
const DEFAULT_CENTER: [number, number] = [23.05, 72.55];
const DEFAULT_ZOOM = 11;

export type MapAsset = {
  id: string;
  assetCode: string;
  name: string;
  latitude: number;
  longitude: number;
  status: string;
  conditionScore: number;
  criticality: string;
  riskScore: number;
  departmentName: string;
  description?: string | null;
  address?: string | null;
  zone?: string | null;
  lifecycleStage: string;
  departmentId: string;
  categoryId: string;
  categoryName: string;
};

// Same severity bands as conditionBand() in src/lib/constants.ts, expressed
// as literal hex values since Leaflet's pathOptions.color needs a real CSS
// color string rather than a Tailwind class.
function conditionColor(score: number): string {
  if (score >= 81) return "#059669"; // excellent
  if (score >= 61) return "#059669"; // good
  if (score >= 41) return "#d97706"; // fair
  if (score >= 21) return "#ea580c"; // poor
  return "#dc2626"; // critical
}

// Recenters the map on the selected asset (e.g. picked from a search result)
// without needing to change the MapContainer's own center/zoom state.
function FlyToSelected({
  assets,
  selectedAssetId,
}: {
  assets: MapAsset[];
  selectedAssetId?: string | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (!selectedAssetId) return;
    const target = assets.find((a) => a.id === selectedAssetId);
    if (target) map.flyTo([target.latitude, target.longitude], 15);
  }, [selectedAssetId, assets, map]);
  return null;
}

export function AssetMap({
  assets,
  selectedAssetId,
}: {
  assets: MapAsset[];
  selectedAssetId?: string | null;
}) {
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
      <FlyToSelected assets={assets} selectedAssetId={selectedAssetId} />
      {assets.map((a) => {
        const color = conditionColor(a.conditionScore);
        return (
          <CircleMarker
            key={a.id}
            center={[a.latitude, a.longitude]}
            radius={7}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.8, weight: 1 }}
          >
            <Popup>
              <div className="space-y-2 text-sm">
                <div className="space-y-1">
                  <p className="font-bold">
                    {a.name} <span className="font-normal text-muted-foreground">({a.assetCode})</span>
                  </p>
                  <p>{a.departmentName}</p>
                  <p>
                    {a.status} · Condition {a.conditionScore} · Risk {a.riskScore}
                  </p>
                  <a href={`/assets/${a.id}`} className="text-primary underline">
                    View details
                  </a>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <LogInspectionDialog assetId={a.id} />
                  <NewWorkOrderDialog assets={[{ id: a.id, assetCode: a.assetCode, name: a.name }]} />
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
