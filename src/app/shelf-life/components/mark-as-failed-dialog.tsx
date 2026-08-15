"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";

interface MarkAsFailedDialogProps {
  sampleId: string;
  currentDay: number;
  onMarked: () => void;
}

export function MarkAsFailedDialog({ sampleId, currentDay, onMarked }: MarkAsFailedDialogProps) {
  const [open, setOpen] = useState(false);
  const [failureDay, setFailureDay] = useState(currentDay.toString());
  const [failureReason, setFailureReason] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    try {
      await fetch(`/api/shelf-life/samples/${sampleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "FAILED",
          totalDays: parseInt(failureDay) || currentDay,
          failureReason: failureReason || "Manually marked as failed",
          notes: notes || undefined,
        }),
      });
      setOpen(false);
      onMarked();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <AlertTriangle className="h-4 w-4" />
          Mark as Failed
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Mark Sample as Failed
          </DialogTitle>
          <DialogDescription>
            This action will permanently mark the sample as failed. Please confirm the details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1">
            <Label>Failure Day</Label>
            <Input
              type="number"
              value={failureDay}
              onChange={(e) => setFailureDay(e.target.value)}
              min={1}
            />
            <p className="text-xs text-gray-500">The day the sample was observed to fail</p>
          </div>

          <div className="space-y-1">
            <Label>Failure Reason *</Label>
            <Input
              value={failureReason}
              onChange={(e) => setFailureReason(e.target.value)}
              placeholder="e.g. 3 shrivel, 1 collapsed"
              required
            />
          </div>

          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional context..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={loading || !failureReason.trim()}
          >
            {loading ? "Saving..." : "Confirm Failure"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
