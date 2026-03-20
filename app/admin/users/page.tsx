import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { AdminUsersManager } from "@/components/admin-users-manager";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    redirect("/"); // Non-admins are redirected back to homepage
  }

  const user = {
    name: session.user.name || "User",
    email: session.user.email || "",
    avatar: "",
    role: role,
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
            <h1 className="text-3xl font-bold tracking-tight">Admin - Users</h1>
            <p className="text-muted-foreground mt-2">View and update user roles across the application.</p>
          </div>
          <AdminUsersManager />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
