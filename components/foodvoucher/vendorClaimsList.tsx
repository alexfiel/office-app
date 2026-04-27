"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Database, Calendar, User as UserIcon } from "lucide-react";

export default function VendorClaimsList({ vendorClaims }: { vendorClaims: any[] }) {
    if (vendorClaims.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Database className="w-12 h-12 mb-4 opacity-20" />
                    <p>No external vendor claims recorded yet.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    External API Submissions
                </h2>
                <Badge variant="outline" className="bg-slate-50 font-mono">
                    Total: {vendorClaims.length}
                </Badge>
            </div>

            <div className="grid gap-3">
                {vendorClaims.map((claim) => (
                    <Card key={claim.id} className="shadow-sm border-slate-200 hover:border-blue-200 transition-colors">
                        <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="bg-blue-50 p-2 rounded-lg">
                                        <Database className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 leading-tight">{claim.vendorName}</div>
                                        <div className="text-xs text-slate-500 mt-1">
                                            {claim.market} • Stall #{claim.stallNo}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 flex-1 max-w-2xl">
                                    <div className="text-center md:text-left">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Control / AR No.</div>
                                        <div className="text-sm font-mono font-bold text-slate-700">
                                            {claim.claimControlNo}
                                            {claim.acknowledgement && (
                                                <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                                                    AR: {claim.acknowledgement.arNumber}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-center md:text-left">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recorded At</div>
                                        <div className="text-sm font-medium text-slate-600 flex items-center gap-1.5 justify-center md:justify-start">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(claim.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="text-center md:text-left hidden md:block">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System User</div>
                                        <div className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                                            <UserIcon className="w-3 h-3" />
                                            {claim.user?.name || 'API'}
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right flex flex-col items-end border-t md:border-t-0 pt-3 md:pt-0">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</div>
                                    <Badge 
                                        variant={claim.status === 'PAID' ? "default" : "outline"} 
                                        className={claim.status === 'PAID' ? "bg-emerald-500 hover:bg-emerald-600 mb-2" : "text-amber-600 border-amber-200 bg-amber-50 mb-2"}
                                    >
                                        {claim.status}
                                    </Badge>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Claim Amount</div>
                                    <div className="text-lg font-black text-slate-900">₱{claim.totalAmount.toLocaleString()}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
