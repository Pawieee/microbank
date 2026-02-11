/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth"; // ✅ Import Auth Hook
import { useIdleTimer } from "@/hooks/useIdleTimer"; 
import { cn } from "@/lib/utils";
import {
  IconBuildingBank,
  IconChartBar,
  IconDashboard,
  IconLogout2,
  IconLogs,
  IconPlus,
  IconSettings,
  IconUser,
  IconCommand,
  IconUsers,
  IconShieldLock,
} from "@tabler/icons-react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
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

// --- CONFIGURATION ---

const PLATFORM_NAV_ITEMS = [
  { title: "Dashboard", url: "/dashboard", icon: IconDashboard, roles: ["manager"] },
  { title: "New Loan", url: "/loan-form", icon: IconPlus, roles: ["teller"] },
  { title: "Applications", url: "/applications", icon: IconBuildingBank, roles: ["teller", "manager"] },
  { title: "Loans", url: "/loans", icon: IconChartBar, roles: ["teller", "manager"] },
  { title: "User Management", url: "/users", icon: IconUsers, roles: ["admin"] },
  { title: "System Logs", url: "/logs", icon: IconLogs, roles: ["admin"] },
];

const CONFIG_NAV_ITEMS = [
  { title: "Account Settings", url: "/settings", icon: IconSettings },
  { title: "Security & Privacy", url: "/security", icon: IconShieldLock },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ FIX: Extract 'user' object from hook
  const { logout, user } = useAuth(); 
  
  // --- INTEGRATE IDLE TIMER ---
  useIdleTimer(); 
  
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = React.useState(false);

  // ✅ FIX: Use variables from the hook, with fallbacks
  const role = user?.role || "teller";
  const fullName = user?.fullName || "User";

  // --- VIEW LOGIC ---

  // Filter items based on user role
  const platformItems = React.useMemo(() => 
    PLATFORM_NAV_ITEMS.filter(item => item.roles.includes(role)), 
  [role]);

  // ✅ FIXED: Handle navigation logic correctly
  const handleNavigation = (url: string) => {
    // If it's a sub-page, ensure it has the /pages prefix if missing
    const target = url.startsWith("/pages") ? url : `/pages${url}`;
    navigate(target);
  };

  const isActivePath = (url: string) => {
    const current = location.pathname;
    return current === `/pages${url}` || current === url || current.startsWith(`/pages${url}/`);
  };

  const onLogoutConfirm = () => {
    setIsLogoutAlertOpen(false);
    logout();
  };

  // --- RENDER HELPER ---

  const renderNavItems = (items: typeof PLATFORM_NAV_ITEMS | typeof CONFIG_NAV_ITEMS) => (
    <SidebarMenu>
      {items.map((item) => {
        // Safe check: Only check roles if the property exists on the item
        if ("roles" in item && !item.roles.includes(role)) {
            return null;
        }

        const isActive = isActivePath(item.url);
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              onClick={() => handleNavigation(item.url)}
              tooltip={item.title}
              isActive={isActive}
              className={cn(
                "h-10 w-full transition-all duration-200",
                isActive
                  ? "bg-black text-white hover:bg-black hover:text-white shadow-sm font-medium"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              <item.icon className="size-5 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" {...props}>
        
        {/* HEADER */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="hover:bg-transparent">
                {/* Dynamic Link based on Role */}
                <a href={role === 'admin' ? '/pages/users' : role === 'teller' ? '/pages/applications' : '/pages/dashboard'}>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                    <IconCommand className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-bold tracking-tight">MicroBank</span>
                    <span className="truncate text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Financial Suite</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* CONTENT */}
        <SidebarContent>
          
          <SidebarGroup>
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              Platform
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {renderNavItems(platformItems)}
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              System
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {renderNavItems(CONFIG_NAV_ITEMS)}
              
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setIsLogoutAlertOpen(true)}
                    tooltip="Log out"
                    className="h-10 w-full text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                  >
                    <IconLogout2 className="size-5 shrink-0" />
                    <span className="group-data-[collapsible=icon]:hidden">Log out</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* FOOTER */}
        <SidebarFooter className="border-t border-sidebar-border/50">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="pointer-events-none">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground border border-border/50 shadow-sm">
                  <IconUser className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-bold text-zinc-900">{fullName}</span>
                  <span className="truncate text-[10px] font-medium text-muted-foreground uppercase tracking-wider capitalize">{role}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* LOGOUT DIALOG */}
      <AlertDialog open={isLogoutAlertOpen} onOpenChange={setIsLogoutAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end your session? You will be redirected to the portal login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onLogoutConfirm}
              className="bg-red-600 hover:bg-red-700 text-white border-none"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}