"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ASSET_STATUSES,
  STATUS_META,
  CRITICALITY_LEVELS,
  CRITICALITY_META,
  LIFECYCLE_STAGES,
  LIFECYCLE_META,
} from "@/lib/constants";
import type { MapAsset } from "./asset-map";

type DepartmentOption = {
  id: string;
  name: string;
  categories: { id: string; name: string }[];
};

// Base UI's Select treats an empty-string value as "no selection", which
// conveniently means the trigger falls back to its placeholder (set to the
// same "All ..." label) — so "" doubles as the "All" sentinel with no extra
// state needed. Same pattern as src/components/assets/assets-filter-bar.tsx.
export function MapControls({
  search,
  onSearchChange,
  department,
  onDepartmentChange,
  category,
  onCategoryChange,
  status,
  onStatusChange,
  criticality,
  onCriticalityChange,
  lifecycleStage,
  onLifecycleStageChange,
  zone,
  onZoneChange,
  departments,
  shownCount,
  totalCount,
  searchResults,
  onSelectResult,
  onClear,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  department: string;
  onDepartmentChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  criticality: string;
  onCriticalityChange: (value: string) => void;
  lifecycleStage: string;
  onLifecycleStageChange: (value: string) => void;
  zone: string;
  onZoneChange: (value: string) => void;
  departments: DepartmentOption[];
  shownCount: number;
  totalCount: number;
  searchResults: MapAsset[];
  onSelectResult: (assetId: string) => void;
  onClear: () => void;
}) {
  const allCategories = departments.flatMap((d) => d.categories);
  const visibleResults = search.trim() ? searchResults.slice(0, 6) : [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by code, name, or address…"
            className="pl-8"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {search.trim() && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {visibleResults.length > 0 && (
            <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md">
              {visibleResults.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onSelectResult(a.id)}
                  className="flex w-full flex-col items-start gap-0.5 px-2.5 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <span className="font-medium">
                    {a.name} <span className="font-normal text-muted-foreground">({a.assetCode})</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{a.departmentName}</span>
                </button>
              ))}
              {searchResults.length > visibleResults.length && (
                <p className="border-t px-2.5 py-1 text-xs text-muted-foreground">
                  +{searchResults.length - visibleResults.length} more match{searchResults.length - visibleResults.length === 1 ? "" : "es"}
                </p>
              )}
            </div>
          )}
        </div>

        <Select value={department} onValueChange={(value) => onDepartmentChange(value as string)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={(value) => onCategoryChange(value as string)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All categories</SelectItem>
            {allCategories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(value) => onStatusChange(value as string)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            {ASSET_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_META[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={criticality} onValueChange={(value) => onCriticalityChange(value as string)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All criticality" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All criticality</SelectItem>
            {CRITICALITY_LEVELS.map((c) => (
              <SelectItem key={c} value={c}>
                {CRITICALITY_META[c].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={lifecycleStage} onValueChange={(value) => onLifecycleStageChange(value as string)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All lifecycle stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All lifecycle stages</SelectItem>
            {LIFECYCLE_STAGES.map((l) => (
              <SelectItem key={l} value={l}>
                {LIFECYCLE_META[l].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Zone"
          value={zone}
          onChange={(e) => onZoneChange(e.target.value)}
          className="w-full sm:w-28"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {shownCount} of {totalCount} assets shown
        </p>
        <Button variant="outline" size="sm" onClick={onClear}>
          <X className="h-4 w-4" />
          Clear filters
        </Button>
      </div>
    </div>
  );
}
