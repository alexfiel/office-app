"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Printer, Search, Database, Eye, Plus, X as XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ReportSettlement } from "./fvSettlementReport/reportSettlement";
import { createExternalFVLiquidation } from "@/lib/actions/external-fv-settlement";
import { ExternalSettlementActions } from "./externalSettlementActions";

export default function ExternalSettlementForLiquidation({ 
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
            <Card className="border-dashed border-slate-200">
                <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Database className="w-16 h-16 mb-4 opacity-10" />
                    <p className="text-lg font-medium">No settlements awaiting liquidation.</p>
                    <p className="text-sm opacity-60">Uploaded settlements with status 'forLiquidation' will appear here.</p>
                </CardContent>
            </Card>
        );
    }

    const selectedTotalAmount = filteredSettlements
        .filter(s => selectedIds.includes(s.id))
        .reduce((sum, s) => sum + s.totalAmount, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
                <div className="flex items-center gap-4 flex-1 w-full max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Search AR, Vendor, or Batch..."
                            className="pl-10 h-11 bg-white border-slate-200 focus:ring-blue-500 rounded-lg shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    {selectedIds.length > 0 && (
                        <Button 
                            onClick={() => setIsCreatingLiquidation(true)} 
                            className="flex-1 md:flex-none items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-6 shadow-lg shadow-emerald-100 transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            Create Liquidation ({selectedIds.length})
                        </Button>
                    )}
                    <Button 
                        onClick={handlePrint} 
                        variant="outline" 
                        className="flex-1 md:flex-none items-center gap-2 border-slate-200 h-11 px-6 bg-white hover:bg-slate-50 transition-all"
                    >
                        <Printer className="w-4 h-4" />
                        Print View
                    </Button>
                </div>
            </div>

            <Card className="shadow-sm border-slate-200 overflow-hidden rounded-xl">
                <CardHeader className="bg-slate-50/80 border-b print:bg-white py-6 px-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5">Treasury Operations</div>
                            <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">
                                Settlements For Liquidation
                            </CardTitle>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Pending Value</div>
                            <div className="text-3xl font-black text-slate-900 tabular-nums">
                                ₱{filteredSettlements.reduce((sum, s) => sum + s.totalAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-slate-50/50 border-b text-[10px] uppercase font-bold text-slate-500">
                                <tr>
                                    <th className="px-8 py-4 w-12 no-print">
                                        <Checkbox 
                                            checked={selectedIds.length === filteredSettlements.length && filteredSettlements.length > 0}
                                            onCheckedChange={toggleSelectAll}
                                            className="border-slate-300"
                                        />
                                    </th>
                                    <th className="px-6 py-4">AR Number</th>
                                    <th className="px-6 py-4">Batch Number</th>
                                    <th className="px-6 py-4">Vendor Name</th>
                                    <th className="px-6 py-4 text-center">Items</th>
                                    <th className="px-6 py-4 text-right">Total Amount</th>
                                    <th className="px-8 py-4 text-center no-print w-20">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredSettlements.map((s) => (
                                    <tr key={s.id} className={`hover:bg-slate-50/50 transition-colors group ${selectedIds.includes(s.id) ? 'bg-emerald-50/40' : ''}`}>
                                        <td className="px-8 py-4 no-print">
                                            <Checkbox 
                                                checked={selectedIds.includes(s.id)}
                                                onCheckedChange={() => toggleSelect(s.id)}
                                                className="border-slate-300"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => setViewReport(s)}
                                                className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline decoration-2 underline-offset-4"
                                            >
                                                {s.arNo}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-600">
                                            <Badge variant="outline" className="font-mono text-[10px] bg-slate-50/50 border-slate-200">
                                                {s.batchNo}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-800">{s.vendorName}</div>
                                            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
                                                {s.market || 'General'} • {s.stallNo || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                                                {s.totalTransactions}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-slate-900 tabular-nums">
                                            ₱{s.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-8 py-4 text-center no-print">
                                            <ExternalSettlementActions 
                                                settlement={s} 
                                                onViewDetails={() => setViewDetails(s)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Create Liquidation Sheet */}
            <Sheet open={isCreatingLiquidation} onOpenChange={setIsCreatingLiquidation}>
                <SheetContent side="right" className="sm:max-w-md border-l-emerald-100">
                    <SheetHeader className="pb-6 border-b">
                        <SheetTitle className="text-2xl font-black text-emerald-900">Create Liquidation</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-8 py-8">
                        <div className="bg-emerald-50/50 p-8 rounded-2xl border border-emerald-100 space-y-4 shadow-inner">
                            <div className="flex justify-between items-center">
                                <span className="text-emerald-700 font-bold uppercase text-[10px] tracking-widest">Selected ARs</span>
                                <span className="font-black text-emerald-900 text-xl">{selectedIds.length}</span>
                            </div>
                            <div className="pt-4 border-t border-emerald-100 flex justify-between items-end">
                                <span className="text-emerald-700 font-bold uppercase text-[10px] tracking-widest">Grand Total Value</span>
                                <span className="font-black text-emerald-900 text-3xl tabular-nums">₱{selectedTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                        
                        <div className="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-200">
                            <div className="flex items-start gap-3">
                                <Database className="w-5 h-5 text-blue-600 mt-1" />
                                <div className="space-y-1">
                                    <h4 className="font-bold text-slate-900 text-sm">System Generation</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        This action will group all selected ARs into a single liquidation batch and assign a unique Control Number.
                                    </p>
                                </div>
                            </div>
                            <div className="bg-white px-4 py-3 rounded-lg border border-slate-200 font-mono text-sm text-emerald-700 font-bold text-center shadow-sm">
                                CTO-FVLIQ-XXXXX
                            </div>
                        </div>

                        <div className="pt-6 space-y-3">
                            <Button 
                                onClick={handleCreateLiquidation} 
                                disabled={isSubmitting}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 h-14 text-lg font-black shadow-xl shadow-emerald-200/50 transition-all active:scale-[0.98] rounded-xl"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center gap-2">
                                        <XIcon className="w-5 h-5 animate-spin" />
                                        Processing...
                                    </div>
                                ) : "Confirm & Generate"}
                            </Button>
                            <Button 
                                variant="ghost" 
                                className="w-full text-slate-400 hover:text-slate-600 font-bold h-12" 
                                onClick={() => setIsCreatingLiquidation(false)}
                            >
                                Cancel and Return
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* View Details Sheet */}
            <Sheet open={!!viewDetails} onOpenChange={(o) => !o && setViewDetails(null)}>
                <SheetContent side="right" className="sm:max-w-xl p-0">
                    <div className="flex flex-col h-full bg-slate-50">
                        <SheetHeader className="p-8 bg-white border-b">
                            <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5">Settlement Details</div>
                            <SheetTitle className="text-2xl font-black text-slate-900">
                                AR <span className="font-mono text-blue-600 ml-2">{viewDetails?.arNo}</span>
                            </SheetTitle>
                        </SheetHeader>
                        <div className="flex-1 overflow-hidden p-6">
                            <div className="h-full bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
                                <div className="flex-1 overflow-y-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 border-b text-[10px] uppercase font-bold text-slate-500 sticky top-0 z-10">
                                            <tr>
                                                <th className="px-6 py-4">Voucher Code</th>
                                                <th className="px-6 py-4">Beneficiary</th>
                                                <th className="px-6 py-4 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {viewDetails?.details?.map((d: any) => (
                                                <tr key={d.id} className="hover:bg-blue-50/30 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">{d.voucherCode}</td>
                                                    <td className="px-6 py-4 font-semibold text-slate-900">{d.beneficiary}</td>
                                                    <td className="px-6 py-4 text-right font-black text-slate-900 tabular-nums">₱{d.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-6 bg-slate-50 border-t flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Items: {viewDetails?.details?.length}</span>
                                    <span className="text-xl font-black text-slate-900 tabular-nums">₱{viewDetails?.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-white border-t grid grid-cols-2 gap-4">
                            <Button variant="outline" onClick={() => setViewDetails(null)} className="h-12 font-bold rounded-xl border-slate-200">Close</Button>
                            <Button onClick={() => setViewReport(viewDetails)} className="bg-slate-900 hover:bg-black text-white h-12 font-bold shadow-lg rounded-xl">
                                <Printer className="w-4 h-4 mr-2" />
                                Print Document
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* View Report Sheet - Fluid */}
            <Sheet open={!!viewReport} onOpenChange={(o) => !o && setViewReport(null)}>
                <SheetContent side="right" className="sm:max-w-[90%] md:max-w-[900px] p-0 bg-slate-100/50">
                    <div className="flex flex-col h-full bg-white">
                        <div className="sticky top-0 bg-white/95 backdrop-blur-md p-6 border-b flex justify-between items-center no-print z-10 shadow-sm">
                            <div>
                                <SheetTitle className="text-2xl font-black text-slate-900 tracking-tight">Document Preview</SheetTitle>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Settlement Report Generation</p>
                            </div>
                            <div className="flex gap-3">
                                <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-100 h-11 px-8 font-black rounded-xl transition-all active:scale-95">
                                    <Printer className="w-4 h-4 mr-2" />
                                    Print Now
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setViewReport(null)} className="h-11 w-11 border border-slate-200 hover:bg-slate-100 rounded-xl">
                                    <XIcon className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-slate-100/30 p-4 md:p-16">
                            <div className="max-w-4xl mx-auto bg-white shadow-2xl border border-slate-100 rounded-sm overflow-hidden">
                                {viewReport && (
                                    <ReportSettlement settlement={viewReport} userName={userName} />
                                )}
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                }
            `}</style>
        </div>
    );
}
