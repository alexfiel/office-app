"use client"

import * as React from "react"
import {
  IconApps,
  IconBuilding,
  IconCalculatorFilled,
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconInvoice,
  IconListDetails,
  IconEyeDotted,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
  IconBuildingSkyscraper,
  IconBus,
  IconReceipt,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { EyeClosedIcon } from "lucide-react"

const data = {
  navMain: [
    {
      title: "Accomplishment Dashboard",
      url: "/",
      icon: IconDashboard,
    },
    {
      title: "Accomplishment ReportX",
      url: "/txn",
      icon: IconListDetails,
    },
    {
      title: "Libreng Sakay",
      url: "/librengsakay",
      icon: IconBus,
    },
    {
      title: "Food Voucher",
      url: "/foodvoucher",
      icon: IconInvoice,
    },
    {
      title: "Food Voucher Claims",
      url: "/foodvoucher-claims",
      icon: IconReceipt,
    },


  ],

  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
  transfertax: [
    {
      title: "AddPropertyDetails",
      url: "/realproperty",
      icon: IconApps,
    },
    {
      title: "View Property List",
      url: "/viewPropertyList",
      icon: IconBuildingSkyscraper,
    },
    {
      title: "View Transfer Tax List",
      url: "/viewTransferTaxList",
      icon: IconEyeDotted,
    },
    {
      title: "Compute Transfer Tax",
      url: "/transfertax",
      icon: IconCalculatorFilled,
    },
  ],

}

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user: any }) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <img src="/cto_logo.png" alt="CTO Logo" className="size-6 object-contain" />
                <span className="text-base font-semibold">CTO-TAGBILARAN APP</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.transfertax} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
