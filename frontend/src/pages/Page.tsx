import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import GlobalAlert from "@/components/shared/global-alert";
import ForcePasswordChangeModal from "@/components/feature/auth/force-password-change-dialog";

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <GlobalAlert />
        <ForcePasswordChangeModal />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}