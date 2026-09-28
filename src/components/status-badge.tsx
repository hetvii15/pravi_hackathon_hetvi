import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  STATUS_META,
  CRITICALITY_META,
  LIFECYCLE_META,
  WORK_ORDER_STATUS_META,
  conditionBand,
  riskBand,
  type AssetStatus,
  type Criticality,
  type LifecycleStage,
  type WorkOrderStatus,
} from "@/lib/constants";

// Status is always conveyed via label text + color together — never color alone.
function MetaBadge({
  meta,
  className,
  children,
}: {
  meta: { label: string; className: string };
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Badge variant="outline" className={cn("font-normal", meta.className, className)}>
      {children ?? meta.label}
    </Badge>
  );
}

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  return <MetaBadge meta={STATUS_META[status]} />;
}

export function CriticalityBadge({ criticality }: { criticality: Criticality }) {
  return <MetaBadge meta={CRITICALITY_META[criticality]} />;
}

export function LifecycleBadge({ stage }: { stage: LifecycleStage }) {
  return <MetaBadge meta={LIFECYCLE_META[stage]} />;
}

export function WorkOrderStatusBadge({ status }: { status: WorkOrderStatus }) {
  return <MetaBadge meta={WORK_ORDER_STATUS_META[status]} />;
}

export function ConditionBadge({ score }: { score: number }) {
  const meta = conditionBand(score);
  return <MetaBadge meta={meta} className="tabular-nums">{`${meta.label} · ${score}`}</MetaBadge>;
}

export function RiskBadge({ score }: { score: number }) {
  const meta = riskBand(score);
  return <MetaBadge meta={meta} className="tabular-nums">{`${meta.label} · ${score}`}</MetaBadge>;
}
