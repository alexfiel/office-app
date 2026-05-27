"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createDailyCollection } from "@/lib/actions/daily-collections";
import { CollectionTableActions } from "@/components/cashier/collection-table-actions";

interface UnconsolidatedCollectionsTableProps {
  collections: any[];
  isAdmin: boolean;
}

export function UnconsolidatedCollectionsTable({ collections, isAdmin }: UnconsolidatedCollectionsTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isConsolidating, setIsConsolidating] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(collections.map((col) => col.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const handleConsolidate = async () => {
    if (selectedIds.length === 0) return;
    
    setIsConsolidating(true);
    const res = await createDailyCollection(selectedIds);
    if (res.success) {
      toast.success(`Consolidated collection created: ${res.data?.controlNo}`);
      setSelectedIds([]);
    } else {
      toast.error(res.error || "Failed to consolidate collections.");
    }
    setIsConsolidating(false);
  };

  const selectedTotal = collections
    .filter(col => selectedIds.includes(col.id))
    .reduce((acc, col) => acc + Number(col.totalAmount), 0);

  return (
    <div className="space-y-4">
      {collections.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/20 p-3 rounded-lg border">
          <div className="text-sm">
            <span className="font-semibold">{selectedIds.length}</span> selected 
            (Total: <span className="font-bold text-primary">₱{selectedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>)
          </div>
          <Button 
            onClick={handleConsolidate} 
            disabled={selectedIds.length === 0 || isConsolidating}
          >
            {isConsolidating ? "Consolidating..." : "Consolidate Selected"}
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox 
                checked={selectedIds.length === collections.length && collections.length > 0}
                onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                disabled={collections.length === 0}
              />
            </TableHead>
            <TableHead>Control No</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Total (₱)</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Recorded By</TableHead>
            {isAdmin && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {collections.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isAdmin ? 7 : 6} className="text-center text-muted-foreground">
                No unconsolidated collections found.
              </TableCell>
            </TableRow>
          ) : (
            collections.map((col: any) => (
              <TableRow key={col.id}>
                <TableCell>
                  <Checkbox 
                    checked={selectedIds.includes(col.id)}
                    onCheckedChange={(checked) => handleSelectOne(col.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell className="font-semibold text-primary">
                  {col.controlNo}
                </TableCell>
                <TableCell className="font-medium whitespace-nowrap">
                  {format(new Date(col.date), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  {Number(col.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="max-w-[150px] truncate text-xs text-muted-foreground" title={col.collectionItems?.map((item: any) => `${item.collectionCategory?.name}: ₱${Number(item.amount).toLocaleString()}`).join(" | ")}>
                  {col.collectionItems?.map((item: any) => item.collectionCategory?.code).join(", ")}
                </TableCell>
                <TableCell className="text-xs">
                  {col.user?.name || "Unknown"}
                </TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    <CollectionTableActions collection={col} />
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
