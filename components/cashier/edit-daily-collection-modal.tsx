"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { editDailyCollection } from "@/lib/actions/daily-collections";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface EditDailyCollectionModalProps {
  report: any;
  isOpen: boolean;
  onClose: () => void;
}

export function EditDailyCollectionModal({ report, isOpen, onClose }: EditDailyCollectionModalProps) {
  const [totalDeposits, setTotalDeposits] = useState(report.totalDeposits?.toString() || "0");
  const [date, setDate] = useState(
    report.date ? new Date(report.date).toISOString().split('T')[0] : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const parsedDeposits = parseFloat(totalDeposits);
      if (isNaN(parsedDeposits)) {
        toast.error("Invalid deposit amount.");
        setIsSubmitting(false);
        return;
      }

      const res = await editDailyCollection(report.id, {
        totalDeposits: parsedDeposits,
        date: new Date(date),
      });

      if (res.success) {
        toast.success("Daily report updated successfully.");
        onClose();
      } else {
        toast.error(res.error || "Failed to update report.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Daily Report</DialogTitle>
          <DialogDescription>
            Update the date and total deposits for {report.controlNo}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="date">Date</Label>
            <Input 
              id="date" 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="deposits">Total Deposits (₱)</Label>
            <Input 
              id="deposits" 
              type="number" 
              step="0.01" 
              value={totalDeposits} 
              onChange={(e) => setTotalDeposits(e.target.value)} 
            />
          </div>
          <div className="grid gap-2 text-sm text-muted-foreground mt-2">
            <p><strong>Note:</strong> Total Amount computed from receipts is ₱{Number(report.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
