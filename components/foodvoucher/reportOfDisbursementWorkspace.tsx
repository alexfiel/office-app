"use client"

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createReportOfDisbursement } from "@/lib/actions/external-fv-report";
import { getBarangayFromVoucherCode } from "@/lib/utils/barangayParser";
import { generateRODPDF } from "./fvSettlementReport/reportExternalDisbursement";
import { FileText, Save, CheckSquare, Square, Banknote } from "lucide-react";

type Liquidation = any;
type CashAdvance = any;

export default function ReportOfDisbursementWorkspace({ 
    liquidations, 
    cashAdvances, 
    userId 
}: { 
    liquidations: Liquidation[], 
    cashAdvances: CashAdvance[], 
    userId: string 
}) {
    const [selectedLiqIds, setSelectedLiqIds] = useState<string[]>([]);
    const [selectedCashAdvanceId, setSelectedCashAdvanceId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter liquidations based on selection
    const selectedLiquidations = useMemo(() => {
        return liquidations.filter(liq => selectedLiqIds.includes(liq.id));
    }, [liquidations, selectedLiqIds]);

    // Calculate grouping by Barangay
    const groupedData = useMemo(() => {
        const groups: Record<string, { 
            barangay: string, 
            noOfVouchers: number, 
            amount: number, 
            liquidationIds: string[],
            details: { liquidationId: string, liquidationNo: string, liquidationDate: Date, noOfVouchers: number, amount: number }[]
        }> = {};
        
        selectedLiquidations.forEach(liq => {
            const liqBreakdown: Record<string, { count: number, amount: number }> = {};
            
            liq.settlements.forEach((settlement: any) => {
                settlement.transactions.forEach((tx: any) => {
                    const barangay = getBarangayFromVoucherCode(tx.voucherCode);
                    
                    if (!liqBreakdown[barangay]) {
                        liqBreakdown[barangay] = { count: 0, amount: 0 };
                    }
                    liqBreakdown[barangay].count += 1;
                    liqBreakdown[barangay].amount += tx.amount;

                    if (!groups[barangay]) {
                        groups[barangay] = {
                            barangay,
                            noOfVouchers: 0,
                            amount: 0,
                            liquidationIds: [],
                            details: []
                        };
                    }
                    groups[barangay].noOfVouchers += 1;
                    groups[barangay].amount += tx.amount;
                    if (!groups[barangay].liquidationIds.includes(liq.id)) {
                        groups[barangay].liquidationIds.push(liq.id);
                    }
                });
            });

            // Add the breakdown for this liquidation to the groups it belongs to
            Object.entries(liqBreakdown).forEach(([brgy, stats]) => {
                groups[brgy].details.push({
                    liquidationId: liq.id,
                    liquidationNo: liq.liquidationNo,
                    liquidationDate: liq.createdAt,
                    noOfVouchers: stats.count,
                    amount: stats.amount
                });
            });
        });

        return Object.values(groups).sort((a, b) => a.barangay.localeCompare(b.barangay));
    }, [selectedLiquidations]);

    const handleSelectAll = () => {
        if (selectedLiqIds.length === liquidations.length) {
            setSelectedLiqIds([]);
        } else {
            setSelectedLiqIds(liquidations.map(l => l.id));
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedLiqIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleCreateReport = async () => {
        if (!selectedCashAdvanceId) {
            return toast.error("Please select a Cash Advance Voucher to deduct from.");
        }
        if (groupedData.length === 0) {
            return toast.error("No data to report.");
        }

        const totalAmount = groupedData.reduce((sum, g) => sum + g.amount, 0);
        const cashAdvance = cashAdvances.find(ca => ca.id === selectedCashAdvanceId);
        
        if (cashAdvance && cashAdvance.balance < totalAmount) {
            return toast.error(`Insufficient balance. Total: ${formatCurrency(totalAmount)}, CA Balance: ${formatCurrency(cashAdvance.balance)}`);
        }

        setIsSubmitting(true);
        try {
            const createdReport = await createReportOfDisbursement({
                cashAdvanceVoucherId: selectedCashAdvanceId,
                liquidationIds: selectedLiqIds,
                reportGroups: groupedData,
                userId
            });

            toast.success(`Successfully generated report ${createdReport.reportNumber}!`);
            
            // Trigger PDF Download
            generateRODPDF(createdReport);

            setSelectedLiqIds([]);
        } catch (error: any) {
            toast.error(error.message || "Failed to create reports");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Panel: Selection and Form */}
            <div className="xl:col-span-1 space-y-6">
                
                {/* Funding Source (Now on Top) */}
                <div className="border rounded-xl p-6 bg-slate-50 shadow-sm border-indigo-100">
                    <div className="flex items-center gap-2 mb-4 text-indigo-700">
                        <Banknote className="w-5 h-5" />
                        <h2 className="text-lg font-bold">Funding Source</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Cash Advance / Accountable Officer</Label>
                            <Select value={selectedCashAdvanceId} onValueChange={setSelectedCashAdvanceId}>
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Select Accountable Officer..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {cashAdvances.length === 0 ? (
                                        <SelectItem value="none" disabled>No active cash advances</SelectItem>
                                    ) : (
                                        cashAdvances.map(ca => (
                                            <SelectItem key={ca.id} value={ca.id}>
                                                <div className="flex flex-col">
                                                    <span className="font-bold">{ca.payee}</span>
                                                    <span className="text-[10px] text-slate-500">{ca.referenceNumber} • Bal: {formatCurrency(ca.balance)}</span>
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        {!selectedCashAdvanceId && (
                            <p className="text-[11px] text-rose-500 font-medium animate-pulse">
                                * Please select a funding source to enable report generation.
                            </p>
                        )}
                    </div>
                </div>

                {/* Batches Selection */}
                <div className={`border rounded-xl p-4 bg-white shadow-sm transition-opacity ${!selectedCashAdvanceId ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Select Batches</h3>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleSelectAll} 
                            className="h-7 text-xs"
                            disabled={!selectedCashAdvanceId}
                        >
                            {selectedLiqIds.length === liquidations.length ? "Deselect All" : "Select All"}
                        </Button>
                    </div>
                    
                    {liquidations.length === 0 ? (
                        <p className="text-sm text-slate-500 italic">No pending liquidated batches available.</p>
                    ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                            {liquidations.map(liq => (
                                <label key={liq.id} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-slate-50 cursor-pointer transition-colors">
                                    <Checkbox 
                                        checked={selectedLiqIds.includes(liq.id)}
                                        onCheckedChange={() => toggleSelection(liq.id)}
                                        className="mt-1"
                                        disabled={!selectedCashAdvanceId}
                                    />
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm text-slate-800">{liq.liquidationNo}</p>
                                        <p className="text-xs text-slate-500 font-medium">{formatCurrency(liq.totalAmount)}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Generate Action Block */}
                <div className={`border rounded-xl p-6 bg-indigo-600 text-white shadow-md transition-all ${(!selectedCashAdvanceId || selectedLiqIds.length === 0) ? 'opacity-50 grayscale pointer-events-none translate-y-2' : 'opacity-100 translate-y-0'}`}>
                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-indigo-200" />
                        <h2 className="text-lg font-bold">Generate Reports</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="p-3 bg-white/10 rounded-lg border border-white/10">
                            <div className="flex justify-between items-center text-xs text-indigo-100 uppercase tracking-wider mb-1">
                                <span>Total Amount:</span>
                                <span className="font-bold text-white">{formatCurrency(groupedData.reduce((sum, g) => sum + g.amount, 0))}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-indigo-100 uppercase tracking-wider">
                                <span>Detail Rows:</span>
                                <span className="font-bold text-white">
                                    {groupedData.reduce((sum, g) => sum + g.details.length, 0)}
                                </span>
                            </div>
                        </div>

                        <Button 
                            className="w-full bg-white text-indigo-700 hover:bg-indigo-50 font-bold py-6 shadow-lg"
                            onClick={handleCreateReport}
                            disabled={isSubmitting || groupedData.length === 0}
                        >
                            <Save className="w-5 h-5 mr-2" />
                            {isSubmitting ? "Processing..." : "Generate & Save Report"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Right Panel: Preview Table */}
            <div className="xl:col-span-2">
                <div className="border rounded-xl bg-white shadow-sm overflow-hidden h-full flex flex-col">
                    <div className="p-4 border-b bg-indigo-50/50 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span className="font-bold text-slate-700 uppercase tracking-wider text-xs">Report Preview (Grouped by Barangay)</span>
                    </div>
                    
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b bg-slate-50/50">
                                    <th className="p-4 font-bold text-slate-500 text-[10px] uppercase tracking-widest">Barangay</th>
                                    <th className="p-4 font-bold text-slate-500 text-[10px] uppercase tracking-widest text-center">No. of Vouchers</th>
                                    <th className="p-4 font-bold text-slate-500 text-[10px] uppercase tracking-widest text-right">Total Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {groupedData.map((item, idx) => (
                                    <tr key={`${item.barangay}_${idx}`} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 font-bold text-slate-900">{item.barangay}</td>
                                        <td className="p-4 text-center text-slate-600 font-medium">{item.noOfVouchers}</td>
                                        <td className="p-4 text-right font-bold text-indigo-700">{formatCurrency(item.amount)}</td>
                                    </tr>
                                ))}
                                {groupedData.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="p-16 text-center text-slate-400 italic">
                                            Select batches from the left panel to preview the grouped disbursement report.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {groupedData.length > 0 && (
                                <tfoot>
                                    <tr className="bg-indigo-50/50 border-t-2 border-indigo-100">
                                        <td className="p-4 text-right font-bold text-indigo-900 uppercase text-xs tracking-wider">Grand Total:</td>
                                        <td className="p-4 text-center font-bold text-indigo-900">
                                            {groupedData.reduce((sum, item) => sum + item.noOfVouchers, 0)}
                                        </td>
                                        <td className="p-4 text-right font-black text-rose-600 text-base">
                                            {formatCurrency(groupedData.reduce((sum, item) => sum + item.amount, 0))}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
