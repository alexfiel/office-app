"use client";

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

interface DailyCollectionsTableProps {
  reports: any[];
  userName: string;
}

export function DailyCollectionsTable({ reports, userName }: DailyCollectionsTableProps) {
  return (
    <div className="space-y-4">
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
                  <ReportDailyCollection 
                    report={report} 
                    userName={userName} 
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
