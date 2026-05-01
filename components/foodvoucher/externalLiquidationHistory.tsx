"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Printer, Calendar, Search, Database, Eye, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getExternalLiquidations } from "@/lib/actions/external-fv-settlement";
import { ReportExternalLiquidation } from "./fvSettlementReport/reportExternalLiquidation";
import { ReportExternalLiquidationSummary } from "./fvSettlementReport/reportExternalLiquidationSummary";
import { toast } from "sonner";

export default function ExternalLiquidationHistory({ userName = "Unknown User" }: { userName?: string }) {
    const [liquidations, setLiquidations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [viewLiquidation, setViewLiquidation] = useState<any>(null);
    const [viewListReport, setViewListReport] = useState(false);

    const fetchLiquidations = async () => {
        setIsLoading(true);
        try {
            const data = await getExternalLiquidations(
                startDate ? new Date(startDate) : undefined,
                endDate ? new Date(endDate) : undefined
            );
            setLiquidations(data);
        } catch (e: any) {
            toast.error("Failed to load liquidations");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLiquidations();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-end gap-4 no-print">
                <div className="flex items-end gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Date</label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="w-40"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End Date</label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="w-40"
                        />
                    </div>
                    <Button onClick={fetchLiquidations} variant="secondary">Filter</Button>
                </div>
                <Button onClick={() => setViewListReport(true)} variant="outline" className="flex items-center gap-2 border-slate-200">
                    <Printer className="w-4 h-4" />
                    Print List Summary
                </Button>
            </div>

            <Card className="shadow-sm border-slate-200">
                <CardHeader className="bg-slate-50 border-b">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Liquidation History</div>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <FileText className="w-5 h-5 text-emerald-600" />
                                Liquidated Batches
                            </CardTitle>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Liquidated</div>
                            <div className="text-2xl font-black text-slate-900">
                                ₱{liquidations.reduce((sum, l) => sum + l.totalAmount, 0).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b text-xs uppercase font-bold text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 w-10"></th>
                                    <th className="px-6 py-4">Control No.</th>
                                    <th className="px-6 py-4">Date Liquidated</th>
                                    <th className="px-6 py-4">Settlements</th>
                                    <th className="px-6 py-4">Liquidator</th>
                                    <th className="px-6 py-4 text-right">Grand Total</th>
                                    <th className="px-6 py-4 text-center no-print">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">Loading...</td>
                                    </tr>
                                ) : liquidations.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">No liquidation records found for the selected range.</td>
                                    </tr>
                                ) : (
                                    liquidations.map((l) => (
                                        <React.Fragment key={l.id}>
                                            <tr className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <button onClick={() => toggleExpand(l.id)} className="text-slate-400 hover:text-slate-600">
                                                        {expandedId === l.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 font-mono font-black text-slate-900">{l.liquidationNo}</td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    {new Date(l.createdAt).toLocaleDateString()} {new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className="bg-slate-50">{l.settlements.length} Settlements</Badge>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">{l.user?.name}</td>
                                                <td className="px-6 py-4 text-right font-black text-emerald-700">₱{l.totalAmount.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-center no-print">
                                                    <Button variant="ghost" size="sm" onClick={() => setViewLiquidation(l)} className="h-8">
                                                        <Printer className="w-3.5 h-3.5 mr-1" />
                                                        Print
                                                    </Button>
                                                </td>
                                            </tr>
                                            {expandedId === l.id && (
                                                <tr className="bg-slate-50/50">
                                                    <td colSpan={7} className="px-12 py-4">
                                                        <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
                                                            <table className="w-full text-xs">
                                                                <thead className="bg-slate-100 border-b font-bold text-slate-600">
                                                                    <tr>
                                                                        <th className="px-4 py-2">AR No.</th>
                                                                        <th className="px-4 py-2">Batch</th>
                                                                        <th className="px-4 py-2">Vendor</th>
                                                                        <th className="px-4 py-2 text-right">Amount</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-100">
                                                                    {l.settlements.map((s: any) => (
                                                                        <tr key={s.id}>
                                                                            <td className="px-4 py-2 font-mono">{s.arNo}</td>
                                                                            <td className="px-4 py-2">{s.batchNo}</td>
                                                                            <td className="px-4 py-2">{s.vendorName}</td>
                                                                            <td className="px-4 py-2 text-right font-bold">₱{s.totalAmount.toLocaleString()}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* View/Print Liquidation Dialog */}
            <Dialog open={!!viewLiquidation} onOpenChange={(o) => !o && setViewLiquidation(null)}>
                <DialogContent className="max-w-[80vw] max-h-[90vh] overflow-y-auto [&>button]:hidden">
                    <DialogHeader className="no-print border-b pb-4 mb-4">
                        <DialogTitle className="flex items-center justify-between">
                            <span className="text-xl font-bold">Liquidation No: {viewLiquidation?.liquidationNo}</span>

                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-0">
                        {viewLiquidation && (
                            <ReportExternalLiquidation
                                liquidation={viewLiquidation}
                                userName={userName}
                            />
                        )}
                    </div>

                    <div className="flex justify-end p-4 border-t no-print">
                        <Button variant="destructive" onClick={() => setViewLiquidation(null)}>Close Preview</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* View/Print List Summary Dialog */}
            <Dialog open={viewListReport} onOpenChange={setViewListReport}>
                <DialogContent className="max-w-[50vw] max-h-[90vh] overflow-y-auto [&>button]:hidden">
                    <DialogHeader className="no-print border-b pb-4 mb-4">
                        <DialogTitle className="flex items-center justify-between">
                            <span className="text-xl font-bold">Consolidated Liquidation Summary</span>
                            <div className="flex gap-2">
                                <Button variant="destructive" size="sm" onClick={() => setViewListReport(false)}>Close</Button>
                                <Button size="sm" onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700">
                                    <Printer className="w-4 h-4 mr-2" />
                                    Print
                                </Button>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-0">
                        <ReportExternalLiquidationSummary
                            liquidations={liquidations}
                            userName={userName}
                            startDate={startDate}
                            endDate={endDate}
                        />
                    </div>

                    <div className="flex justify-end p-4 border-t no-print">
                        <Button variant="destructive" onClick={() => setViewListReport(false)}>Close Preview</Button>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}
