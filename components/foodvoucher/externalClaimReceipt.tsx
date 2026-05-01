"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { acknowledgeClaim, getVendorClaims } from "@/lib/actions/foodvoucher";
import { FileCheck, Search, Printer, CheckCircle2, Globe } from "lucide-react";

import { downloadReceiptAsPDF } from '@/lib/foodvoucher/pdf-generator';
import IssueAR from './reports/IssueAR';
import { useHasMounted } from "@/hooks/use-has-mounted";

export default function ExternalClaimReceipt({ userId, userName }: { userId: string, userName: string }) {
    const hasMounted = useHasMounted();
    const [controlNo, setControlNo] = useState('');
    const [foundClaim, setFoundClaim] = useState<any>(null);
    const [arNumber, setArNumber] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleSearch = async () => {
        if (!controlNo) return toast.error("Please enter a Control Number");
        
        setIsSearching(true);
        try {
            const claims = await getVendorClaims();
            const claim = claims.find(c => c.claimControlNo === controlNo);
            
            if (!claim) {
                toast.error("External claim not found");
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
            toast.error("Error searching for external claim");
        } finally {
            setIsSearching(false);
        }
    };

    const handleIssueReceipt = async () => {
        if (!foundClaim) return;

        setIsSubmitting(true);
        try {
            const ack = await acknowledgeClaim({
                vendorClaimId: foundClaim.id,
                userId,
                ackBy: userName
            });
            toast.success("Acknowledgement Receipt issued for external claim");
            
            setFoundClaim({
                ...foundClaim,
                status: 'PAID',
                acknowledgement: ack
            });
            setArNumber(ack.arNumber);

            setTimeout(() => {
                window.print();
            }, 500);
        } catch (error: any) {
            toast.error(error.message || "Failed to issue receipt");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!foundClaim || !arNumber) return;
        setIsDownloading(true);
        try {
            await downloadReceiptAsPDF({
                arNumber,
                date: foundClaim.acknowledgement ? new Date(foundClaim.acknowledgement.ackDate) : new Date(),
                amount: foundClaim.totalAmount,
                vendorName: foundClaim.vendorName,
                controlNo: foundClaim.claimControlNo,
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
                            <Globe className="w-5 h-5 text-blue-500" />
                            Search External API Claim
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex gap-4">
                            <div className="flex-1 space-y-2">
                                <Label>Enter Claim Control Number</Label>
                                <Input 
                                    placeholder="e.g. CTL-2024-XXXX" 
                                    value={controlNo}
                                    onChange={(e) => setControlNo(e.target.value)}
                                    className="font-mono"
                                />
                            </div>
                            <Button 
                                className="mt-8 bg-blue-700 hover:bg-blue-800" 
                                onClick={handleSearch}
                                disabled={isSearching}
                            >
                                {isSearching ? "Searching..." : "Find External Claim"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {foundClaim && (
                    <div className="space-y-6">
                        {/* UI ONLY VIEW */}
                        <Card className="shadow-lg border-2 border-blue-900 overflow-hidden relative">
                            {foundClaim.acknowledgement && (
                                <div className="absolute top-10 right-10 rotate-12 opacity-20 pointer-events-none">
                                    <CheckCircle2 className="w-32 h-32 text-emerald-600" />
                                </div>
                            )}
                            
                            <CardHeader className="bg-blue-900 text-white p-8">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h1 className="text-2xl font-black uppercase tracking-tighter">Acknowledgement Receipt</h1>
                                        <p className="text-blue-300 text-xs mt-1 font-medium tracking-widest uppercase">External Vendor Claim (API)</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Receipt No.</div>
                                        <div className="text-xl font-mono font-black">{arNumber || "PENDING"}</div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-8 space-y-8">
                                <div className="grid grid-cols-2 gap-12">
                                    <div className="space-y-4">
                                        <div className="border-b pb-1">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vendor Information</div>
                                            <div className="font-black text-slate-900 text-lg uppercase">{foundClaim.vendorName}</div>
                                            <div className="text-sm text-slate-600 font-medium">{foundClaim.market} - Stall No. {foundClaim.stallNo}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Submission Details</div>
                                            <div className="text-sm font-bold text-slate-700">Control No: <span className="font-mono">{foundClaim.claimControlNo}</span></div>
                                            <div className="text-sm font-bold text-slate-700" suppressHydrationWarning>API Record Date: {foundClaim.createdAt ? new Date(foundClaim.createdAt).toLocaleDateString() : ""}</div>
                                            <div className="text-xs text-slate-400 mt-1 italic">Source: External System Integration</div>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex flex-col justify-center items-end">
                                        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Total Amount Payable</div>
                                        <div className="text-4xl font-black text-blue-900">₱{foundClaim.totalAmount.toLocaleString()}</div>
                                        <div className="text-[10px] text-blue-500 font-medium mt-2 italic">Currency: PHP</div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        Voucher Codes for Verification 
                                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[9px] font-black">
                                            {foundClaim.voucherCodes?.length || 0} ITEMS
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {foundClaim.voucherCodes && foundClaim.voucherCodes.length > 0 ? (
                                            foundClaim.voucherCodes.map((code: string, idx: number) => (
                                                <div key={idx} className="bg-white border border-slate-200 px-3 py-1.5 rounded-md text-xs font-mono font-bold text-slate-700 shadow-sm flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                    {code}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-sm text-slate-400 italic">No voucher codes attached to this claim.</div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-slate-200">
                            <CardContent className="p-6 flex items-center justify-between">
                                {!foundClaim.acknowledgement ? (
                                    <Button 
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 h-12 shadow-lg"
                                        onClick={handleIssueReceipt}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? "Issuing..." : "Issue Official Receipt"}
                                    </Button>
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
                                            onClick={() => window.print()}
                                            disabled={!foundClaim.acknowledgement}
                                        >
                                            <Printer className="w-4 h-4 mr-2" />
                                            Print Receipt
                                        </Button>
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
                        date={foundClaim.acknowledgement ? new Date(foundClaim.acknowledgement.ackDate) : (hasMounted ? new Date() : new Date(0))}
                        amount={foundClaim.totalAmount}
                        vendorName={foundClaim.vendorName}
                        controlNo={foundClaim.claimControlNo}
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
