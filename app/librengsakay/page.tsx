import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

// Import your components
import DashboardView from "@/components/librengsakay/dashboardView"
import TripUpload from "@/components/librengsakay/tripUpload"
import LiquidationWorkspace from "@/components/librengsakay/liquidationWorkspace"
import LiquidationReport from "@/components/librengsakay/liquidationReport"
import TripViewList from "@/components/librengsakay/tripViewList"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function LibrengSakay() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Fetch all necessary data
    const [budget, paxData, totalSpent, routes, recent] = await Promise.all([
        prisma.librengSakayBudget.findFirst({ where: { year: now.getFullYear() } }),
        prisma.librengSakayTrip.aggregate({
            where: { departureDate: { gte: start, lte: end } },
            _sum: { numberofPax: true }
        }),
        prisma.librengSakayLiquidation.aggregate({ _sum: { amount: true } }),
        prisma.librengSakayRoute.findMany(),
        prisma.librengSakayLiquidation.findMany({ 
            take: 5, 
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true } } }
        })
    ]);

    const stats = {
        totalPax: paxData._sum.numberofPax || 0,
        totalSpent: totalSpent._sum.amount || 0,
        runningBalance: (budget?.totalBudget || 0) - (totalSpent._sum.amount || 0),
        budgetUtilization: budget ? ((totalSpent._sum.amount || 0) / budget.totalBudget) * 100 : 0,
        initialBudget: budget?.totalBudget || 0,
    };

    const user = {
        id: session.user.id as string,
        name: session.user.name || "User",
    };

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" user={session.user} />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col p-6 space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Libreng Sakay</h1>
                        <p className="text-muted-foreground">City Public Transport Monitoring System</p>
                    </div>

                    <Tabs defaultValue="dashboard" className="w-full">
                        <TabsList className="grid w-full grid-cols-5 max-w-2xl">
                            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                            <TabsTrigger value="upload">Upload Trips</TabsTrigger>
                            <TabsTrigger value="logs">Trip Logs</TabsTrigger>
                            <TabsTrigger value="liquidate">Liquidation</TabsTrigger>
                            <TabsTrigger value="reports">Reports</TabsTrigger>
                        </TabsList>

                        {/* TAB 1: DASHBOARD */}
                        <TabsContent value="dashboard" className="space-y-6 mt-4">
                            <DashboardView stats={stats} recent={recent} />
                        </TabsContent>

                        {/* TAB 2: UPLOAD */}
                        <TabsContent value="upload" className="mt-4">
                            <div className="border rounded-xl p-6 bg-white shadow-sm">
                                <h2 className="text-lg font-semibold mb-4">Batch Upload Trip Logs</h2>
                                <TripUpload userId={user.id} routes={routes} />
                            </div>
                        </TabsContent>

                        {/* TAB 3: MASTER LOGS */}
                        <TabsContent value="logs" className="mt-4">
                            <div className="border rounded-xl p-6 bg-white shadow-sm">
                                <h2 className="text-lg font-semibold mb-4">All Trip Logs</h2>
                                <p className="text-sm text-gray-500 mb-6">Master list of all uploaded trips and their current liquidation status.</p>
                                <TripViewList routes={routes} />
                            </div>
                        </TabsContent>

                        {/* TAB 3: LIQUIDATION */}
                        <TabsContent value="liquidate" className="mt-4">
                            <div className="border rounded-xl p-6 bg-white shadow-sm">
                                <h2 className="text-lg font-semibold mb-4">Liquidation Workspace</h2>
                                <p className="text-sm text-gray-500 mb-6">Process paper logs and assign AR numbers.</p>
                                <LiquidationWorkspace
                                    routes={routes}
                                    userId={user.id}
                                    userName={user.name}
                                />
                            </div>
                        </TabsContent>

                        {/* TAB 4: REPORTS */}
                        <TabsContent value="reports" className="mt-4">
                            <div className="border rounded-xl p-6 bg-white shadow-sm">
                                <h2 className="text-lg font-semibold mb-4">Liquidation Report</h2>
                                <p className="text-sm text-gray-500 mb-6">View and export historical liquidation data.</p>
                                <LiquidationReport routes={routes} userName={user.name} />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}