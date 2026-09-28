"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
import { WORK_ORDER_PRIORITIES, WORK_ORDER_PRIORITY_META, type WorkOrderPriority } from "@/lib/constants";
import { useRole } from "@/components/layout/role-context";

type AssetOption = { id: string; assetCode: string; name: string };

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const json = await response.json();
    return json?.error?.message ?? "Something went wrong. Please try again.";
  } catch {
    return "Something went wrong. Please try again.";
  }
}

export function NewWorkOrderDialog({ assets }: { assets: AssetOption[] }) {
  const router = useRouter();
  const { role } = useRole();

  const [open, setOpen] = useState(false);
  const [assetId, setAssetId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<WorkOrderPriority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setAssetId(null);
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setDueDate("");
    setEstimatedCost("");
    setAssignedTo("");
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!assetId || title.trim().length < 2) {
      setError("Asset and a title (at least 2 characters) are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-role": role },
        body: JSON.stringify({
          assetId,
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          assignedTo: assignedTo.trim() || undefined,
          dueDate: dueDate || undefined,
          estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
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
          <Button size="sm">
            <Plus className="h-4 w-4" />
            New Work Order
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Work Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="wo-asset">Asset</Label>
            <Select value={assetId} onValueChange={(value) => setAssetId(value as string | null)}>
              <SelectTrigger id="wo-asset" className="w-full">
                <SelectValue placeholder="Select an asset" />
              </SelectTrigger>
              <SelectContent>
                {assets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.assetCode} — {asset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wo-title">Title</Label>
            <Input
              id="wo-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Replace corroded railing"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wo-description">Description</Label>
            <Textarea
              id="wo-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details for the maintenance team"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="wo-priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as WorkOrderPriority)}
              >
                <SelectTrigger id="wo-priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORK_ORDER_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {WORK_ORDER_PRIORITY_META[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wo-due-date">Due Date</Label>
              <Input
                id="wo-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="wo-cost">Estimated Cost</Label>
              <Input
                id="wo-cost"
                type="number"
                min="0"
                step="0.01"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wo-assigned-to">Assigned To</Label>
              <Input
                id="wo-assigned-to"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Team or person"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Work Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
