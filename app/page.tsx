import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { ChartBarCollections } from "@/components/chart-bar-collections"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = {
    name: session.user.name || "User",
    email: session.user.email || "",
    avatar: "",
    role: (session.user as any).role || "USER",
  };

  const dailyCollections = await prisma.dailyConsolidatedCollection.findMany({
    include: {
      user: {
        select: {
          name: true,
        }
      },
      collections: {
        include: {
          collectionItems: {
            include: {
              collectionCategory: true
            }
          }
        }
      }
    },
    orderBy: {
      date: 'desc'
    }
  });

  // Calculate high-level stats for SectionCards
  const stats = {
    totalRevenue: dailyCollections.reduce((sum, tx) => sum + Number(tx.totalAmount || 0), 0),
    totalTransactions: dailyCollections.length,
    activeAssessors: new Set(dailyCollections.map(tx => tx.userId)).size,
    growthRate: 12.5, // Mock growth for now
  };

  // Format data for DataTable
  const tableData = dailyCollections.map((tx, index) => ({
    id: index + 1,
    header: tx.controlNo,
    type: "Daily Collection",
    status: "Consolidated",
    target: Number(tx.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    limit: Number(tx.totalDeposits || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    reviewer: tx.user?.name || "Unknown",
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
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards stats={stats} />
              <div className="px-4 lg:px-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <ChartAreaInteractive records={JSON.parse(JSON.stringify(dailyCollections))} />
                </div>
                <div className="lg:col-span-1">
                  <ChartBarCollections records={JSON.parse(JSON.stringify(dailyCollections))} />
                </div>
              </div>
              <DataTable data={tableData} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
