import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive, ChartBarCollections } from "@/components/dashboard-charts-wrapper"

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

  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;
  const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0, 0);
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);
  const startOfPrevYear = new Date(previousYear, 0, 1, 0, 0, 0, 0);
  const endOfPrevYear = new Date(previousYear, 11, 31, 23, 59, 59, 999);

  const [dailyCollections, prevYearCollections] = await Promise.all([
    prisma.dailyConsolidatedCollection.findMany({
      where: {
        date: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        collections: {
          include: {
            collectionItems: {
              include: {
                collectionCategory: {
                  include: {
                    fundType: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    }),
    prisma.dailyConsolidatedCollection.findMany({
      where: {
        date: {
          gte: startOfPrevYear,
          lte: endOfPrevYear,
        },
      },
      select: {
        date: true,
        totalAmount: true,
      },
      orderBy: {
        date: 'asc',
      },
    }),
  ]);

  // Calculate high-level stats and Fund Type collections for SectionCards
  const totalRevenue = dailyCollections.reduce((sum, tx) => sum + Number(tx.totalAmount || 0), 0);

  const fundMap: Record<string, { id?: string; name: string; code: string; amount: number; count: number }> = {};

  dailyCollections.forEach(daily => {
    daily.collections?.forEach(col => {
      col.collectionItems?.forEach(item => {
        const ft = item.collectionCategory?.fundType;
        const code = ft?.code || "OTHER";
        const name = ft?.name || "OTHER FUND";
        const amt = Number(item.amount || 0);

        if (!fundMap[code]) {
          fundMap[code] = {
            id: ft?.id,
            name,
            code,
            amount: 0,
            count: 0,
          };
        }
        fundMap[code].amount += amt;
        fundMap[code].count += 1;
      });
    });
  });

  const fundTypes = Object.values(fundMap)
    .sort((a, b) => b.amount - a.amount)
    .map(fund => ({
      ...fund,
      percentage: totalRevenue > 0 ? (fund.amount / totalRevenue) * 100 : 0,
    }));

  const stats = {
    currentYear,
    totalRevenue,
    fundTypes,
    totalTransactions: dailyCollections.length,
    activeAssessors: new Set(dailyCollections.map(tx => tx.userId)).size,
    growthRate: 12.5,
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
                  <ChartAreaInteractive
                    records={JSON.parse(JSON.stringify(dailyCollections))}
                    previousYearRecords={JSON.parse(JSON.stringify(prevYearCollections))}
                  />
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
