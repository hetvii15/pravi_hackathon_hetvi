import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MapLoading() {
  return (
    <div className="flex h-full flex-col space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      </div>
      <Card className="flex-1 overflow-hidden p-0 min-h-[520px]">
        <Skeleton className="h-full w-full rounded-none" />
      </Card>
    </div>
  );
}
