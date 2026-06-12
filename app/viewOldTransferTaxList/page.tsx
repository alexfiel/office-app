import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TransferTaxList from "@/components/transfertax/TransferTaxList";
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default async function ViewOldTransferTaxListPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const user = {
        name: session.user.name || "User",
        email: session.user.email || "",
        avatar: "",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        role: (session.user as any).role || "USER",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        designation: (session.user as any).designation || "DESIGNATION",
        id: session.user.id
    };

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
                <div className="flex flex-1 flex-col p-6 lg:p-10 relative">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold tracking-tight">Old Transfer Tax Records</h1>
                        <p className="text-muted-foreground mt-2">View legacy transfer tax records from the previous system schema.</p>
                    </div>
                    <TransferTaxList currentUser={user} />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
