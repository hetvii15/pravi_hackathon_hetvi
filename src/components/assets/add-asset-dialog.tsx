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
import {
  ASSET_STATUSES,
  STATUS_META,
  CRITICALITY_LEVELS,
  CRITICALITY_META,
  LIFECYCLE_STAGES,
  LIFECYCLE_META,
} from "@/lib/constants";

type DepartmentOption = {
  id: string;
  name: string;
  categories: { id: string; name: string }[];
};

const EMPTY_FORM = {
  assetCode: "",
  name: "",
  description: "",
  departmentId: "",
  categoryId: "",
  status: "OPERATIONAL",
  criticality: "MEDIUM",
  lifecycleStage: "OPERATIONAL",
  latitude: "",
  longitude: "",
  address: "",
  zone: "",
  installationDate: "",
  acquisitionCost: "",
  owner: "",
};

type FormState = typeof EMPTY_FORM;

export function AddAssetDialog({ departments }: { departments: DepartmentOption[] }) {
  const { role } = useRole();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errorLines, setErrorLines] = useState<string[]>([]);

  const selectedDepartment = departments.find((d) => d.id === form.departmentId);
  const categoryOptions = selectedDepartment?.categories ?? [];

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setErrorLines([]);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) resetForm();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorLines([]);

    if (!form.departmentId || !form.categoryId) {
      setErrorLines(["Department and category are required."]);
      return;
    }

    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    if (form.latitude.trim() === "" || Number.isNaN(latitude)) {
      setErrorLines(["Latitude is required and must be a number."]);
      return;
    }
    if (form.longitude.trim() === "" || Number.isNaN(longitude)) {
      setErrorLines(["Longitude is required and must be a number."]);
      return;
    }

    const body: Record<string, unknown> = {
      assetCode: form.assetCode.trim(),
      name: form.name.trim(),
      departmentId: form.departmentId,
      categoryId: form.categoryId,
      status: form.status,
      criticality: form.criticality,
      lifecycleStage: form.lifecycleStage,
      latitude,
      longitude,
    };
    if (form.description.trim()) body.description = form.description.trim();
    if (form.address.trim()) body.address = form.address.trim();
    if (form.zone.trim()) body.zone = form.zone.trim();
    if (form.installationDate) body.installationDate = form.installationDate;
    if (form.acquisitionCost.trim()) body.acquisitionCost = Number(form.acquisitionCost);
    if (form.owner.trim()) body.owner = form.owner.trim();

    setSubmitting(true);
    try {
      const res = await fetch("/api/assets", {
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
          setErrorLines([apiError?.message ?? "Failed to create asset."]);
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
        Add Asset
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] w-full max-w-lg overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Asset</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="assetCode">Asset Code</Label>
              <Input
                id="assetCode"
                required
                value={form.assetCode}
                onChange={(e) => updateField("assetCode", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
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
              <Label>Department</Label>
              <Select
                value={form.departmentId}
                onValueChange={(value) => {
                  updateField("departmentId", (value as string) ?? "");
                  updateField("categoryId", "");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.categoryId}
                onValueChange={(value) => updateField("categoryId", (value as string) ?? "")}
                disabled={!form.departmentId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={form.departmentId ? "Select category" : "Select department first"} />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => updateField("status", (value as string) ?? "OPERATIONAL")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_META[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Criticality</Label>
              <Select value={form.criticality} onValueChange={(value) => updateField("criticality", (value as string) ?? "MEDIUM")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRITICALITY_LEVELS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CRITICALITY_META[c].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Lifecycle Stage</Label>
              <Select
                value={form.lifecycleStage}
                onValueChange={(value) => updateField("lifecycleStage", (value as string) ?? "OPERATIONAL")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIFECYCLE_STAGES.map((l) => (
                    <SelectItem key={l} value={l}>
                      {LIFECYCLE_META[l].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                required
                value={form.latitude}
                onChange={(e) => updateField("latitude", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                required
                value={form.longitude}
                onChange={(e) => updateField("longitude", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={form.address} onChange={(e) => updateField("address", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zone">Zone</Label>
              <Input id="zone" value={form.zone} onChange={(e) => updateField("zone", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="installationDate">Installation Date</Label>
              <Input
                id="installationDate"
                type="date"
                value={form.installationDate}
                onChange={(e) => updateField("installationDate", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acquisitionCost">Acquisition Cost</Label>
              <Input
                id="acquisitionCost"
                type="number"
                step="any"
                min="0"
                value={form.acquisitionCost}
                onChange={(e) => updateField("acquisitionCost", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="owner">Owner</Label>
              <Input id="owner" value={form.owner} onChange={(e) => updateField("owner", e.target.value)} />
            </div>
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
              {submitting ? "Creating…" : "Create Asset"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
