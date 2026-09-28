"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WORK_ORDER_STATUSES, WORK_ORDER_STATUS_META, type WorkOrderStatus } from "@/lib/constants";
import { useRole } from "@/components/layout/role-context";

// Compact, inline status control — not a dialog. Meant to sit in a page
// header or detail card next to CompleteWorkOrderDialog.
export function WorkOrderStatusSelect({
  workOrderId,
  currentStatus,
}: {
  workOrderId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const { role } = useRole();

  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleValueChange(value: unknown) {
    const newStatus = value as WorkOrderStatus;
    if (newStatus === status) return;

    if (newStatus === "COMPLETED") {
      // Completion needs the richer CompleteWorkOrderDialog form (actual
      // cost, resolution, maintenance type, updated condition) to drive the
      // maintenance-record/lifecycle side effects in updateWorkOrder — so a
      // bare status-only PUT would be incomplete. Ignore this selection;
      // CompleteWorkOrderDialog elsewhere on the page handles that transition.
      return;
    }

    const previousStatus = status;
    setStatus(newStatus);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/work-orders/${workOrderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-demo-role": role },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        setStatus(previousStatus);
        try {
          const json = await response.json();
          setError(json?.error?.message ?? "Failed to update status.");
        } catch {
          setError("Failed to update status.");
        }
        return;
      }

      router.refresh();
    } catch {
      setStatus(previousStatus);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Select value={status} onValueChange={handleValueChange} disabled={loading}>
        <SelectTrigger size="sm" className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {WORK_ORDER_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {WORK_ORDER_STATUS_META[s].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
