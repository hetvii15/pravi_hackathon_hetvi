"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Leaflet touches `window` at import time, so it can only load on the client.
const AssetMap = dynamic(() => import("./asset-map").then((m) => m.AssetMap), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

export function AssetMapLoader() {
  return <AssetMap />;
}
