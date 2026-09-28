import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { MapView } from "@/components/map/map-view";
import { prisma } from "@/lib/prisma";
import type { MapAsset } from "@/components/map/asset-map";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const [assets, departments] = await Promise.all([
    prisma.asset.findMany({
      select: {
        id: true,
        assetCode: true,
        name: true,
        description: true,
        latitude: true,
        longitude: true,
        address: true,
        zone: true,
        status: true,
        conditionScore: true,
        criticality: true,
        riskScore: true,
        lifecycleStage: true,
        departmentId: true,
        categoryId: true,
        department: { select: { name: true } },
        category: { select: { name: true } },
      },
      take: 400,
    }),
    prisma.department.findMany({
      include: { categories: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const mapped: MapAsset[] = assets.map((a) => ({
    id: a.id,
    assetCode: a.assetCode,
    name: a.name,
    description: a.description,
    latitude: a.latitude,
    longitude: a.longitude,
    address: a.address,
    zone: a.zone,
    status: a.status,
    conditionScore: a.conditionScore,
    criticality: a.criticality,
    riskScore: a.riskScore,
    lifecycleStage: a.lifecycleStage,
    departmentId: a.departmentId,
    categoryId: a.categoryId,
    departmentName: a.department.name,
    categoryName: a.category.name,
  }));

  const departmentOptions = departments.map((d) => ({
    id: d.id,
    name: d.name,
    categories: d.categories.map((c) => ({ id: c.id, name: c.name })),
  }));

  return (
    <div className="flex h-full flex-col space-y-6">
      <PageHeader
        title="Map"
        description="Geospatial view of every infrastructure asset, color-coded by condition once asset data is connected."
      />
      <Card className="flex-1 overflow-hidden p-0 min-h-[520px]">
        <MapView assets={mapped} departments={departmentOptions} />
      </Card>
    </div>
  );
}
