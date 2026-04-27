"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { acknowledgeClaim, getRedemptionClaims } from "@/lib/actions/foodvoucher";
import { FileCheck, Search, Printer, CheckCircle2 } from "lucide-react";

export default function AcknowledgementReceipt({ userId, userName }: { userId: string, userName: string }) {
    const [claimCode, setClaimCode] = useState('');
    const [foundClaim, setFoundClaim] = useState<any>(null);
    const [arNumber, setArNumber] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <Card className="shadow-sm border-slate-200 no-print">
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
                    <Card className="shadow-lg border-2 border-slate-900 overflow-hidden relative print:shadow-none print:border-slate-300">
                        {foundClaim.acknowledgement && (
                            <div className="absolute top-10 right-10 rotate-12 opacity-20 no-print pointer-events-none">
                                <CheckCircle2 className="w-32 h-32 text-emerald-600" />
                            </div>
                        )}
                        
                        <CardHeader className="bg-slate-900 text-white p-8 print:bg-white print:text-slate-900 print:border-b-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-2xl font-black uppercase tracking-tighter">Acknowledgement Receipt</h1>
                                    <p className="text-slate-400 text-xs mt-1 font-medium tracking-widest uppercase print:text-slate-500">Food Voucher Program</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest print:text-slate-500">Receipt No.</div>
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

                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex flex-col justify-center items-end print:bg-white print:border-slate-300">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Amount Payable</div>
                                    <div className="text-4xl font-black text-slate-900">₱{foundClaim.totalAmount.toLocaleString()}</div>
                                    <div className="text-[10px] text-slate-500 font-medium mt-2 italic">Currency: Philippine Peso (PHP)</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Certificate of Acknowledgement</div>
                                <p className="text-sm text-slate-600 leading-relaxed italic">
                                    This receipt serves as an official acknowledgement of the redemption claim submitted by the aforementioned vendor. 
                                    The vouchers included in this claim have been verified and the total amount stated above is subject to final 
                                    approval for payment.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-12 pt-8">
                                <div className="space-y-1">
                                    <div className="h-px bg-slate-900 w-full mb-2 print:bg-slate-500"></div>
                                    <div className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Received By (Vendor)</div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-widest">Signature over Printed Name</div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <div className="font-bold text-slate-900 uppercase text-sm mb-2">{foundClaim.acknowledgement?.ackBy || userName}</div>
                                    <div className="h-px bg-slate-900 w-full mb-2 print:bg-slate-500"></div>
                                    <div className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Issued By (Office Personnel)</div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-widest">Acknowledgement Date: {foundClaim.acknowledgement ? new Date(foundClaim.acknowledgement.ackDate).toLocaleDateString() : new Date().toLocaleDateString()}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200 no-print">
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
                        </CardContent>
                    </Card>
                </div>
            )}

            <style jsx global>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body {
                        background: white !important;
                        padding: 0 !important;
                    }
                    .print\\:shadow-none {
                        box-shadow: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
