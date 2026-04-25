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
import TripSearch from "@/components/librengsakay/tripSearch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
    LayoutDashboard, 
    UploadCloud, 
    FileText, 
    Search, 
    Banknote, 
    FileBarChart 
} from "lucide-react"

export default async function LibrengSakay() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // For the chart, we want last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    sixMonthsAgo.setDate(1);

    // Fetch all necessary data
    const [budget, paxData, totalSpent, routes, recent, allTrips, allLiquidations] = await Promise.all([
        prisma.librengSakayBudget.findFirst({ where: { year: now.getFullYear() } }),
        prisma.librengSakayTrip.aggregate({
            where: { departureDate: { gte: startOfMonth, lte: endOfMonth } },
            _sum: { numberofPax: true }
        }),
        prisma.librengSakayLiquidation.aggregate({ _sum: { amount: true } }),
        prisma.librengSakayRoute.findMany(),
        prisma.librengSakayLiquidation.findMany({ 
            take: 5, 
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true } } }
        }),
        prisma.librengSakayTrip.findMany({
            where: { departureDate: { gte: sixMonthsAgo } },
            select: { id: true, departureDate: true, numberofPax: true, amount: true }
        }),
        prisma.librengSakayLiquidation.findMany({
            where: { paymentDate: { gte: sixMonthsAgo } },
            select: { id: true, paymentDate: true, amount: true }
        })
    ]);

    const stats = {
        totalPax: paxData._sum.numberofPax || 0,
        totalSpent: totalSpent._sum.amount || 0,
        runningBalance: (budget?.totalBudget || 0) - (totalSpent._sum.amount || 0),
        budgetUtilization: budget ? ((totalSpent._sum.amount || 0) / budget.totalBudget) * 100 : 0,
        initialBudget: budget?.totalBudget || 0,
        allTrips,
        allLiquidations
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
                        <TabsList className="grid w-full grid-cols-6 max-w-4xl h-12">
                            <TabsTrigger value="dashboard" className="flex items-center gap-2">
                                <LayoutDashboard className="w-4 h-4" />
                                <span>Dashboard</span>
                            </TabsTrigger>
                            <TabsTrigger value="upload" className="flex items-center gap-2">
                                <UploadCloud className="w-4 h-4" />
                                <span>Upload Trips</span>
                            </TabsTrigger>
                            <TabsTrigger value="logs" className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                <span>Trip Logs</span>
                            </TabsTrigger>
                            <TabsTrigger value="search" className="flex items-center gap-2">
                                <Search className="w-4 h-4" />
                                <span>Search</span>
                            </TabsTrigger>
                            <TabsTrigger value="liquidate" className="flex items-center gap-2">
                                <Banknote className="w-4 h-4" />
                                <span>Liquidation</span>
                            </TabsTrigger>
                            <TabsTrigger value="reports" className="flex items-center gap-2">
                                <FileBarChart className="w-4 h-4" />
                                <span>Reports</span>
                            </TabsTrigger>
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

                        {/* TAB 4: SEARCH */}
                        <TabsContent value="search" className="mt-4">
                            <div className="border rounded-xl p-6 bg-white shadow-sm">
                                <h2 className="text-lg font-semibold mb-4">Search Trips</h2>
                                <p className="text-sm text-gray-500 mb-6">Search for trips by driver, plate number, route, or liquidation status.</p>
                                <TripSearch routes={routes} userName={user.name} />
                            </div>
                        </TabsContent>

                        {/* TAB 5: LIQUIDATION */}
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

                        {/* TAB 6: REPORTS */}
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