"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createSettlement } from "@/lib/actions/foodvoucher-settlement";
import { Database, Calendar, Receipt, CheckSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function SettlementWorkspace({ unsettledAcks, userId }: { unsettledAcks: any[], userId: string }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedAcks, setSelectedAcks] = useState<string[]>([]);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [appliedDateFrom, setAppliedDateFrom] = useState('');
    const [appliedDateTo, setAppliedDateTo] = useState('');

    const toggleAck = (ackId: string) => {
        setSelectedAcks(prev =>
            prev.includes(ackId) ? prev.filter(id => id !== ackId) : [...prev, ackId]
        );
    };

    const handleSettle = async () => {
        const acksToSettle = unsettledAcks.filter((a: any) => selectedAcks.includes(a.id));
        if (acksToSettle.length === 0) return toast.error("Please select at least one AR");

        setIsSubmitting(true);
        const totalAmount = acksToSettle.reduce((sum: number, a: any) => {
            const amount = a.redemptionClaim?.totalAmount || a.vendorClaim?.totalAmount || 0;
            return sum + amount;
        }, 0);
        try {
            await createSettlement({
                amount: totalAmount,
                userId: userId,
                acknowledgementIds: acksToSettle.map((a: any) => a.id)
            });
            toast.success("Settlement generated successfully!");
            setSelectedAcks([]);
        } catch (error: any) {
            toast.error(error.message || "Failed to generate settlement");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredAcks = unsettledAcks.filter((ack: any) => {
        if (!appliedDateFrom && !appliedDateTo) return true;
        const ackDate = new Date(ack.createdAt);
        ackDate.setHours(0, 0, 0, 0);
        
        let isValid = true;
        if (appliedDateFrom) {
            const from = new Date(appliedDateFrom);
            from.setHours(0, 0, 0, 0);
            if (ackDate < from) isValid = false;
        }
        if (appliedDateTo) {
            const to = new Date(appliedDateTo);
            to.setHours(0, 0, 0, 0);
            if (ackDate > to) isValid = false;
        }
        return isValid;
    });

    if (filteredAcks.length === 0 && !appliedDateFrom && !appliedDateTo) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Database className="w-12 h-12 mb-4 opacity-20" />
                    <p>No pending Acknowledgement Receipts to settle.</p>
                </CardContent>
            </Card>
        );
    }

    const selectedForGroup = filteredAcks.filter((a: any) => selectedAcks.includes(a.id));
    const totalSelectedAmount = selectedForGroup.reduce((sum: number, a: any) => {
        const amount = a.redemptionClaim?.totalAmount || a.vendorClaim?.totalAmount || 0;
        return sum + amount;
    }, 0);

    const handleSearch = () => {
        setAppliedDateFrom(dateFrom);
        setAppliedDateTo(dateTo);
        // Ensure no selected items that are filtered out remain in the selection pool
        // This prevents creating a settlement with invisible ARs.
        setSelectedAcks([]);
    };

    return (
        <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50 border-b pb-4">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-emerald-600" />
                            Unliquidated Acknowledgement Receipts
                        </CardTitle>
                        <div className="text-sm text-slate-500 mt-1">
                            Select ARs below to group them into a single settlement.
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 bg-white p-2 border rounded-lg shadow-sm">
                            <div className="flex items-center gap-2">
                                <Label className="text-xs font-bold text-slate-500">From</Label>
                                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-xs w-32" />
                            </div>
                            <div className="flex items-center gap-2">
                                <Label className="text-xs font-bold text-slate-500">To</Label>
                                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-xs w-32" />
                            </div>
                            <Button size="sm" onClick={handleSearch} className="h-8 bg-slate-800 hover:bg-slate-900 text-white text-xs px-4">Search</Button>
                        </div>
                        
                        <div className="flex items-center justify-end gap-4">
                            {selectedAcks.length > 0 && (
                                <div className="text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                                    Selected Total: <span className="font-bold">₱{totalSelectedAmount.toLocaleString()}</span>
                                </div>
                            )}
                            <Button
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md gap-2 h-9"
                                onClick={handleSettle}
                                disabled={isSubmitting || selectedAcks.length === 0}
                            >
                                <CheckSquare className="w-4 h-4" />
                                Add to Settlement ({selectedAcks.length})
                            </Button>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead className="w-[50px] text-center"></TableHead>
                            <TableHead>AR Number</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Market</TableHead>
                            <TableHead>Date Created</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAcks.length > 0 ? filteredAcks.map((ack: any) => {
                            const isSelected = selectedAcks.includes(ack.id);
                            const vendorName = ack.redemptionClaim?.vendor?.vendorName || ack.vendorClaim?.vendorName || "Unknown";
                            const market = ack.redemptionClaim?.vendor?.market || ack.vendorClaim?.market || "Unknown";
                            const amount = ack.redemptionClaim?.totalAmount || ack.vendorClaim?.totalAmount || 0;

                            return (
                                <TableRow 
                                    key={ack.id} 
                                    className={`transition-colors cursor-pointer ${isSelected ? 'bg-emerald-50/50 hover:bg-emerald-50' : 'hover:bg-slate-50'}`}
                                    onClick={() => toggleAck(ack.id)}
                                >
                                    <TableCell className="text-center pl-4">
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => toggleAck(ack.id)}
                                            className="w-5 h-5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                        />
                                    </TableCell>
                                    <TableCell className="font-mono font-bold text-slate-700">
                                        {ack.arNumber}
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-900">
                                        {vendorName}
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-500 uppercase tracking-widest">
                                        {market}
                                    </TableCell>
                                    <TableCell className="text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(ack.createdAt).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="font-bold text-slate-900">₱{amount.toLocaleString()}</div>
                                        <Badge variant="outline" className="text-[10px] mt-1 bg-amber-50 text-amber-600 border-amber-200">UNPAID</Badge>
                                    </TableCell>
                                </TableRow>
                            );
                        }) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                    No records found matching the selected date range.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
