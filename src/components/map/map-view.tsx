"use client";

import { useMemo, useState } from "react";
import { AssetMapLoader } from "./asset-map-loader";
import { MapControls } from "./map-controls";
import type { MapAsset } from "./asset-map";

type DepartmentOption = {
  id: string;
  name: string;
  categories: { id: string; name: string }[];
};

export function MapView({
  assets,
  departments,
}: {
  assets: MapAsset[];
  departments: DepartmentOption[];
}) {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [criticality, setCriticality] = useState("");
  const [lifecycleStage, setLifecycleStage] = useState("");
  const [zone, setZone] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  const filteredAssets = useMemo(() => {
    const q = search.trim().toLowerCase();
    const z = zone.trim().toLowerCase();
    return assets.filter((a) => {
      if (department && a.departmentId !== department) return false;
      if (category && a.categoryId !== category) return false;
      if (status && a.status !== status) return false;
      if (criticality && a.criticality !== criticality) return false;
      if (lifecycleStage && a.lifecycleStage !== lifecycleStage) return false;
      if (z) {
        const assetZone = (a.zone ?? "").toLowerCase();
        if (!assetZone.includes(z)) return false;
      }
      if (q) {
        const matches =
          a.assetCode.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          (a.address ?? "").toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [assets, department, category, status, criticality, lifecycleStage, zone, search]);

  function handleClear() {
    setSearch("");
    setDepartment("");
    setCategory("");
    setStatus("");
    setCriticality("");
    setLifecycleStage("");
    setZone("");
    setSelectedAssetId(null);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b p-3">
        <MapControls
          search={search}
          onSearchChange={setSearch}
          department={department}
          onDepartmentChange={setDepartment}
          category={category}
          onCategoryChange={setCategory}
          status={status}
          onStatusChange={setStatus}
          criticality={criticality}
          onCriticalityChange={setCriticality}
          lifecycleStage={lifecycleStage}
          onLifecycleStageChange={setLifecycleStage}
          zone={zone}
          onZoneChange={setZone}
          departments={departments}
          shownCount={filteredAssets.length}
          totalCount={assets.length}
          searchResults={filteredAssets}
          onSelectResult={setSelectedAssetId}
          onClear={handleClear}
        />
      </div>
      <div className="min-h-0 flex-1">
        <AssetMapLoader assets={filteredAssets} selectedAssetId={selectedAssetId} />
      </div>
    </div>
  );
}
