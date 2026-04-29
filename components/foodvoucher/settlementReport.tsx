"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Printer, Calendar, Search, Database, Edit2, Trash2, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { updateSettlement, deleteSettlement } from "@/lib/actions/foodvoucher-settlement";
import { toast } from "sonner";
import { ReportSettlement } from "./fvSettlementReport/reportSettlement";

export default function SettlementReport({ settlements, userRole, userName = "Unknown User" }: { settlements: any[], userRole?: string, userName?: string }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSettlements = settlements.filter(s => {
        const search = searchTerm.toLowerCase();
        return (
            s.arNumber.toLowerCase().includes(search) ||
            s.details?.some((d: any) => d.vendorName.toLowerCase().includes(search) || d.arNumber.toLowerCase().includes(search))
        );
    });

    const totalSettled = filteredSettlements.reduce((sum, s) => sum + s.amount, 0);

    const [isEditing, setIsEditing] = useState<any>(null);
    const [editForm, setEditForm] = useState({ amount: 0 });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [viewDetails, setViewDetails] = useState<any>(null);
    const [viewReport, setViewReport] = useState<any>(null);

    const openEdit = (s: any) => {
        setEditForm({ amount: s.amount });
        setIsEditing(s);
    };

    const handleUpdate = async () => {
        if (!isEditing) return;
        setIsSubmitting(true);
        try {
            await updateSettlement(isEditing.id, {
                amount: Number(editForm.amount)
            });
            toast.success("Settlement updated");
            setIsEditing(null);
        } catch (e: any) {
            toast.error("Failed to update settlement");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this settlement? This will unlink the ARs and revert them to APPROVED status.")) return;
        try {
            await deleteSettlement(id);
            toast.success("Settlement deleted successfully");
        } catch (e: any) {
            toast.error("Failed to delete settlement");
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (settlements.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Database className="w-12 h-12 mb-4 opacity-20" />
                    <p>No settlements recorded yet.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end no-print">
                <div className="flex items-center gap-4 flex-1 max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Search vendor or control no..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <Button onClick={handlePrint} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900">
                    <Printer className="w-4 h-4" />
                    Print Report
                </Button>
            </div>

            <Card className="shadow-sm border-slate-200">
                <CardHeader className="bg-slate-50 border-b print:bg-white print:border-b-2 print:border-black">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 print:text-black">Report Summary</div>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                Liquidation Report
                            </CardTitle>
                            <div className="text-sm text-slate-500 mt-1 print:text-black">
                                Total Records: {filteredSettlements.length}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 print:text-black">Total Amount Settled</div>
                            <div className="text-2xl font-black text-slate-900">₱{totalSettled.toLocaleString()}</div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b text-xs uppercase font-bold text-slate-500 print:bg-white print:text-black">
                                <tr>
                                    <th className="px-6 py-4">Settlement No.</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4">Settlement Date</th>
                                    <th className="px-6 py-4 text-center no-print">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 print:divide-black">
                                {filteredSettlements.map((settlement) => (
                                    <tr key={settlement.id} className="hover:bg-slate-50 print:hover:bg-white">
                                        <td className="px-6 py-4 font-mono font-bold text-slate-900">
                                            <button 
                                                onClick={() => setViewReport(settlement)}
                                                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors focus:outline-none"
                                            >
                                                {settlement.arNumber}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-slate-900">
                                            ₱{settlement.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3 h-3 text-slate-400 no-print" />
                                                {new Date(settlement.datePaid).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center no-print">
                                            <div className="flex justify-center items-center gap-2">
                                                <Button variant="outline" size="sm" onClick={() => setViewDetails(settlement)} className="flex items-center gap-1 h-8">
                                                    <Eye className="w-3.5 h-3.5" />
                                                    View Details
                                                </Button>
                                                {userRole === 'ADMIN' && (
                                                    <>
                                                        <Button variant="ghost" size="icon" onClick={() => openEdit(settlement)} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(settlement.id)} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredSettlements.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            No matching records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t font-black text-slate-900 print:bg-white print:border-t-2 print:border-black">
                                <tr>
                                    <td className="px-6 py-4 text-right uppercase tracking-widest text-[10px] font-bold">Grand Total</td>
                                    <td className="px-6 py-4 text-right text-lg font-black text-slate-900">₱{totalSettled.toLocaleString()}</td>
                                    <td colSpan={2} className="no-print"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; padding: 0 !important; margin: 0 !important; }
                    @page { margin: 1cm; size: auto; }
                }
            `}</style>

            <Dialog open={!!isEditing} onOpenChange={(o) => !o && setIsEditing(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Settlement: {isEditing?.arNumber}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Amount</Label>
                            <Input type="number" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: Number(e.target.value) })} />
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => setIsEditing(null)}>Cancel</Button>
                            <Button onClick={handleUpdate} disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={!!viewDetails} onOpenChange={(o) => !o && setViewDetails(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Settlement Details: {viewDetails?.arNumber}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        {viewDetails?.details?.length > 0 ? (
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3">Vendor</th>
                                            <th className="px-4 py-3">Market</th>
                                            <th className="px-4 py-3">Stall No.</th>
                                            <th className="px-4 py-3">AR Number</th>
                                            <th className="px-4 py-3 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {viewDetails.details.map((d: any) => (
                                            <tr key={d.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-medium text-slate-900">{d.vendorName || "N/A"}</td>
                                                <td className="px-4 py-3 text-slate-600">{d.market || "N/A"}</td>
                                                <td className="px-4 py-3 text-slate-600">{d.stallNo || "N/A"}</td>
                                                <td className="px-4 py-3 font-mono text-slate-600 text-xs">{d.arNumber || "N/A"}</td>
                                                <td className="px-4 py-3 text-right font-black text-slate-900">₱{(d.amount || 0).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-50 border-t font-black text-slate-900">
                                        <tr>
                                            <td colSpan={4} className="px-4 py-3 text-right uppercase tracking-widest text-[10px] font-bold">Subtotal</td>
                                            <td className="px-4 py-3 text-right text-base font-black text-slate-900">
                                                ₱{viewDetails.details.reduce((sum: number, d: any) => sum + (d.amount || 0), 0).toLocaleString()}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500">No details found for this settlement.</div>
                        )}
                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => setViewDetails(null)}>Close</Button>
                            <Button onClick={() => {
                                setViewReport(viewDetails);
                            }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                <Printer className="w-4 h-4 mr-2" />
                                Print Settlement
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Print Report Dialog */}
            <Dialog open={!!viewReport} onOpenChange={(o) => !o && setViewReport(null)}>
                <DialogContent className="max-w-4xl p-0 bg-transparent border-none shadow-none print:max-w-none print:w-full print:bg-white print:p-0">
                    <div className="bg-white rounded-lg overflow-hidden h-full max-h-[90vh] overflow-y-auto relative p-0 print:overflow-visible print:max-h-none print:p-0">
                        <div className="sticky top-0 bg-slate-100 p-4 border-b flex justify-between items-center no-print z-10">
                            <DialogTitle>Print Settlement Report</DialogTitle>
                            <div className="flex gap-2">
                                <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700">
                                    <Printer className="w-4 h-4 mr-2" />
                                    Print
                                </Button>
                                <Button variant="outline" onClick={() => setViewReport(null)}>Close</Button>
                            </div>
                        </div>
                        <div className="p-8 print:p-0">
                            {viewReport && (
                                <ReportSettlement settlement={viewReport} userName={userName} />
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
