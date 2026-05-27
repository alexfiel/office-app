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
import { ReportDailyCollection } from "@/components/cashier/report-daily-collection";
import { ReportSummaryCollections } from "@/components/cashier/report-summary-collections";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteDailyCollection } from "@/lib/actions/daily-collections";
import { EditDailyCollectionModal } from "@/components/cashier/edit-daily-collection-modal";

interface DailyCollectionsTableProps {
  reports: any[];
  userName: string;
  isAdmin?: boolean;
  filterType?: string;
  reportPeriod?: string;
}

export function DailyCollectionsTable({ reports, userName, isAdmin, filterType, reportPeriod }: DailyCollectionsTableProps) {
  const [editingReport, setEditingReport] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this daily consolidated report? All associated collections will be unconsolidated.")) return;
    
    setIsDeleting(id);
    try {
      const res = await deleteDailyCollection(id);
      if (res.success) {
        toast.success("Daily report deleted successfully.");
      } else {
        toast.error(res.error || "Failed to delete.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      {reports.length > 0 && filterType && filterType !== 'single' && (
        <div className="flex justify-end items-center mb-4 pb-4 border-b">
          <ReportSummaryCollections
            reports={reports}
            userName={userName}
            reportPeriod={reportPeriod || ""}
            filterType={filterType}
          />
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Control No</TableHead>
            <TableHead>Date Consolidate</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead>Total Deposits</TableHead>
            <TableHead>Consolidated By</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No daily consolidated reports found.
              </TableCell>
            </TableRow>
          ) : (
            reports.map((report: any) => (
              <TableRow key={report.id}>
                <TableCell className="font-bold text-primary">
                  {report.controlNo}
                </TableCell>
                <TableCell className="font-medium whitespace-nowrap">
                  {format(new Date(report.date), "MMM d, yyyy h:mm a")}
                </TableCell>
                <TableCell className="font-bold text-green-700">
                  ₱{Number(report.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell>
                  ₱{Number(report.totalDeposits).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-sm">
                  {report.user?.name || "Unknown"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <ReportDailyCollection 
                      report={report} 
                      userName={userName} 
                    />
                    {isAdmin && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingReport(report)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDelete(report.id)}
                          disabled={isDeleting === report.id}
                        >
                          {isDeleting === report.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {editingReport && (
        <EditDailyCollectionModal
          report={editingReport}
          isOpen={!!editingReport}
          onClose={() => setEditingReport(null)}
        />
      )}
    </div>
  );
}
