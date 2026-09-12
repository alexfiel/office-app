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

  const [dailyCollections, prevYearCollections, transferTaxes] = await Promise.all([
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
    prisma.newTransferTax.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true,
          },
        },
        notarialDocument: true,
        t_transfertaxdetails: {
          include: {
            realProperty: true,
          },
        },
      },
      orderBy: {
        t_DateCompute: 'desc',
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

  // Format Transfer Tax records for DataTable
  const transferTaxData = transferTaxes.map((tx, index) => {
    const detail0 = tx.t_transfertaxdetails?.[0];
    const transferees = Array.from(
      new Set(
        (tx.t_transfertaxdetails || [])
          .map((d) => d.nt_transferee?.trim())
          .filter(Boolean)
      )
    );
    const transferors = Array.from(
      new Set(
        (tx.t_transfertaxdetails || [])
          .map((d) => d.nt_transferror?.trim())
          .filter(Boolean)
      )
    );
    const transferee =
      transferees.length > 1
        ? `${transferees[0]} (+${transferees.length - 1} more)`
        : transferees[0] || detail0?.nt_transferee || "N/A";
    const transferor =
      transferors.length > 1
        ? `${transferors[0]} (+${transferors.length - 1} more)`
        : transferors[0] || detail0?.nt_transferror || "N/A";

    return {
      id: index + 1,
      taxId: tx.id,
      controlNo: tx.t_controlNumber,
      transferee,
      transferor,
      allTransferees: transferees,
      allTransferors: transferors,
      transactionType: detail0?.nt_transactiontype || "Transfer Tax",
      notarialDoc: tx.notarialDocument?.documentName || "Notarial Document",
      notarialDocNumber: tx.notarialDocument?.documentNumber || "N/A",
      notarialDocUrl: tx.notarialDocument?.document_url || null,
      notarizedBy: tx.notarialDocument?.notarizedBy || null,
      notarialId: tx.t_NotarialId,
      dateComputed: tx.t_DateCompute ? tx.t_DateCompute.toISOString() : new Date().toISOString(),
      validityDate: tx.t_validity ? tx.t_validity.toISOString() : null,
      daysElapsed: tx.t_daysElapsed || 0,
      status: (tx.t_status || "pending").toLowerCase(),
      paymentStatus: (tx.t_paymentStatus || "unpaid").toLowerCase(),
      amountDue: Number(tx.t_TotalAmountDue || 0),
      marketValue: Number(tx.t_TotalMarketValue || 0),
      taxBase: Number(tx.t_TaxBase || 0),
      surcharge: Number(tx.t_TotalSurcharge || 0),
      interest: Number(tx.t_TotalInterest || 0),
      assessor: tx.user?.name || "Assessor",
      assessorEmail: tx.user?.email || "",
      assessorDesignation: tx.user?.designation || "Assessor",
      propertiesCount: tx.t_transfertaxdetails?.length || 0,
      details: (tx.t_transfertaxdetails || []).map((d) => ({
        id: d.id,
        transferee: d.nt_transferee,
        transferor: d.nt_transferror,
        transactionType: d.nt_transactiontype,
        taxDecNo: d.nt_taxdecnumber,
        lotNo: d.nt_lotnumber,
        area: Number(d.nt_area || 0),
        marketValue: Number(d.nt_marketvalue || 0),
        considerationValue: Number(d.nt_considerationvalue || 0),
        taxBase: Number(d.nt_taxbase || 0),
        transferTaxDue: Number(d.nt_transfertaxDue || 0),
        surcharge: Number(d.nt_surcharge || 0),
        interest: Number(d.nt_interest || 0),
        totalDue: Number(d.nt_totalTransferTaxDue || 0),
      })),
    };
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
              <DataTable data={transferTaxData} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
