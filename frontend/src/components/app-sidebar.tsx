/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  IconBuildingBank,
  IconChartBar,
  IconDashboard,
  IconHelp,
  IconLogout2,
  IconLogs,
  IconPlus,
  IconSettings,
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
import { useState, useMemo } from "react";

// 1. DEFINE PERMISSIONS
// Added 'visibleTo' array. If missing, everyone sees it.
const rawNavMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: IconDashboard,
    visibleTo: ["manager", "admin"], // Tellers cannot see this
  },
  {
    title: "New Loan",
    url: "/loan-form",
    icon: IconPlus,
    visibleTo: ["teller", "manager", "admin"],
  },
  {
    title: "Applications",
    url: "/applications",
    icon: IconBuildingBank,
    visibleTo: ["teller", "manager", "admin"],
  },
  {
    title: "Loans",
    url: "/loans",
    icon: IconChartBar,
    visibleTo: ["teller", "manager", "admin"],
  },
  {
    title: "Logs",
    url: "/logs",
    icon: IconLogs,
    visibleTo: ["admin"], // Only Admins see logs
  },  
];

const navSecondaryData = [
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
];

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  onNavigate?: (url: string) => void; 
};

export function AppSidebar({ onNavigate, ...props }: AppSidebarProps) {
  const navigate = useNavigate();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false); 

  // 2. GET ROLE FROM STORAGE
  // Default to 'teller' or empty if not found to be safe
  const userRole = localStorage.getItem("role") || "teller";

  // 3. FILTER MENU ITEMS
  const filteredNavMain = useMemo(() => {
    return rawNavMain.filter((item) => {
      // If visibleTo is defined, check if userRole is in the list
      if (item.visibleTo) {
        return item.visibleTo.includes(userRole);
      }
      // If visibleTo is undefined, everyone sees it
      return true;
    });
  }, [userRole]);

  const handleNavigate = (url: string) => {
    if (url.startsWith("/pages")) {
      navigate(url);
    } else {
      navigate(`/pages${url}`);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      // 4. CLEANUP STORAGE
      // Always clear storage even if the API fails, to ensure UI reset
      localStorage.clear();

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
        navigate("/"); // Force logout anyway
      }
    } catch (err) {
      console.error("Error logging out", err);
      localStorage.clear(); // Safety clear
      navigate("/");
    }
  };

  const handleSecondaryClick = (item: (typeof navSecondaryData)[number]) => {
    if (item.title === "Logout") {
      setLogoutDialogOpen(true);
    } else {
      handleNavigate(item.url);
    }
  };

  const navSecondaryWithActions = navSecondaryData.map((item) => ({
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
                <a href={userRole === 'teller' ? "/pages/applications" : "/pages/dashboard"}>
                  <span className="text-base font-bold">MicroBank</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {/* Pass the Filtered List */}
          <NavMain
            items={filteredNavMain}
            onNavigate={handleNavigate}
          />
          <NavSecondary items={navSecondaryWithActions} className="mt-auto" />
        </SidebarContent>
      </Sidebar>

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
                setLogoutDialogOpen(false);
                handleLogout();
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