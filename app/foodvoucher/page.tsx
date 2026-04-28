import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
    LayoutDashboard, 
    Store, 
    Ticket, 
    HandCoins, 
    History,
    FileText,
    FileCheck,
    Database,
    Key
} from "lucide-react"

// Import components (to be created)
import FoodVoucherDashboard from "@/components/foodvoucher/dashboard"
import VendorManagement from "@/components/foodvoucher/vendorManagement"
import VoucherInventory from "@/components/foodvoucher/voucherInventory"
import RedemptionWorkspace from "@/components/foodvoucher/redemptionWorkspace"
import RedemptionHistory from "@/components/foodvoucher/redemptionHistory"
import AcknowledgementReceipt from "@/components/foodvoucher/acknowledgementReceipt"

export default async function FoodVoucherPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const user = {
        id: session.user.id as string,
        name: session.user.name || "User",
    };

    // Fetch initial data
    const [vendors, vouchers, claims, stats] = await Promise.all([
        prisma.foodVoucherVendor.findMany({ orderBy: { vendorName: 'asc' } }),
        prisma.foodVoucher.findMany({ 
            include: { user: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100
        }),
        prisma.foodVoucherRedemptionClaim.findMany({
            include: { 
                vendor: true,
                user: { select: { name: true } },
                acknowledgement: true
            },
            orderBy: { date: 'desc' },
            take: 50
        }),
        prisma.$transaction([
            prisma.foodVoucher.aggregate({ _sum: { amount: true } }),
            prisma.foodVoucherRedemptionClaim.aggregate({ _sum: { totalAmount: true } }),
            prisma.foodVoucherVendor.count()
        ])
    ]);

    const dashboardStats = {
        totalIssued: stats[0]._sum.amount || 0,
        totalRedeemed: stats[1]._sum.totalAmount || 0,
        vendorCount: stats[2],
        recentVouchers: vouchers.slice(0, 5),
        recentClaims: claims.slice(0, 5)
    };

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" user={session.user} />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col p-6 space-y-6">
                    <div className="no-print">
                        <h1 className="text-3xl font-bold tracking-tight">Food Voucher System</h1>
                        <p className="text-muted-foreground">Manage and track food voucher distribution and redemptions</p>
                    </div>

                    <Tabs defaultValue="dashboard" className="w-full">
                        <TabsList className="grid w-full grid-cols-6 max-w-6xl h-12 no-print">
                            <TabsTrigger value="dashboard" className="flex items-center gap-2">
                                <LayoutDashboard className="w-4 h-4" />
                                <span>Dashboard</span>
                            </TabsTrigger>
                            <TabsTrigger value="vendors" className="flex items-center gap-2">
                                <Store className="w-4 h-4" />
                                <span>Vendors</span>
                            </TabsTrigger>
                            <TabsTrigger value="inventory" className="flex items-center gap-2">
                                <Ticket className="w-4 h-4" />
                                <span>Inventory</span>
                            </TabsTrigger>
                            <TabsTrigger value="redemption" className="flex items-center gap-2">
                                <HandCoins className="w-4 h-4" />
                                <span>Redemption</span>
                            </TabsTrigger>
                            <TabsTrigger value="receipts" className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                <span>Receipts</span>
                            </TabsTrigger>
                            <TabsTrigger value="history" className="flex items-center gap-2">
                                <History className="w-4 h-4" />
                                <span>History</span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="dashboard" className="mt-4 no-print">
                            <FoodVoucherDashboard stats={dashboardStats} />
                        </TabsContent>

                        <TabsContent value="vendors" className="mt-4 no-print">
                            <VendorManagement 
                                vendors={vendors} 
                                userId={user.id} 
                            />
                        </TabsContent>

                        <TabsContent value="inventory" className="mt-4 no-print">
                            <VoucherInventory 
                                vouchers={vouchers} 
                                userId={user.id} 
                            />
                        </TabsContent>

                        <TabsContent value="redemption" className="mt-4 no-print">
                            <RedemptionWorkspace 
                                vendors={vendors} 
                                userId={user.id} 
                            />
                        </TabsContent>

                        <TabsContent value="receipts" className="mt-4">
                            <AcknowledgementReceipt 
                                userId={user.id}
                                userName={user.name}
                            />
                        </TabsContent>

                        <TabsContent value="history" className="mt-4 no-print">
                            <RedemptionHistory claims={claims} />
                        </TabsContent>
                    </Tabs>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
