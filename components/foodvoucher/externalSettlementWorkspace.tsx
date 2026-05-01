"use client"

import React, { useState } from 'react';
import Papa from 'papaparse';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { uploadExternalSettlements, ExternalSettlementData, ExternalTransactionData } from "@/lib/actions/external-fv-settlement";
import { FileUp, Database, Table as TableIcon, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface CSVRow {
    [key: string]: string;
}

export default function ExternalSettlementWorkspace({ userId }: { userId: string }) {
    const [isUploading, setIsUploading] = useState(false);
    const [parsedData, setParsedData] = useState<ExternalSettlementData[]>([]);
    const [rawData, setRawData] = useState<CSVRow[]>([]);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStatusMessage({ type: 'info', text: "Parsing CSV..." });

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const rows = results.data as CSVRow[];
                setRawData(rows);
                
                // Group by AR Number
                const grouped = rows.reduce((acc: { [key: string]: ExternalSettlementData }, row) => {
                    // Normalize keys
                    const cleanRow: any = {};
                    Object.keys(row).forEach(key => {
                        const normalizedKey = key.toLowerCase().replace(/[\s_]/g, '');
                        cleanRow[normalizedKey] = row[key];
                    });

                    const arNo = cleanRow.arno || cleanRow.ar_no || cleanRow.referenceno || "";
                    if (!arNo) return acc;

                    if (!acc[arNo]) {
                        acc[arNo] = {
                            arNo: arNo,
                            batchNo: cleanRow.batchnumber || cleanRow.batchno || cleanRow.batch_no || "N/A",
                            vendorName: cleanRow.vendorname || cleanRow.vendor || "Unknown Vendor",
                            totalTransactions: 0,
                            totalAmount: 0,
                            datePaid: cleanRow.datepaid || cleanRow.createdat || cleanRow.date || new Date().toISOString(),
                            market: cleanRow.market || "",
                            stallNo: cleanRow.stallno || cleanRow.stall_no || "",
                            transactions: []
                        };
                    }

                    const transAmount = parseFloat(cleanRow.amount || "0");
                    const transaction: ExternalTransactionData = {
                        voucherCode: cleanRow.vouchercode || cleanRow.voucher || "",
                        beneficiary: cleanRow.beneficiaryname || cleanRow.beneficiary || cleanRow.name || "Unknown",
                        amount: transAmount,
                        createdAt: cleanRow.createdat || cleanRow.date || new Date().toISOString()
                    };

                    acc[arNo].transactions.push(transaction);
                    acc[arNo].totalAmount += transAmount;
                    acc[arNo].totalTransactions += 1;

                    return acc;
                }, {});

                const settlementList = Object.values(grouped);
                setParsedData(settlementList);
                setStatusMessage({ 
                    type: 'success', 
                    text: `Successfully parsed ${rows.length} rows into ${settlementList.length} settlements.` 
                });
                toast.success("CSV parsed successfully!");
            },
            error: (error) => {
                setStatusMessage({ type: 'error', text: "Error parsing CSV: " + error.message });
                toast.error("Failed to parse CSV");
            }
        });
    };

    const handleConfirmUpload = async () => {
        if (parsedData.length === 0) return;

        setIsUploading(true);
        try {
            const result = await uploadExternalSettlements(userId, parsedData);
            toast.success(`Successfully uploaded ${result.count} settlements!`);
            setParsedData([]);
            setRawData([]);
            setStatusMessage({ type: 'success', text: `Upload complete! ${result.count} settlements saved.` });
        } catch (error: any) {
            toast.error(error.message || "Upload failed");
            setStatusMessage({ type: 'error', text: "Upload error: " + error.message });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <FileUp className="w-5 h-5 text-blue-600" />
                        CSV Liquidation Upload
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Select External Settlement CSV</label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-lg shadow-sm transition-all"
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 italic">
                                Required columns: ar_no, batch_number, vendor_name, voucher_code, beneficiary_name, amount
                            </p>
                        </div>
                        
                        <Button 
                            onClick={handleConfirmUpload}
                            disabled={isUploading || parsedData.length === 0}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-11 font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:bg-slate-400"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    {parsedData.length > 0 ? `Upload ${parsedData.length} Settlements` : 'Upload Settlements'}
                                </>
                            )}
                        </Button>
                    </div>

                    {statusMessage && (
                        <div className={`mt-6 p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border ${
                            statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                            statusMessage.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 
                            'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                            {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : 
                             statusMessage.type === 'error' ? <AlertCircle className="w-5 h-5" /> : 
                             <Database className="w-5 h-5" />}
                            <span className="text-sm font-medium">{statusMessage.text}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {parsedData.length > 0 && (
                <Card className="border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b py-3">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <TableIcon className="w-4 h-4 text-slate-500" />
                                Data Preview (Grouped by AR)
                            </CardTitle>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 font-bold">
                                {parsedData.reduce((acc, curr) => acc + curr.transactions.length, 0)} Total Transactions
                            </Badge>
                        </div>
                    </CardHeader>
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="font-bold">AR Number</TableHead>
                                <TableHead className="font-bold">Vendor</TableHead>
                                <TableHead className="font-bold">Batch</TableHead>
                                <TableHead className="font-bold">Transactions</TableHead>
                                <TableHead className="font-bold text-right">Total Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {parsedData.slice(0, 10).map((settlement, idx) => (
                                <TableRow key={idx} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-mono font-bold text-blue-600">{settlement.arNo}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{settlement.vendorName}</div>
                                        <div className="text-[10px] text-slate-500 uppercase">{settlement.market} - {settlement.stallNo}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-mono text-[10px]">{settlement.batchNo}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                            {settlement.transactions.length} items
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-slate-900">
                                        ₱{settlement.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {parsedData.length > 10 && (
                        <div className="bg-slate-50 p-3 text-center text-[10px] text-slate-500 border-t italic">
                            Showing first 10 of {parsedData.length} settlements...
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
}
