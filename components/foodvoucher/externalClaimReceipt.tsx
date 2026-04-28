"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { acknowledgeClaim, getVendorClaims } from "@/lib/actions/foodvoucher";
import { FileCheck, Search, Printer, CheckCircle2, Globe } from "lucide-react";

export default function ExternalClaimReceipt({ userId, userName }: { userId: string, userName: string }) {
    const [controlNo, setControlNo] = useState('');
    const [foundClaim, setFoundClaim] = useState<any>(null);
    const [arNumber, setArNumber] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <Card className="shadow-sm border-slate-200 no-print">
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
                    <Card className="shadow-lg border-2 border-blue-900 overflow-hidden relative print:shadow-none print:border-slate-300">
                        {foundClaim.acknowledgement && (
                            <div className="absolute top-10 right-10 rotate-12 opacity-20 no-print pointer-events-none">
                                <CheckCircle2 className="w-32 h-32 text-emerald-600" />
                            </div>
                        )}
                        
                        <CardHeader className="bg-blue-900 text-white p-8 print:bg-white print:text-slate-900 print:border-b-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-2xl font-black uppercase tracking-tighter">Acknowledgement Receipt</h1>
                                    <p className="text-blue-300 text-xs mt-1 font-medium tracking-widest uppercase print:text-slate-500">External Vendor Claim (API)</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-bold text-blue-200 uppercase tracking-widest print:text-slate-500">Receipt No.</div>
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
                                        <div className="text-sm font-bold text-slate-700">API Record Date: {new Date(foundClaim.createdAt).toLocaleDateString()}</div>
                                        <div className="text-xs text-slate-400 mt-1 italic">Source: External System Integration</div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex flex-col justify-center items-end print:bg-white print:border-slate-300">
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
                                            <div key={idx} className="bg-white border border-slate-200 px-3 py-1.5 rounded-md text-xs font-mono font-bold text-slate-700 shadow-sm flex items-center gap-1.5 print:border-slate-300">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                {code}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-sm text-slate-400 italic">No voucher codes attached to this claim.</div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Certificate of Acknowledgement</div>
                                <p className="text-sm text-slate-600 leading-relaxed italic">
                                    This receipt serves as an official acknowledgement of the vendor claim received through the CTO API System. 
                                    The documentation provided by the external system has been logged and the amount above is cleared for 
                                    liquidation processing.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-12 pt-8">
                                <div className="space-y-1">
                                    <div className="h-px bg-slate-900 w-full mb-2 print:bg-slate-500"></div>
                                    <div className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Vendor Signature</div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-widest">Representative</div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <div className="font-bold text-slate-900 uppercase text-sm mb-2">{foundClaim.acknowledgement?.ackBy || userName}</div>
                                    <div className="h-px bg-slate-900 w-full mb-2 print:bg-slate-500"></div>
                                    <div className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Issued By</div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-widest">Date: {foundClaim.acknowledgement ? new Date(foundClaim.acknowledgement.ackDate).toLocaleDateString() : new Date().toLocaleDateString()}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200 no-print">
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
                            
                            <Button 
                                variant="outline" 
                                className="border-slate-300 hover:bg-slate-50 font-bold"
                                onClick={() => window.print()}
                                disabled={!foundClaim.acknowledgement}
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Print Receipt
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; padding: 0 !important; }
                }
            `}</style>
        </div>
    );
}
