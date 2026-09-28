import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { AssetMapLoader } from "@/components/map/asset-map-loader";

export default function MapPage() {
  return (
    <div className="flex h-full flex-col space-y-6">
      <PageHeader
        title="Map"
        description="Geospatial view of every infrastructure asset, color-coded by condition once asset data is connected."
      />
      <Card className="flex-1 overflow-hidden p-0 min-h-[520px]">
        <AssetMapLoader />
      </Card>
    </div>
  );
}
