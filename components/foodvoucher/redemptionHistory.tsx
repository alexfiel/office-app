"use client"

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { History, CheckCircle2, Clock } from "lucide-react";

export default function RedemptionHistory({ claims }: { claims: any[] }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                    <History className="w-5 h-5 text-slate-500" />
                    Claim History
                </h2>
                <div className="text-xs font-medium text-slate-500">
                    {claims.length} Claims Total
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {claims.map((claim) => (
                    <Card key={claim.id} className="overflow-hidden hover:border-blue-200 transition-colors shadow-sm">
                        <CardContent className="p-0">
                            <div className="flex flex-col md:flex-row md:items-center">
                                <div className="p-4 md:w-48 bg-slate-50 flex flex-col justify-center border-b md:border-b-0 md:border-r">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Claim Code</div>
                                    <div className="font-mono font-bold text-slate-900">{claim.redemptionCode}</div>
                                </div>
                                
                                <div className="p-4 flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vendor</div>
                                        <div className="font-bold text-slate-800 line-clamp-1">{claim.vendor.vendorName}</div>
                                        <div className="text-[10px] text-slate-500">{claim.vendor.market}</div>
                                    </div>
                                    
                                    <div className="text-center">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</div>
                                        <div className="font-medium text-slate-700">{new Date(claim.date).toLocaleDateString()}</div>
                                    </div>

                                    <div className="text-center">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Processed By</div>
                                        <div className="font-medium text-slate-700">{claim.user?.name || 'System'}</div>
                                    </div>

                                    <div className="text-right flex flex-col items-end">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Amount</div>
                                        <div className="text-lg font-black text-slate-900 tracking-tighter">₱{claim.totalAmount.toLocaleString()}</div>
                                        {claim.acknowledgement && (
                                            <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 rounded mt-1 border border-emerald-100 uppercase">
                                                AR: {claim.acknowledgement.arNumber}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={`p-4 md:w-32 flex items-center justify-center border-t md:border-t-0 md:border-l ${
                                    claim.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                }`}>
                                    <div className="flex items-center gap-1.5">
                                        {claim.status === 'PAID' ? (
                                            <CheckCircle2 className="w-4 h-4" />
                                        ) : (
                                            <Clock className="w-4 h-4" />
                                        )}
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{claim.status}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {claims.length === 0 && (
                    <div className="border border-dashed rounded-2xl py-20 flex flex-col items-center justify-center text-slate-400 gap-4">
                        <History className="w-12 h-12 opacity-10" />
                        <div className="text-sm italic">No redemption history found yet.</div>
                    </div>
                )}
            </div>
        </div>
    );
}
