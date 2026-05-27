import { CollectionEntryForm } from "@/components/cashier/collection-entry-form";
import { getRecentCollections, CollectionFilters } from "@/lib/actions/collections";
import { getDailyCollections } from "@/lib/actions/daily-collections";
import { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import Link from "next/link";
import { auth } from "@/auth";
import { CollectionFilter } from "@/components/cashier/collection-filter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnconsolidatedCollectionsTable } from "@/components/cashier/unconsolidated-collections-table";
import { DailyCollectionsTable } from "@/components/cashier/daily-collections-table";

export const metadata: Metadata = {
  title: "Collections Entry | Office App",
  description: "Record daily collections and view recent entries.",
};

export default async function CollectionsPage(
  props: {
    searchParams: Promise<{ [key: string]: string | undefined }>;
  }
) {
  const searchParams = await props.searchParams;
  
  const filters: CollectionFilters = {
    filterType: searchParams.filterType,
    date: searchParams.date,
    startDate: searchParams.startDate,
    endDate: searchParams.endDate,
    month: searchParams.month,
    year: searchParams.year,
  };

  const session = await auth();
  const isAdmin = (session?.user as any)?.role === "ADMIN";
  const userName = session?.user?.name || "Unknown User";

  const [recentRes, dailyRes] = await Promise.all([
    getRecentCollections({ ...filters, unconsolidatedOnly: true }),
    getDailyCollections(filters)
  ]);

  const unconsolidatedCollections = recentRes.success ? (recentRes.data || []) : [];
  const dailyCollections = dailyRes.success ? (dailyRes.data || []) : [];

  let reportPeriod = "";
  if (filters.filterType === "single" && filters.date) {
    reportPeriod = `Date: ${format(new Date(filters.date), "MMMM d, yyyy")}`;
  } else if (filters.filterType === "range" && filters.startDate && filters.endDate) {
    reportPeriod = `Period: ${format(new Date(filters.startDate), "MMM d, yyyy")} to ${format(new Date(filters.endDate), "MMM d, yyyy")}`;
  } else if (filters.filterType === "month" && filters.month) {
    const [y, m] = filters.month.split('-');
    reportPeriod = `Month: ${format(new Date(Number(y), Number(m) - 1), "MMMM yyyy")}`;
  } else if (filters.filterType === "year" && filters.year) {
    reportPeriod = `Year: ${filters.year}`;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Main Menu</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Record Collection</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Record Collection</h1>
          <p className="text-muted-foreground mt-2">
            Enter new collections and generate daily consolidated reports.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          {/* Multi-Mode Filter Form */}
          <CollectionFilter />
        </div>
      </div>

      <Tabs defaultValue="entry" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="entry">Collection Entries</TabsTrigger>
          <TabsTrigger value="reports">Daily Consolidated Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="entry" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2 items-start">
            {/* Entry Form */}
            <CollectionEntryForm />

            {/* Unconsolidated Collections Table */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle>{reportPeriod ? `Unconsolidated Collections for ${reportPeriod}` : "Recent Unconsolidated Collections"}</CardTitle>
                <CardDescription>
                  Select entries to consolidate into a daily report.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UnconsolidatedCollectionsTable 
                  collections={unconsolidatedCollections} 
                  isAdmin={isAdmin} 
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>{reportPeriod ? `Daily Reports for ${reportPeriod}` : "Recent Daily Reports"}</CardTitle>
              <CardDescription>
                View and print consolidated daily reports.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DailyCollectionsTable 
                reports={dailyCollections} 
                userName={userName}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
