"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  ASSET_STATUSES,
  STATUS_META,
  CRITICALITY_LEVELS,
  CRITICALITY_META,
} from "@/lib/constants";

type DepartmentOption = {
  id: string;
  name: string;
  code: string;
  categories: { id: string; name: string }[];
};

type FilterQuery = {
  search?: string;
  department?: string;
  category?: string;
  status?: string;
  criticality?: string;
};

// Empty string is used as the sentinel "All ..." value — Base UI's Select
// treats an empty-string value as "no selection", which conveniently means
// the trigger falls back to showing its placeholder (which we set to the
// same "All ..." label), so no extra state is needed to track the sentinel.
export function AssetsFilterBar({
  departments,
  currentQuery,
}: {
  departments: DepartmentOption[];
  currentQuery: FilterQuery;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentQuery.search ?? "");

  function updateParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    params.set("page", "1");
    router.push(`/assets?${params.toString()}`);
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (search !== (currentQuery.search ?? "")) {
        updateParams({ search: search.trim() || undefined });
      }
    }, 400);
    return () => clearTimeout(timeout);
    // Only re-run when the local search text changes — this intentionally
    // does not depend on router/searchParams/currentQuery so it debounces
    // purely off keystrokes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const allCategories = departments.flatMap((d) => d.categories);

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by asset code or name…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select
          value={currentQuery.department ?? ""}
          onValueChange={(value) => updateParams({ department: (value as string) || undefined })}
        >
          <SelectTrigger className="w-full sm:w-48">
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

        <Select
          value={currentQuery.category ?? ""}
          onValueChange={(value) => updateParams({ category: (value as string) || undefined })}
        >
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

        <Select
          value={currentQuery.status ?? ""}
          onValueChange={(value) => updateParams({ status: (value as string) || undefined })}
        >
          <SelectTrigger className="w-full sm:w-44">
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

        <Select
          value={currentQuery.criticality ?? ""}
          onValueChange={(value) => updateParams({ criticality: (value as string) || undefined })}
        >
          <SelectTrigger className="w-full sm:w-44">
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
      </CardContent>
    </Card>
  );
}
