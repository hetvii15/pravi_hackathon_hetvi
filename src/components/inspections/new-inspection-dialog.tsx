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

type AssetOption = { id: string; assetCode: string; name: string };

function today() {
  return new Date().toISOString().slice(0, 10);
}

function emptyForm() {
  return {
    inspectionDate: today(),
    conditionScore: "",
    safetyScore: "",
    structuralScore: "",
    operationalScore: "",
    comments: "",
    recommendations: "",
  };
}

type FormState = ReturnType<typeof emptyForm>;

export function NewInspectionDialog({ assets }: { assets: AssetOption[] }) {
  const { role } = useRole();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [assetId, setAssetId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [errorLines, setErrorLines] = useState<string[]>([]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setAssetId(null);
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

    if (!assetId) {
      setErrorLines(["Select an asset before logging the inspection."]);
      return;
    }

    const conditionScore = Number(form.conditionScore);
    if (form.conditionScore.trim() === "" || Number.isNaN(conditionScore) || conditionScore < 0 || conditionScore > 100) {
      setErrorLines(["Condition score is required and must be a number between 0 and 100."]);
      return;
    }

    const body: Record<string, unknown> = {
      inspectionDate: form.inspectionDate,
      conditionScore,
    };
    if (form.safetyScore.trim()) body.safetyScore = Number(form.safetyScore);
    if (form.structuralScore.trim()) body.structuralScore = Number(form.structuralScore);
    if (form.operationalScore.trim()) body.operationalScore = Number(form.operationalScore);
    if (form.comments.trim()) body.comments = form.comments.trim();
    if (form.recommendations.trim()) body.recommendations = form.recommendations.trim();

    setSubmitting(true);
    try {
      const res = await fetch(`/api/assets/${assetId}/inspections`, {
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
          setErrorLines([apiError?.message ?? "Failed to log inspection."]);
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
        New Inspection
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] w-full max-w-lg overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New Inspection</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="inspection-asset">Asset</Label>
            <Select value={assetId} onValueChange={(value) => setAssetId(value as string | null)}>
              <SelectTrigger id="inspection-asset" className="w-full">
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="inspectionDate">Inspection Date</Label>
              <Input
                id="inspectionDate"
                type="date"
                required
                value={form.inspectionDate}
                onChange={(e) => updateField("inspectionDate", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="conditionScore">Condition Score (0-100)</Label>
              <Input
                id="conditionScore"
                type="number"
                min="0"
                max="100"
                required
                value={form.conditionScore}
                onChange={(e) => updateField("conditionScore", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="safetyScore">Safety Score</Label>
              <Input
                id="safetyScore"
                type="number"
                min="0"
                max="100"
                value={form.safetyScore}
                onChange={(e) => updateField("safetyScore", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="structuralScore">Structural Score</Label>
              <Input
                id="structuralScore"
                type="number"
                min="0"
                max="100"
                value={form.structuralScore}
                onChange={(e) => updateField("structuralScore", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="operationalScore">Operational Score</Label>
              <Input
                id="operationalScore"
                type="number"
                min="0"
                max="100"
                value={form.operationalScore}
                onChange={(e) => updateField("operationalScore", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="comments">Comments</Label>
            <Textarea id="comments" value={form.comments} onChange={(e) => updateField("comments", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="recommendations">Recommendations</Label>
            <Textarea
              id="recommendations"
              value={form.recommendations}
              onChange={(e) => updateField("recommendations", e.target.value)}
            />
          </div>

          {errorLines.length > 0 && (
            <div className="rounded-md bg-destructive/10 p-2.5 text-sm text-destructive">
              {errorLines.map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={submitting || !assetId}>
              {submitting ? "Saving…" : "Log Inspection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
