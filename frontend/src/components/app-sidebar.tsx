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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export const data = {
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
  const navigate = useNavigate();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false); // Control the logout dialog visibility

  const handleNavigate = (url: string) => {
    if (url.startsWith("/pages")) {
      navigate(url);
    } else {
      navigate(`/pages${url}`);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/logout", {
        method: "POST",
        credentials: "include",
      });

      if (res.status === 401) {
        console.warn("Already logged out.");
        navigate("/");
        return;
      }

      const data = await res.json();

      if (data.success) {
        console.log("Logged out!");
        navigate("/");
      } else {
        console.error("Logout failed", data.message);
      }
    } catch (err) {
      console.error("Error logging out", err);
    }
  };

  const handleSecondaryClick = (item: (typeof data.navSecondary)[number]) => {
    if (item.title === "Logout") {
      setLogoutDialogOpen(true); // Open the dialog instead of logging out directly
    } else {
      handleNavigate(item.url);
    }
  };

  const navSecondaryWithActions = data.navSecondary.map((item) => ({
    ...item,
    onClick: () => handleSecondaryClick(item),
  }));

  return (
    <>
      <Sidebar collapsible="offcanvas" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!p-1.5"
              >
                <a href="/pages/dashboard">
                  <span className="text-base font-bold">MicroBank</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain
            items={data.navMain}
            onNavigate={handleNavigate}
          />
          <NavSecondary items={navSecondaryWithActions} className="mt-auto" />
        </SidebarContent>
      </Sidebar>

      {/* --- Add the AlertDialog here --- */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be logged out from your session. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setLogoutDialogOpen(false); // Close the dialog first
                handleLogout(); // Then logout
              }}
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}