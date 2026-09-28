"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useRole } from "@/components/layout/role-context";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LIFECYCLE_STAGES, LIFECYCLE_META } from "@/lib/constants";

// Sentinel for the "no stage change" option — Base UI Select items can't use
// an empty string as their value, and omitting `newLifecycleStage` entirely
// from the request body is how the API knows not to change the stage.
const NO_STAGE_CHANGE = "__NO_CHANGE__";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function emptyForm() {
  return {
    eventType: "",
    eventDate: today(),
    description: "",
    performedBy: "",
    cost: "",
    newLifecycleStage: NO_STAGE_CHANGE,
  };
}

type FormState = ReturnType<typeof emptyForm>;

export function LogLifecycleEventDialog({ assetId }: { assetId: string }) {
  const { role } = useRole();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [errorLines, setErrorLines] = useState<string[]>([]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm(emptyForm());
    setErrorLines([]);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) resetForm();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorLines([]);

    if (form.eventType.trim().length < 2) {
      setErrorLines(["Event type is required (at least 2 characters)."]);
      return;
    }

    const body: Record<string, unknown> = {
      eventType: form.eventType.trim(),
      eventDate: form.eventDate,
    };
    if (form.description.trim()) body.description = form.description.trim();
    if (form.performedBy.trim()) body.performedBy = form.performedBy.trim();
    if (form.cost.trim()) body.cost = Number(form.cost);
    if (form.newLifecycleStage !== NO_STAGE_CHANGE) body.newLifecycleStage = form.newLifecycleStage;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/assets/${assetId}/lifecycle`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-role": role },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const apiError = payload?.error;
        if (Array.isArray(apiError?.issues) && apiError.issues.length > 0) {
          setErrorLines(
            apiError.issues.map((issue: { path?: string; message: string }) =>
              issue.path ? `${issue.path}: ${issue.message}` : issue.message
            )
          );
        } else {
          setErrorLines([apiError?.message ?? "Failed to log lifecycle event."]);
        }
        return;
      }

      setOpen(false);
      resetForm();
      router.refresh();
    } catch {
      setErrorLines(["Network error — could not reach the server."]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="h-4 w-4" />
        Log Lifecycle Event
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] w-full max-w-lg overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Log Lifecycle Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="eventType">Event Type</Label>
              <Input
                id="eventType"
                required
                placeholder="e.g. Installed, Repaired, Upgraded"
                value={form.eventType}
                onChange={(e) => updateField("eventType", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eventDate">Date</Label>
              <Input
                id="eventDate"
                type="date"
                required
                value={form.eventDate}
                onChange={(e) => updateField("eventDate", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="performedBy">Performed By</Label>
              <Input
                id="performedBy"
                value={form.performedBy}
                onChange={(e) => updateField("performedBy", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cost">Cost</Label>
              <Input
                id="cost"
                type="number"
                min="0"
                step="any"
                value={form.cost}
                onChange={(e) => updateField("cost", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>New Lifecycle Stage (optional)</Label>
            <Select
              value={form.newLifecycleStage}
              onValueChange={(value) => updateField("newLifecycleStage", (value as string) ?? NO_STAGE_CHANGE)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_STAGE_CHANGE}>No change</SelectItem>
                {LIFECYCLE_STAGES.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {LIFECYCLE_META[stage].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {errorLines.length > 0 && (
            <div className="rounded-md bg-destructive/10 p-2.5 text-sm text-destructive">
              {errorLines.map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Log Lifecycle Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
