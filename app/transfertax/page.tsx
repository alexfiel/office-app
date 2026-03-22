import React from 'react'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import TransferTaxForm from '@/components/transfertax/TransferTaxForm'

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
                <div className="flex flex-1 flex-col p-6 lg:p-10">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold tracking-tight">Transfer Tax</h1>
                        <p className="text-muted-foreground mt-2">Compute the transfer tax for a real property.</p>
                    </div>
                    <div className="flex-1 space-y-4 border rounded-lg p-4 bg-white shadow-sm">
                        <TransferTaxForm />
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}