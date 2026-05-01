"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Printer, Calendar, Search, Database, Eye, Plus, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ReportSettlement } from "./fvSettlementReport/reportSettlement";
import { createExternalFVLiquidation } from "@/lib/actions/external-fv-settlement";

export default function ExternalSettlementReport({ 
    settlements, 
    userId,
    userName = "Unknown User" 
}: { 
    settlements: any[], 
    userId: string,
    userName?: string 
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isCreatingLiquidation, setIsCreatingLiquidation] = useState(false);
    const [liquidationNo, setLiquidationNo] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [viewDetails, setViewDetails] = useState<any>(null);
    const [viewReport, setViewReport] = useState<any>(null);

    const filteredSettlements = settlements.filter(s => {
        const search = searchTerm.toLowerCase();
        return (
            s.arNo.toLowerCase().includes(search) ||
            s.vendorName.toLowerCase().includes(search) ||
            s.batchNo.toLowerCase().includes(search)
        );
    });

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredSettlements.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredSettlements.map(s => s.id));
        }
    };

    const handleCreateLiquidation = async () => {
        if (selectedIds.length === 0) {
            toast.error("Please select at least one settlement");
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await createExternalFVLiquidation(userId, selectedIds);
            if (result.success) {
                toast.success("Liquidation created successfully");
                setIsCreatingLiquidation(false);
                setSelectedIds([]);
            }
        } catch (e: any) {
            toast.error(e.message || "Failed to create liquidation");
        } finally {
            setIsSubmitting(false);
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
                    <p>No settlements awaiting liquidation.</p>
                </CardContent>
            </Card>
        );
    }

    const selectedSettlementsCount = selectedIds.length;
    const selectedTotalAmount = filteredSettlements
        .filter(s => selectedIds.includes(s.id))
        .reduce((sum, s) => sum + s.totalAmount, 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end no-print">
                <div className="flex items-center gap-4 flex-1 max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Search AR, Vendor, or Batch..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    {selectedIds.length > 0 && (
                        <Button 
                            onClick={() => setIsCreatingLiquidation(true)} 
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
                        >
                            <Plus className="w-4 h-4" />
                            Create Liquidation ({selectedIds.length})
                        </Button>
                    )}
                    <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2 border-slate-200">
                        <Printer className="w-4 h-4" />
                        Print View
                    </Button>
                </div>
            </div>

            <Card className="shadow-sm border-slate-200">
                <CardHeader className="bg-slate-50 border-b print:bg-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">External Settlements</div>
                            <CardTitle className="text-xl font-bold">
                                For Liquidation
                            </CardTitle>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Pending Amount</div>
                            <div className="text-2xl font-black text-slate-900">
                                ₱{filteredSettlements.reduce((sum, s) => sum + s.totalAmount, 0).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b text-xs uppercase font-bold text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 no-print">
                                        <Checkbox 
                                            checked={selectedIds.length === filteredSettlements.length && filteredSettlements.length > 0}
                                            onCheckedChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="px-6 py-4">AR No.</th>
                                    <th className="px-6 py-4">Batch No.</th>
                                    <th className="px-6 py-4">Vendor</th>
                                    <th className="px-6 py-4 text-center">Vouchers</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-center no-print">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredSettlements.map((s) => (
                                    <tr key={s.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(s.id) ? 'bg-emerald-50/30' : ''}`}>
                                        <td className="px-6 py-4 no-print">
                                            <Checkbox 
                                                checked={selectedIds.includes(s.id)}
                                                onCheckedChange={() => toggleSelect(s.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 font-mono font-bold text-slate-900">
                                            <button 
                                                onClick={() => setViewReport(s)}
                                                className="text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                {s.arNo}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{s.batchNo}</td>
                                        <td className="px-6 py-4 text-slate-600">{s.vendorName}</td>
                                        <td className="px-6 py-4 text-center font-medium">{s.totalTransactions}</td>
                                        <td className="px-6 py-4 text-right font-black text-slate-900">
                                            ₱{s.totalAmount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center no-print">
                                            <Button variant="ghost" size="sm" onClick={() => setViewDetails(s)} className="h-8">
                                                <Eye className="w-3.5 h-3.5 mr-1" />
                                                Details
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Create Liquidation Dialog */}
            <Dialog open={isCreatingLiquidation} onOpenChange={setIsCreatingLiquidation}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Liquidation Record</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 text-sm">
                            <div className="flex justify-between text-slate-500">
                                <span>Selected Settlements:</span>
                                <span className="font-bold text-slate-900">{selectedIds.length}</span>
                            </div>
                            <div className="flex justify-between text-slate-500">
                                <span>Total Amount:</span>
                                <span className="font-bold text-slate-900">₱{selectedTotalAmount.toLocaleString()}</span>
                            </div>
                        </div>
                        
                        <div className="space-y-2 py-2">
                            <p className="text-sm text-slate-600">
                                The system will automatically generate a new Liquidation Control Number using the format <code className="bg-slate-100 px-1 rounded text-emerald-700">CTO-FVLIQ-XXXXX</code>.
                            </p>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => setIsCreatingLiquidation(false)}>Cancel</Button>
                            <Button 
                                onClick={handleCreateLiquidation} 
                                disabled={isSubmitting}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                {isSubmitting ? "Creating..." : "Confirm & Generate Number"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* View Details Dialog */}
            <Dialog open={!!viewDetails} onOpenChange={(o) => !o && setViewDetails(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Settlement Details: {viewDetails?.arNo}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">Voucher Code</th>
                                        <th className="px-4 py-3">Beneficiary</th>
                                        <th className="px-4 py-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {viewDetails?.details?.map((d: any) => (
                                        <tr key={d.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-mono text-xs">{d.voucherCode}</td>
                                            <td className="px-4 py-3">{d.beneficiary}</td>
                                            <td className="px-4 py-3 text-right font-bold">₱{d.amount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => setViewDetails(null)}>Close</Button>
                            <Button onClick={() => setViewReport(viewDetails)} className="bg-slate-800 hover:bg-slate-900">
                                <Printer className="w-4 h-4 mr-2" />
                                Print Settlement
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* View Report Dialog */}
            <Dialog open={!!viewReport} onOpenChange={(o) => !o && setViewReport(null)}>
                <DialogContent className="max-w-4xl p-0 bg-white">
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
                    <div className="p-8">
                        {viewReport && (
                            <ReportSettlement settlement={viewReport} userName={userName} />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                }
            `}</style>
        </div>
    );
}
