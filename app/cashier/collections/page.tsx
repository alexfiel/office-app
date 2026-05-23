import { CollectionEntryForm } from "@/components/cashier/collection-entry-form";
import { getRecentCollections, CollectionFilters } from "@/lib/actions/collections";
import { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import Link from "next/link";
import { auth } from "@/auth";
import { CollectionTableActions } from "@/components/cashier/collection-table-actions";
import { ReportCollections } from "@/components/cashier/report-collections";
import { CollectionFilter } from "@/components/cashier/collection-filter";

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

  const recentRes = await getRecentCollections(filters);
  const recentCollections = recentRes.success ? (recentRes.data || []) : [];

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
            Enter new collections and view transactions.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          {/* Multi-Mode Filter Form */}
          <CollectionFilter />

          {/* Report Button */}
          <ReportCollections 
            collections={recentCollections} 
            userName={userName} 
            reportPeriod={reportPeriod} 
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        {/* Entry Form */}
        <CollectionEntryForm />

        {/* Recent Collections Table */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{reportPeriod ? `Collections for ${reportPeriod}` : "Recent Collections"}</CardTitle>
            <CardDescription>
              {reportPeriod ? "Entries for the selected period." : "Latest 50 entries recorded by authorized users."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Control No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total (₱)</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Recorded By</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCollections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 6 : 5} className="text-center text-muted-foreground">
                      No collections found.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentCollections.map((col: any) => (
                    <TableRow key={col.id}>
                      <TableCell className="font-semibold text-primary">
                        {col.controlNo}
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        {format(new Date(col.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {Number(col.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground" title={col.collectionItems?.map((item: any) => `${item.collectionCategory?.name}: ₱${Number(item.amount).toLocaleString()}`).join(" | ")}>
                        {col.collectionItems?.map((item: any) => item.collectionCategory?.code).join(", ")}
                      </TableCell>
                      <TableCell className="text-xs">
                        {col.user?.name || "Unknown"}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <CollectionTableActions collection={col} />
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
