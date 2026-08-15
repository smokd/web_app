"use client";

import { useState } from "react";
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
import { Minus, Plus, Save, AlertTriangle } from "lucide-react";
import { StatusBadge } from "./status-badge";

interface DailyTrackingFormProps {
  sampleId: string;
  sampleType: string;
  packWeight?: number | null;
  existingDays: number[];
  onSave: () => void;
}

export function DailyTrackingForm({
  sampleId,
  sampleType,
  packWeight,
  existingDays,
  onSave,
}: DailyTrackingFormProps) {
  const [day, setDay] = useState(() => {
    const max = existingDays.length > 0 ? Math.max(...existingDays) : 0;
    return max + 1;
  });
  const [weightGrams, setWeightGrams] = useState("");
  const [shrivel, setShrivel] = useState(0);
  const [soft, setSoft] = useState(0);
  const [collapsed, setCollapsed] = useState(0);
  const [overallStatus, setOverallStatus] = useState("GOOD");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const showWeight = sampleType === "WEIGHT_RETENTION";
  const totalDefects = shrivel + soft + collapsed;

  const suggestedStatus =
    totalDefects > 3 || shrivel > 5
      ? "FAIL"
      : totalDefects > 0
      ? "FAIR"
      : "GOOD";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (showWeight && weightGrams) {
        await fetch(`/api/shelf-life/samples/${sampleId}/weight-readings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ day, weightGrams }),
        });
      }

      if (totalDefects > 0 || notes) {
        await fetch(`/api/shelf-life/samples/${sampleId}/observations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            day,
            shrivelCount: shrivel,
            softCount: soft,
            collapsedCount: collapsed,
            overallStatus: overallStatus || suggestedStatus,
            notes,
          }),
        });
      }

      setWeightGrams("");
      setShrivel(0);
      setSoft(0);
      setCollapsed(0);
      setNotes("");
      setDay(day + 1);
      onSave();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function Stepper({
    value,
    onChange,
    label,
  }: {
    value: number;
    onChange: (v: number) => void;
    label: string;
  }) {
    return (
      <div className="flex items-center gap-3">
        <Label className="w-20 text-sm">{label}</Label>
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="h-8 w-8 rounded-full border flex items-center justify-center hover:bg-gray-50 active:bg-gray-100"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="w-8 text-center font-mono text-lg">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="h-8 w-8 rounded-full border flex items-center justify-center hover:bg-gray-50 active:bg-gray-100"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-4 flex-wrap">
        <Label className="text-sm font-medium shrink-0">Day</Label>
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: Math.max(15, day + 2) }, (_, i) => i + 1).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDay(d)}
              className={`h-8 w-8 rounded-full text-xs font-medium border transition-colors ${
                existingDays.includes(d)
                  ? "bg-green-50 border-green-300 text-green-700"
                  : day === d
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {showWeight && (
        <div className="space-y-1">
          <Label className="text-sm font-medium">
            Weight (grams)
            {packWeight ? (
              <span className="text-gray-400 font-normal ml-2">
                (Pack weight: {packWeight}g)
              </span>
            ) : null}
          </Label>
          <Input
            type="number"
            step="0.1"
            value={weightGrams}
            onChange={(e) => setWeightGrams(e.target.value)}
            placeholder="Enter weight in grams"
            className="max-w-xs"
          />
          {weightGrams && packWeight && (
            <p className="text-xs text-gray-500">
              Loss: {(((packWeight - parseFloat(weightGrams)) / packWeight) * 100).toFixed(2)}%
            </p>
          )}
        </div>
      )}

      <div className="space-y-3">
        <p className="text-sm font-medium">Defect Counts</p>
        <Stepper value={shrivel} onChange={setShrivel} label="Shrivel" />
        <Stepper value={soft} onChange={setSoft} label="Soft" />
        <Stepper value={collapsed} onChange={setCollapsed} label="Collapsed" />
      </div>

      {totalDefects > 0 && (
        <div
          className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
            suggestedStatus === "FAIL"
              ? "bg-red-50 text-red-700"
              : suggestedStatus === "FAIR"
              ? "bg-amber-50 text-amber-700"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Suggested status: <strong>{suggestedStatus}</strong> ({totalDefects} defects)
          </span>
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-sm font-medium">Overall Status</Label>
        <Select value={overallStatus} onValueChange={setOverallStatus}>
          <SelectTrigger className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GOOD">GOOD</SelectItem>
            <SelectItem value="FAIR">FAIR</SelectItem>
            <SelectItem value="FAIL">FAIL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-sm font-medium">Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional notes..."
          className="max-w-md"
          rows={2}
        />
      </div>

      <Button type="submit" disabled={loading} className="gap-2">
        <Save className="h-4 w-4" />
        {loading ? "Saving..." : "Save Day Record"}
      </Button>
    </form>
  );
}
