"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MAINTENANCE_TYPES, type MaintenanceType } from "@/lib/constants";
import { useRole } from "@/components/layout/role-context";

type WorkOrderSummary = { id: string; title: string; assetId: string };

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const json = await response.json();
    return json?.error?.message ?? "Something went wrong. Please try again.";
  } catch {
    return "Something went wrong. Please try again.";
  }
}

export function CompleteWorkOrderDialog({ workOrder }: { workOrder: WorkOrderSummary }) {
  const router = useRouter();
  const { role } = useRole();

  const [open, setOpen] = useState(false);
  const [actualCost, setActualCost] = useState("");
  const [resolution, setResolution] = useState("");
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceType>("CORRECTIVE");
  const [newConditionScore, setNewConditionScore] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setActualCost("");
    setResolution("");
    setMaintenanceType("CORRECTIVE");
    setNewConditionScore("");
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/work-orders/${workOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-demo-role": role },
        body: JSON.stringify({
          status: "COMPLETED",
          actualCost: actualCost ? Number(actualCost) : undefined,
          resolution: resolution.trim() || undefined,
          maintenanceType,
          newConditionScore: newConditionScore ? Number(newConditionScore) : undefined,
        }),
      });

      if (!response.ok) {
        setError(await extractErrorMessage(response));
        return;
      }

      resetForm();
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Complete
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Work Order</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">{workOrder.title}</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="wo-actual-cost">Actual Cost</Label>
              <Input
                id="wo-actual-cost"
                type="number"
                min="0"
                step="0.01"
                value={actualCost}
                onChange={(e) => setActualCost(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wo-maintenance-type">Maintenance Type</Label>
              <Select
                value={maintenanceType}
                onValueChange={(value) => setMaintenanceType(value as MaintenanceType)}
              >
                <SelectTrigger id="wo-maintenance-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAINTENANCE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wo-resolution">Resolution</Label>
            <Textarea
              id="wo-resolution"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="What was done to resolve this work order"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wo-condition">Updated condition after repair (optional)</Label>
            <Input
              id="wo-condition"
              type="number"
              min="0"
              max="100"
              value={newConditionScore}
              onChange={(e) => setNewConditionScore(e.target.value)}
              placeholder="0-100"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Completing..." : "Mark Completed"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
