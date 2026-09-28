import Link from "next/link";
import { Boxes } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AssetStatusBadge,
  ConditionBadge,
  CriticalityBadge,
  RiskBadge,
} from "@/components/status-badge";
import { AssetsFilterBar } from "@/components/assets/assets-filter-bar";
import { AddAssetDialog } from "@/components/assets/add-asset-dialog";
import { assetListQuerySchema } from "@/lib/validation";
import { listAssets } from "@/server/assets";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const flatParams: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawParams)) {
    const flat = firstValue(value);
    if (flat !== undefined) flatParams[key] = flat;
  }

  const parsed = assetListQuerySchema.safeParse(flatParams);
  const query = parsed.success ? parsed.data : assetListQuerySchema.parse({});

  const [result, departments] = await Promise.all([
    listAssets(query),
    prisma.department.findMany({
      include: { categories: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const { data: assets, pagination } = result;

  function pageHref(page: number) {
    const params = new URLSearchParams(flatParams);
    params.set("page", String(page));
    return `/assets?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assets"
        description="The complete cross-department asset inventory — searchable and filterable by department, category, status and criticality."
        actions={<AddAssetDialog departments={departments} />}
      />

      <AssetsFilterBar
        departments={departments}
        currentQuery={{
          search: query.search,
          department: query.department,
          category: query.category,
          status: query.status,
          criticality: query.criticality,
        }}
      />

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Criticality</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Zone</TableHead>
              </TableRow>
            </TableHeader>
            {assets.length > 0 && (
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-mono text-xs">
                      <Link href={`/assets/${asset.id}`} className="hover:underline">
                        {asset.assetCode}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/assets/${asset.id}`} className="font-medium hover:underline">
                        {asset.name}
                      </Link>
                    </TableCell>
                    <TableCell>{asset.department.name}</TableCell>
                    <TableCell>{asset.category.name}</TableCell>
                    <TableCell>
                      <AssetStatusBadge status={asset.status} />
                    </TableCell>
                    <TableCell>
                      <ConditionBadge score={asset.conditionScore} />
                    </TableCell>
                    <TableCell>
                      <CriticalityBadge criticality={asset.criticality} />
                    </TableCell>
                    <TableCell>
                      <RiskBadge score={asset.riskScore} />
                    </TableCell>
                    <TableCell>{asset.zone ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            )}
          </Table>
        </div>

        {assets.length === 0 ? (
          <CardContent className="border-t">
            <EmptyState
              icon={Boxes}
              title="No assets found"
              description="No assets match the current filters. Try adjusting your search or filter criteria, or add a new asset."
            />
          </CardContent>
        ) : (
          <CardContent className="flex flex-col items-center justify-between gap-3 border-t py-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} asset
              {pagination.total === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-2">
              {pagination.page <= 1 ? (
                <span className={cn(buttonVariants({ variant: "outline", size: "sm" }), "pointer-events-none opacity-50")}>
                  Previous
                </span>
              ) : (
                <Link href={pageHref(pagination.page - 1)} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  Previous
                </Link>
              )}
              {pagination.page >= pagination.totalPages ? (
                <span className={cn(buttonVariants({ variant: "outline", size: "sm" }), "pointer-events-none opacity-50")}>
                  Next
                </span>
              ) : (
                <Link href={pageHref(pagination.page + 1)} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  Next
                </Link>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
