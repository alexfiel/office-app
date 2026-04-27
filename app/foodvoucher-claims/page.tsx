import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileCheck, Database, Globe } from "lucide-react"
import ExternalClaimReceipt from "@/components/foodvoucher/externalClaimReceipt"
import VendorClaimsList from "@/components/foodvoucher/vendorClaimsList"

export default async function FoodVoucherClaimsPage() {
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

    // Fetch external claims data
    const vendorClaims = await prisma.foodVoucherVendorClaim.findMany({
        include: {
            user: { select: { name: true } },
            acknowledgement: true
        },
        orderBy: { createdAt: 'desc' },
        take: 100
    });

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
                            <h1 className="text-3xl font-black tracking-tight">Food Voucher Claims Management</h1>
                            <p className="text-muted-foreground mt-2 font-medium">Process and acknowledge claims submitted by vendors.</p>
                        </div>
                    </div>

                    <Tabs defaultValue="list" className="w-full">
                        <TabsList className="bg-slate-100/50 p-1 mb-8 no-print">
                            <TabsTrigger value="list" className="flex items-center gap-2 px-6">
                                <Database className="w-4 h-4" />
                                <span>All Claims</span>
                            </TabsTrigger>
                            <TabsTrigger value="issue" className="flex items-center gap-2 px-6">
                                <FileCheck className="w-4 h-4" />
                                <span>Issue Acknowledgement</span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="list" className="mt-0">
                            <VendorClaimsList vendorClaims={vendorClaims} />
                        </TabsContent>

                        <TabsContent value="issue" className="mt-0">
                            <ExternalClaimReceipt
                                userId={user.id}
                                userName={user.name}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
