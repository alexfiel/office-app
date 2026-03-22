import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import EditTransferTaxForm from "@/components/transfertax/EditTransferTaxForm";

export default async function EditTransferTaxPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    const { id } = await params;

    const data = await prisma.transferTax.findUnique({
        where: { id },
        include: {
            notarialDocument: true,
            details: {
                include: {
                    realProperty: true
                }
            }
        }
    });

    if (!data) {
        return (
            <div className="flex h-screen items-center justify-center">
                <h1 className="text-2xl font-bold">Transaction not found</h1>
            </div>
        );
    }

    // Role/Ownership check
    if (data.userId !== session.user.id && (session.user as any).role !== "ADMIN") {
        return (
            <div className="flex h-screen items-center justify-center">
                <h1 className="text-2xl font-bold text-destructive">Forbidden: You don't have permission to edit this record.</h1>
            </div>
        );
    }

    const user = {
        id: session.user.id,
        name: session.user.name || "User",
        email: session.user.email || "",
        avatar: "",
        role: (session.user as any).role || "USER",
    };

    return (
        <SidebarProvider
            style={{
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties}
        >
            <AppSidebar variant="inset" user={user} />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col p-6 lg:p-10">
                    <div className="border rounded-lg p-6 bg-white shadow-sm">
                        {/* We use JSON.parse(JSON.stringify) to pass data cleanly back to the Client Component */}
                        <EditTransferTaxForm initialData={JSON.parse(JSON.stringify(data))} />
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
