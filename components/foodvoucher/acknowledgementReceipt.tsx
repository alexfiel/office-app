"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { acknowledgeClaim, getRedemptionClaims } from "@/lib/actions/foodvoucher";
import { FileCheck, Search, Printer, CheckCircle2 } from "lucide-react";

import { downloadReceiptAsPDF } from '@/lib/foodvoucher/pdf-generator';
import IssueAR from './reports/IssueAR';

export default function AcknowledgementReceipt({ userId, userName }: { userId: string, userName: string }) {
    const [claimCode, setClaimCode] = useState('');
    const [foundClaim, setFoundClaim] = useState<any>(null);
    const [arNumber, setArNumber] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleSearch = async () => {
        if (!claimCode) return toast.error("Please enter a claim code");
        
        setIsSearching(true);
        try {
            const claims = await getRedemptionClaims();
            const claim = claims.find(c => c.redemptionCode === claimCode);
            
            if (!claim) {
                toast.error("Claim not found");
                setFoundClaim(null);
            } else {
                setFoundClaim(claim);
                if (claim.acknowledgement) {
                    setArNumber(claim.acknowledgement.arNumber);
                } else {
                    setArNumber('');
                }
            }
        } catch (error) {
            toast.error("Error searching for claim");
        } finally {
            setIsSearching(false);
        }
    };

    const handleIssueReceipt = async () => {
        if (!foundClaim) return;

        setIsSubmitting(true);
        try {
            const ack = await acknowledgeClaim({
                redemptionClaimId: foundClaim.id,
                userId,
                ackBy: userName
            });
            toast.success("Acknowledgement Receipt issued successfully");
            
            // Refresh local state
            setFoundClaim({
                ...foundClaim,
                status: 'PAID',
                acknowledgement: ack
            });
            setArNumber(ack.arNumber);

            // Auto-trigger print
            setTimeout(() => {
                window.print();
            }, 500);
        } catch (error: any) {
            toast.error(error.message || "Failed to issue receipt");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        if (!foundClaim || !arNumber) return;
        setIsDownloading(true);
        try {
            await downloadReceiptAsPDF({
                arNumber,
                date: foundClaim.acknowledgement ? new Date(foundClaim.acknowledgement.ackDate) : new Date(),
                amount: foundClaim.totalAmount,
                vendorName: foundClaim.vendor.vendorName,
                controlNo: foundClaim.redemptionCode,
                userName: foundClaim.acknowledgement?.ackBy || userName
            });
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="space-y-6 no-print">
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="bg-slate-50 border-b">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Search className="w-5 h-5 text-slate-500" />
                            Search Redemption Claim
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex gap-4">
                            <div className="flex-1 space-y-2">
                                <Label>Enter Claim Code (Redemption Code)</Label>
                                <Input 
                                    placeholder="e.g. RC-123456" 
                                    value={claimCode}
                                    onChange={(e) => setClaimCode(e.target.value)}
                                    className="font-mono"
                                />
                            </div>
                            <Button 
                                className="mt-8 bg-slate-800 hover:bg-slate-900" 
                                onClick={handleSearch}
                                disabled={isSearching}
                            >
                                {isSearching ? "Searching..." : "Find Claim"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {foundClaim && (
                    <div className="space-y-6">
                        {/* UI ONLY VIEW */}
                        <Card className="shadow-lg border-2 border-slate-900 overflow-hidden relative">
                            {foundClaim.acknowledgement && (
                                <div className="absolute top-10 right-10 rotate-12 opacity-20 pointer-events-none">
                                    <CheckCircle2 className="w-32 h-32 text-emerald-600" />
                                </div>
                            )}
                            
                            <CardHeader className="bg-slate-900 text-white p-8">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h1 className="text-2xl font-black uppercase tracking-tighter">Acknowledgement Receipt</h1>
                                        <p className="text-slate-400 text-xs mt-1 font-medium tracking-widest uppercase">Food Voucher Program</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Receipt No.</div>
                                        <div className="text-xl font-mono font-black">{arNumber || "PENDING"}</div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-8 space-y-8">
                                <div className="grid grid-cols-2 gap-12">
                                    <div className="space-y-4">
                                        <div className="border-b pb-1">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vendor Information</div>
                                            <div className="font-black text-slate-900 text-lg uppercase">{foundClaim.vendor.vendorName}</div>
                                            <div className="text-sm text-slate-600 font-medium">{foundClaim.vendor.market} - Stall No. {foundClaim.vendor.stallNo}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Redemption Details</div>
                                            <div className="text-sm font-bold text-slate-700">Claim Code: <span className="font-mono">{foundClaim.redemptionCode}</span></div>
                                            <div className="text-sm font-bold text-slate-700">Submission Date: {new Date(foundClaim.date).toLocaleDateString()}</div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex flex-col justify-center items-end">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Amount Payable</div>
                                        <div className="text-4xl font-black text-slate-900">₱{foundClaim.totalAmount.toLocaleString()}</div>
                                        <div className="text-[10px] text-slate-500 font-medium mt-2 italic">Currency: Philippine Peso (PHP)</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-slate-200">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    {!foundClaim.acknowledgement ? (
                                        <div className="flex items-center gap-6 flex-1 mr-8">
                                            <div className="flex-1 bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-center gap-3">
                                                <div className="bg-blue-600 p-2 rounded-md text-white">
                                                    <FileCheck className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-blue-900 uppercase">Auto-Generated Serial</div>
                                                    <div className="text-[10px] text-blue-600 font-medium">The system will assign the next CTO-0000000 number.</div>
                                                </div>
                                            </div>
                                            <Button 
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 h-12 shadow-lg"
                                                onClick={handleIssueReceipt}
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? "Issuing..." : "Issue Official Receipt"}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-emerald-600 font-bold">
                                            <CheckCircle2 className="w-5 h-5" />
                                            <span>Receipt Issued (AR: {arNumber})</span>
                                        </div>
                                    )}
                                    
                                    <div className="flex gap-3">
                                        <Button 
                                            variant="outline" 
                                            className="border-blue-300 text-blue-700 hover:bg-blue-50 font-bold"
                                            onClick={handleDownloadPDF}
                                            disabled={!foundClaim.acknowledgement || isDownloading}
                                        >
                                            {isDownloading ? "Generating..." : "Download PDF"}
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            className="border-slate-300 hover:bg-slate-50 font-bold"
                                            onClick={handlePrint}
                                            disabled={!foundClaim.acknowledgement}
                                        >
                                            <Printer className="w-4 h-4 mr-2" />
                                            Print Receipt
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* OFFICIAL PRINT VIEW - Only Visible in Print */}
            {foundClaim && (
                <div className="hidden print:block print:m-0 print:p-0">
                    <IssueAR 
                        arNumber={arNumber}
                        date={foundClaim.acknowledgement ? new Date(foundClaim.acknowledgement.ackDate) : new Date()}
                        amount={foundClaim.totalAmount}
                        vendorName={foundClaim.vendor.vendorName}
                        controlNo={foundClaim.redemptionCode}
                        userName={foundClaim.acknowledgement?.ackBy || userName}
                    />
                </div>
            )}

            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; padding: 0 !important; margin: 0 !important; }
                }
            `}</style>
        </div>
    );
}
