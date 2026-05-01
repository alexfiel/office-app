import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Banknote, FileBarChart, Globe, History } from "lucide-react"

import ExternalSettlementWorkspace from "@/components/foodvoucher/externalSettlementWorkspace"
import ExternalSettlementReport from "@/components/foodvoucher/externalSettlementReport"
import ExternalLiquidationHistory from "@/components/foodvoucher/externalLiquidationHistory"
import { getExternalSettlements } from "@/lib/actions/external-fv-settlement"

export default async function FoodVoucherExternalSettlementPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    const user = {
        name: session.user.name || "User",
        email: session.user.email || "",
        avatar: "",
        role: (session.user as any).role || "USER",
        id: session.user.id as string
    };

    // Fetch data
    const externalSettlements = await getExternalSettlements();
    const settlements = externalSettlements.map(s => ({
        id: s.id,
        arNo: s.arNo,
        batchNo: s.batchNo,
        vendorName: s.vendorName,
        totalTransactions: s.totalTransactions,
        totalAmount: Number(s.totalAmount),
        datePaid: s.datePaid.toISOString(),
        market: s.market,
        stallNo: s.stallNo,
        arNumber: s.arNo,
        amount: Number(s.totalAmount),
        details: s.transactions.map(t => ({
            id: t.id,
            voucherCode: t.voucherCode,
            beneficiary: t.beneficiary,
            amount: Number(t.amount),
            createdAt: t.createdAt.toISOString(),
            arNumber: t.voucherCode,
            vendorName: t.beneficiary,
            market: s.market,
            stallNo: s.stallNo
        }))
    }));

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" user={user} />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col p-6 lg:p-10">
                    <div className="mb-6 flex justify-between items-end">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Globe className="w-5 h-5 text-blue-600" />
                                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">System Integration</span>
                            </div>
                            <h1 className="text-3xl font-black tracking-tight">Food Voucher External Settlement</h1>
                            <p className="text-muted-foreground mt-2 font-medium">Process external vendor payments and generate liquidation reports.</p>
                        </div>
                    </div>

                    <Tabs defaultValue="workspace" className="w-full">
                        <TabsList className="bg-slate-100/50 p-1 mb-8 no-print">
                            <TabsTrigger value="workspace" className="flex items-center gap-2 px-6">
                                <Banknote className="w-4 h-4" />
                                <span>Liquidation Workspace</span>
                            </TabsTrigger>
                            <TabsTrigger value="report" className="flex items-center gap-2">
                                <FileBarChart className="w-4 h-4" />
                                For Liquidation
                            </TabsTrigger>
                            <TabsTrigger value="history" className="flex items-center gap-2">
                                <History className="w-4 h-4" />
                                Liquidated
                            </TabsTrigger>
                        </TabsList>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
                            <TabsContent value="workspace" className="m-0 p-6">
                                <ExternalSettlementWorkspace
                                    userId={user.id}
                                />
                            </TabsContent>

                            <TabsContent value="report" className="m-0 p-6">
                                <ExternalSettlementReport
                                    settlements={settlements as any}
                                    userId={user.id}
                                    userName={user.name}
                                />
                            </TabsContent>

                            <TabsContent value="history" className="m-0 p-6">
                                <ExternalLiquidationHistory
                                    userName={user.name}
                                />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
