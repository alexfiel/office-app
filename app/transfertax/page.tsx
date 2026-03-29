
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import TransferTaxView from '@/components/transfertax/TransferTaxView'

export default async function TransferTaxPage() {
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
                        <h1 className="text-3xl font-bold tracking-tight">Transfer Tax</h1>
                        <p className="text-muted-foreground mt-2">Compute the transfer tax for a real property.</p>
                    </div>
                    <TransferTaxView />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}