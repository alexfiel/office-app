import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { UserSettingsForm } from "@/components/user-settings-form";
import ApiKeyManagement from "@/components/foodvoucher/apiKeyManagement";
import { getApiKeys } from "@/lib/actions/foodvoucher";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const apiKeys = await getApiKeys(session.user.id);

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
            <h1 className="text-3xl font-bold tracking-tight">User Settings</h1>
            <p className="text-muted-foreground mt-2">Manage your account and preferences.</p>
          </div>
          <div className="space-y-10">
            <UserSettingsForm />
            
            <div className="pt-6 border-t">
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Security & Integrations</h2>
                <p className="text-muted-foreground mt-2">Manage API access for external systems.</p>
              </div>
              <ApiKeyManagement 
                userId={session.user.id} 
                initialKeys={apiKeys}
                role={user.role}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
