"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Ticket, Store, HandCoins, TrendingUp } from "lucide-react"

export default function FoodVoucherDashboard({ stats }: { stats: any }) {
    const utilizationRate = stats.totalIssued > 0 ? (stats.totalRedeemed / stats.totalIssued) * 100 : 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50 border-blue-100 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold text-blue-600 uppercase tracking-wider">Total Issued</CardTitle>
                        <Ticket className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-blue-900">₱{stats.totalIssued.toLocaleString()}</div>
                        <p className="text-[10px] text-blue-600 font-medium mt-1">Lifetime total vouchers</p>
                    </CardContent>
                </Card>

                <Card className="bg-emerald-50 border-emerald-100 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold text-emerald-600 uppercase tracking-wider">Total Redeemed</CardTitle>
                        <HandCoins className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-emerald-900">₱{stats.totalRedeemed.toLocaleString()}</div>
                        <p className="text-[10px] text-emerald-600 font-medium mt-1">Claimed by vendors</p>
                    </CardContent>
                </Card>

                <Card className="bg-amber-50 border-amber-100 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold text-amber-600 uppercase tracking-wider">Vendors</CardTitle>
                        <Store className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-amber-900">{stats.vendorCount}</div>
                        <p className="text-[10px] text-amber-600 font-medium mt-1">Active partner stalls</p>
                    </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-100 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold text-purple-600 uppercase tracking-wider">Utilization</CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-purple-900">{utilizationRate.toFixed(1)}%</div>
                        <p className="text-[10px] text-purple-600 font-medium mt-1">Redemption rate</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-bold">Recent Vouchers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.recentVouchers.map((v: any) => (
                                <div key={v.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div>
                                        <div className="font-bold text-sm font-mono">{v.voucherCode}</div>
                                        <div className="text-[10px] text-slate-500 uppercase">{new Date(v.date).toLocaleDateString()}</div>
                                    </div>
                                    <div className="font-black text-slate-900">₱{v.amount.toLocaleString()}</div>
                                </div>
                            ))}
                            {stats.recentVouchers.length === 0 && (
                                <div className="text-center py-8 text-slate-400 italic text-sm">No vouchers issued yet.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-bold">Recent Claims</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.recentClaims.map((c: any) => (
                                <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div>
                                        <div className="font-bold text-sm text-emerald-700">{c.vendor.vendorName}</div>
                                        <div className="text-[10px] text-slate-500 uppercase">{c.redemptionCode} • {new Date(c.date).toLocaleDateString()}</div>
                                    </div>
                                    <div className="font-black text-slate-900">₱{c.totalAmount.toLocaleString()}</div>
                                </div>
                            ))}
                            {stats.recentClaims.length === 0 && (
                                <div className="text-center py-8 text-slate-400 italic text-sm">No claims processed yet.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
