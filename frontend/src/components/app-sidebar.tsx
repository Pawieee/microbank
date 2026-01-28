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
  IconUser,
  IconChevronsDown, // Added for the user menu visual cue
  IconCommand,
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,       // Added
  SidebarGroupLabel,  // Added
  SidebarGroupContent,// Added
  SidebarSeparator,   // Added
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
const rawNavMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: IconDashboard,
    visibleTo: ["manager"], 
  },
  {
    title: "New Loan",
    url: "/loan-form",
    icon: IconPlus,
    visibleTo: ["teller"], 
  },
  {
    title: "Applications",
    url: "/applications",
    icon: IconBuildingBank,
    visibleTo: ["teller", "manager"],
  },
  {
    title: "Loans",
    url: "/loans",
    icon: IconChartBar,
    visibleTo: ["teller", "manager"],
  },
  {
    title: "System Logs", // Renamed for professionalism
    url: "/logs",
    icon: IconLogs,
    visibleTo: ["admin"], 
  },  
];

const navSecondaryData = [
  {
    title: "Settings",
    url: "#",
    icon: IconSettings,
  },
  {
    title: "Help Center",
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

  // 2. GET USER INFO FROM STORAGE
  const userRole = localStorage.getItem("role") || "teller";
  const username = localStorage.getItem("username") || "User";

  // 3. FILTER MENU ITEMS
  const filteredNavMain = useMemo(() => {
    return rawNavMain.filter((item) => {
      if (item.visibleTo) {
        return item.visibleTo.includes(userRole);
      }
      return true;
    });
  }, [userRole]);

  const getHomeLink = () => {
    switch (userRole) {
        case 'admin': return "/pages/logs";
        case 'teller': return "/pages/applications";
        case 'manager': return "/pages/dashboard";
        default: return "/pages/dashboard";
    }
  };

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

      localStorage.clear();

      if (res.status === 401) {
        navigate("/");
        return;
      }

      const data = await res.json();

      if (data.success) {
        navigate("/");
      } else {
        navigate("/"); 
      }
    } catch (err) {
      localStorage.clear(); 
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
      <Sidebar collapsible="icon" variant="sidebar" {...props}>
        
        {/* HEADER: BRANDING */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <a href={getHomeLink()}>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                    <IconCommand className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-bold tracking-tight">MicroBank</span>
                    <span className="truncate text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Financial Suite
                    </span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* CONTENT: SECTIONS */}
        <SidebarContent>
          {/* Main Platform Section */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-1">
              Platform
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <NavMain
                items={filteredNavMain}
                onNavigate={handleNavigate}
              />
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Visual Separator for density */}
          <SidebarSeparator className="mx-4 my-2 opacity-50" />

          {/* Support Section */}
          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-1">
              Support & Account
            </SidebarGroupLabel>
            <SidebarGroupContent>
               <NavSecondary items={navSecondaryWithActions} />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* FOOTER: USER PROFILE */}
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border border-transparent hover:border-border hover:bg-muted/50 transition-all"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted text-foreground border border-border">
                  <IconUser className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-foreground">{username}</span>
                  <span className="truncate text-[10px] text-muted-foreground capitalize font-medium">
                    {userRole} Account
                  </span>
                </div>
                <IconChevronsDown className="ml-auto size-4 text-muted-foreground/50" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* LOGOUT CONFIRMATION */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end your session? You will be redirected to the login screen.
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