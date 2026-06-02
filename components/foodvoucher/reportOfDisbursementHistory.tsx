"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, 
    FileText, 
    Trash2, 
    ExternalLink, 
    Calendar, 
    User, 
    Banknote,
    ChevronRight,
    Loader2,
    ChevronDown
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
    getDisbursementReports, 
    deleteReportOfDisbursement 
} from "@/lib/actions/external-fv-report";
import { toast } from "sonner";
import { 
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { reportExternalSummaryByBarangay } from "./fvSettlementReport/reportExternalSummaryByBarangay";
import { reportExternalFVReportOfDisbursement } from "./fvSettlementReport/reportExternalFV-ReportOfDisbursement";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ReportOfDisbursementHistory() {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const data = await getDisbursementReports();
            setReports(data);
        } catch (error) {
            toast.error("Failed to load reports");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const filteredReports = useMemo(() => {
        return reports.filter(report => 
            report.reportNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            report.cashAdvanceVoucher?.payee?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [reports, searchQuery]);

    const handleDelete = async () => {
        if (!isDeleting) return;
        try {
            await deleteReportOfDisbursement(isDeleting);
            toast.success("Report deleted successfully");
            setReports(prev => prev.filter(r => r.id !== isDeleting));
        } catch (error: any) {
            toast.error(error.message || "Failed to delete report");
        } finally {
            setIsDeleting(null);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
    };

    if (loading && reports.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-slate-500 font-medium">Loading disbursement reports...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header / Search Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                        placeholder="Search by Report Number or Payee..." 
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline" onClick={fetchReports} className="shrink-0">
                    Refresh List
                </Button>
            </div>

            {/* List */}
            <div className="space-y-3">
                {filteredReports.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900">No reports found</h3>
                        <p className="text-slate-500">Try adjusting your search or generate a new report.</p>
                    </div>
                ) : (
                    filteredReports.map((report) => (
                        <div 
                            key={report.id}
                            className="group relative bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                {/* Left: Info */}
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                                        <FileText className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-slate-900">{report.reportNumber}</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border border-slate-200">
                                                {report.details.length} Line Items
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 text-xs text-slate-500 font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(report.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5" />
                                                Payee: <span className="text-slate-700">{report.cashAdvanceVoucher?.payee || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Banknote className="w-3.5 h-3.5" />
                                                Total: <span className="text-indigo-600 font-bold">{formatCurrency(report.totalAmount)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Actions */}
                                <div className="flex items-center gap-2 shrink-0 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                className="h-9 px-3 text-indigo-600 hover:bg-indigo-50"
                                            >
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                View PDF <ChevronDown className="w-3 h-3 ml-1" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                            <DropdownMenuItem onClick={() => reportExternalFVReportOfDisbursement(report)} className="cursor-pointer">
                                                <FileText className="w-4 h-4 mr-2 text-indigo-500" />
                                                Report of Disbursement
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => reportExternalSummaryByBarangay(report)} className="cursor-pointer">
                                                <FileText className="w-4 h-4 mr-2 text-emerald-500" />
                                                Summary by Barangay
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="h-9 px-3 text-red-600 hover:bg-red-50"
                                        onClick={() => setIsDeleting(report.id)}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </Button>
                                </div>
                                
                                <div className="lg:hidden mt-2 pt-2 border-t border-slate-100 flex justify-end">
                                    <ChevronRight className="w-4 h-4 text-slate-300" />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={!!isDeleting} onOpenChange={() => setIsDeleting(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the disbursement report
                            and restore the balance to the associated Cash Advance Voucher.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Delete Report
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
