import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { LoanForm } from "@/components/loan-form";
import Dashboard from "@/components/dashboard.tsx";
import LoanApplications from "@/components/loan-applications";
import ManageLoans from "@/components/management-application";
import { AnimatePresence } from "framer-motion";
import { useAlert } from "@/context/AlertContext";
import { Alert } from "@/components/ui/alert";

export default function Page() {
  const [view, setView] = useState<string>("dashboard");
  const { showAlert, closeAlert } = useAlert();
  const handleSuccess = (data: any) => {
    console.log("Form successfully submitted!", data);
  };

  const handleNavigate = (view: string) => {
    setView(view); // Set the active view
  };

  return (
    <SidebarProvider>
      <AnimatePresence>
        {showAlert && (
          <Alert
            variant="destructive"
            title="Error"
            description="Your session has expired. Please log in again."
            timeout={5000}
            onClose={closeAlert}
          />
        )}
      </AnimatePresence>
      <AppSidebar
        onNavigate={handleNavigate} // Pass the navigation handler here
        variant="inset"
      />
      <SidebarInset>
        <SiteHeader activeView={view} />
        {view === "loan-form" && <LoanForm onSuccess={handleSuccess} />}
        {view === "dashboard" && <Dashboard />}
        {view === "applications" && <LoanApplications />}
        {view === "manage-loans" && <ManageLoans />}
        {view === "projects"}
        {view === "team"}
      </SidebarInset>
    </SidebarProvider>
  );
}
