import { FundCategoryManager } from "@/components/cashier/fund-category-manager";
import { Metadata } from "next";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Cashier Settings | Office App",
  description: "Manage fund types and collection categories for the cashier division.",
};

export default async function CashierSettingsPage() {
  const session = await auth();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

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
            <BreadcrumbPage>Cashier Settings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cashier Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage system lookup data such as fund types and collection categories.
        </p>
      </div>
      <FundCategoryManager isAdmin={isAdmin} />
    </div>
  );
}
