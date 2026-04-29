import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Banknote, FileBarChart, Globe } from "lucide-react"

import SettlementWorkspace from "@/components/foodvoucher/settlementWorkspace"
import SettlementReport from "@/components/foodvoucher/settlementReport"
import { getUnsettledAcknowledgements, getSettlements } from "@/lib/actions/foodvoucher-settlement"

export default async function FoodVoucherSettlementPage() {
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
    const unsettledAcks = await getUnsettledAcknowledgements();
    const settlements = await getSettlements();

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
                            <h1 className="text-3xl font-black tracking-tight">Food Voucher Settlement</h1>
                            <p className="text-muted-foreground mt-2 font-medium">Process vendor payments and generate liquidation reports.</p>
                        </div>
                    </div>

                    <Tabs defaultValue="workspace" className="w-full">
                        <TabsList className="bg-slate-100/50 p-1 mb-8 no-print">
                            <TabsTrigger value="workspace" className="flex items-center gap-2 px-6">
                                <Banknote className="w-4 h-4" />
                                <span>Liquidation Workspace</span>
                            </TabsTrigger>
                            <TabsTrigger value="report" className="flex items-center gap-2 px-6">
                                <FileBarChart className="w-4 h-4" />
                                <span>Liquidation Report</span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="workspace" className="mt-0">
                            <SettlementWorkspace 
                                unsettledAcks={unsettledAcks} 
                                userId={user.id} 
                            />
                        </TabsContent>

                        <TabsContent value="report" className="mt-0">
                            <SettlementReport 
                                settlements={settlements} 
                                userRole={user.role}
                                userName={user.name}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
