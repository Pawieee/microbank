/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  IconBuildingBank,
  IconChartBar,
  IconDashboard,
  IconFolder,
  IconHelp,
  IconLogout2,
  IconPlus,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard", // Update to actual route path
      icon: IconDashboard,
    },
    {
      title: "Request a Loan",
      url: "/loan-form", // Update to actual route path
      icon: IconPlus,
    },
    {
      title: "Loans",
      url: "/loans", // Update to actual route path
      icon: IconBuildingBank,
    },
    {
      title: "Manage Loans",
      url: "/manage-loans", // Update to actual route path
      icon: IconChartBar,
    },
    {
      title: "Projects",
      url: "#",
      icon: IconFolder,
    },
    {
      title: "Team",
      url: "#",
      icon: IconUsers,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Logout",
      url: "#",
      icon: IconLogout2,
    },
  ],
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  onNavigate?: (url: string) => void; // Modify to pass URL
};

export function AppSidebar({ onNavigate, ...props }: AppSidebarProps) {
  const navigate = useNavigate(); // Use react-router's navigate hook

  // Function to handle navigation
  const handleNavigate = (url: string) => {
    // Check if the URL is already prefixed with '/pages' and handle accordingly
    if (url.startsWith("/pages")) {
      navigate(url); // Directly navigate to the full URL
    } else {
      navigate(`/pages${url}`); // Prepend '/pages' if not already there
    }
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/pages">
                <img src="/microbank.svg" style={{ fill: "black" }} className="w-[50px]" />
                <span className="text-base font-semibold">MicroBank</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={data.navMain}
          onNavigate={handleNavigate} // Pass the new handleNavigate to the NavMain
        />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
    </Sidebar>
  );
}
