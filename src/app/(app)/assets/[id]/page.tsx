import Link from "next/link";
import { notFound as nextNotFound } from "next/navigation";
import { format } from "date-fns";
import { Activity, ClipboardCheck, FileClock, Link2, Wrench } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  LifecycleBadge,
  RiskBadge,
  WorkOrderStatusBadge,
} from "@/components/status-badge";
import { LogInspectionDialog } from "@/components/assets/log-inspection-dialog";
import { LogLifecycleEventDialog } from "@/components/assets/log-lifecycle-event-dialog";
import { getAssetDetail } from "@/server/assets";
import { computeAssetRisk } from "@/server/risk";
import { riskBand, type WorkOrderStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

function titleCase(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return format(new Date(date), "MMM d, yyyy");
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `₹${value.toLocaleString()}`;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let asset: Awaited<ReturnType<typeof getAssetDetail>>;
  let risk: Awaited<ReturnType<typeof computeAssetRisk>>;
  try {
    [asset, risk] = await Promise.all([getAssetDetail(id), computeAssetRisk(id)]);
  } catch {
    nextNotFound();
  }

  const customAttributes = Object.entries(
    (asset.customAttributes as unknown as Record<string, unknown> | null) ?? {}
  );

  const relationships = [
    ...asset.relationshipsSource.map((r) => ({
      id: r.id,
      label: r.relationshipType,
      otherAsset: r.targetAsset,
      direction: "outgoing" as const,
    })),
    ...asset.relationshipsTarget.map((r) => ({
      id: r.id,
      label: r.relationshipType,
      otherAsset: r.sourceAsset,
      direction: "incoming" as const,
    })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${asset.assetCode} — ${asset.name}`}
        description={`${asset.department.name} / ${asset.category.name}`}
        actions={
          <>
            <LogInspectionDialog assetId={asset.id} />
            <LogLifecycleEventDialog assetId={asset.id} />
          </>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 py-4">
          <AssetStatusBadge status={asset.status} />
          <ConditionBadge score={asset.conditionScore} />
          <CriticalityBadge criticality={asset.criticality} />
          <LifecycleBadge stage={asset.lifecycleStage} />
          <RiskBadge score={asset.riskScore} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <h3 className="text-sm font-medium">Risk Assessment</h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Deterministic, explainable scoring — not an AI prediction.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold tabular-nums">{risk.riskScore}</span>
            <Badge variant="outline" className={cn("font-normal", riskBand(risk.riskScore).className)}>
              {riskBand(risk.riskScore).label}
            </Badge>
          </div>
          <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
            {risk.reasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 pt-4">
          <Card>
            <CardContent className="py-4">
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Address" value={formatValue(asset.address)} />
                <Field label="Zone" value={formatValue(asset.zone)} />
                <Field label="Coordinates" value={`${asset.latitude}, ${asset.longitude}`} />
                <Field label="Installation Date" value={formatDate(asset.installationDate)} />
                <Field label="Acquisition Date" value={formatDate(asset.acquisitionDate)} />
                <Field label="Expected Life (Years)" value={formatValue(asset.expectedLifeYears)} />
                <Field label="Acquisition Cost" value={formatCurrency(asset.acquisitionCost)} />
                <Field label="Warranty End Date" value={formatDate(asset.warrantyEndDate)} />
                <Field label="Owner" value={formatValue(asset.owner)} />
                <Field label="Vendor" value={formatValue(asset.vendor?.name)} />
                <Field label="Last Inspection" value={formatDate(asset.lastInspectionDate)} />
                <Field label="Next Inspection" value={formatDate(asset.nextInspectionDate)} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <h3 className="mb-3 text-sm font-medium">Category Attributes</h3>
              {customAttributes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No category-specific attributes recorded.</p>
              ) : (
                <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                  {customAttributes.map(([key, value]) => (
                    <Field key={key} label={titleCase(key)} value={formatValue(value)} />
                  ))}
                </dl>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lifecycle" className="pt-4">
          {asset.lifecycleEvents.length === 0 ? (
            <EmptyState
              icon={FileClock}
              title="No lifecycle events"
              description="Lifecycle events for this asset will appear here as they occur."
            />
          ) : (
            <Card>
              <CardContent className="py-4">
                <ol className="space-y-4 border-l pl-4">
                  {asset.lifecycleEvents.map((event) => (
                    <li key={event.id} className="relative">
                      <span className="absolute -left-[1.15rem] top-1 h-2 w-2 rounded-full bg-primary" />
                      <p className="text-sm font-medium">{event.eventType}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(event.eventDate)}</p>
                      {event.description && <p className="mt-1 text-sm">{event.description}</p>}
                      {event.cost != null && (
                        <p className="mt-1 text-xs text-muted-foreground">Cost: {formatCurrency(event.cost)}</p>
                      )}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="inspections" className="pt-4">
          {asset.inspections.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="No inspections recorded"
              description="Logged inspections for this asset will appear here."
            />
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Safety</TableHead>
                      <TableHead>Structural</TableHead>
                      <TableHead>Operational</TableHead>
                      <TableHead>Inspector</TableHead>
                      <TableHead>Comments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {asset.inspections.map((inspection) => (
                      <TableRow key={inspection.id}>
                        <TableCell>{formatDate(inspection.inspectionDate)}</TableCell>
                        <TableCell>
                          <ConditionBadge score={inspection.conditionScore} />
                        </TableCell>
                        <TableCell>{formatValue(inspection.safetyScore)}</TableCell>
                        <TableCell>{formatValue(inspection.structuralScore)}</TableCell>
                        <TableCell>{formatValue(inspection.operationalScore)}</TableCell>
                        <TableCell>{formatValue(inspection.inspector?.name)}</TableCell>
                        <TableCell className="max-w-xs whitespace-normal">{formatValue(inspection.comments)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="maintenance" className="pt-4">
          {asset.workOrders.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="No work orders"
              description="Maintenance work orders for this asset will appear here."
            />
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {asset.workOrders.map((wo) => (
                      <TableRow key={wo.id}>
                        <TableCell className="font-medium">{wo.title}</TableCell>
                        <TableCell>
                          <WorkOrderStatusBadge status={wo.status as WorkOrderStatus} />
                        </TableCell>
                        <TableCell>{wo.priority}</TableCell>
                        <TableCell>{formatValue(wo.assignedTo)}</TableCell>
                        <TableCell>{formatDate(wo.dueDate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="audit" className="pt-4">
          {asset.auditLogs.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No audit history"
              description="Changes made to this asset will be logged here."
            />
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Change</TableHead>
                      <TableHead>User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {asset.auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{formatDate(log.timestamp)}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>{formatValue(log.fieldChanged)}</TableCell>
                        <TableCell>
                          {log.oldValue || log.newValue
                            ? `${formatValue(log.oldValue)} → ${formatValue(log.newValue)}`
                            : "—"}
                        </TableCell>
                        <TableCell>{formatValue(log.user?.name)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="relationships" className="pt-4">
          {relationships.length === 0 ? (
            <EmptyState
              icon={Link2}
              title="No relationships"
              description="Relationships to other assets will appear here."
            />
          ) : (
            <Card>
              <CardContent className="divide-y py-0">
                {relationships.map((rel) => (
                  <div key={rel.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="text-sm">
                      {rel.direction === "outgoing" ? (
                        <span>
                          This asset <span className="font-medium">{rel.label}</span>{" "}
                          <Link href={`/assets/${rel.otherAsset.id}`} className="text-primary hover:underline">
                            {rel.otherAsset.name}
                          </Link>
                        </span>
                      ) : (
                        <span>
                          <Link href={`/assets/${rel.otherAsset.id}`} className="text-primary hover:underline">
                            {rel.otherAsset.name}
                          </Link>{" "}
                          <span className="font-medium">{rel.label}</span> this asset
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
