import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
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

  const transferTaxes = await prisma.transferTax.findMany({
    include: {
      user: {
        select: {
          name: true,
        }
      },
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Calculate high-level stats for SectionCards
  const stats = {
    totalRevenue: transferTaxes.reduce((sum, tx) => sum + Number(tx.totalamountdue || 0), 0),
    totalTransactions: transferTaxes.length,
    activeAssessors: new Set(transferTaxes.map(tx => tx.userId)).size,
    growthRate: 12.5, // Mock growth for now
  };

  // Format data for DataTable
  const tableData = transferTaxes.map((tx, index) => ({
    id: index + 1,
    header: tx.transferee,
    type: tx.transactionType,
    status: tx.paymentstatus === "PAID" ? "Done" : "In Process",
    target: Number(tx.totalamountdue || 0).toLocaleString(),
    limit: Number(tx.totalmarketvalue || 0).toLocaleString(),
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
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive records={JSON.parse(JSON.stringify(transferTaxes))} />
              </div>
              <DataTable data={tableData} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
