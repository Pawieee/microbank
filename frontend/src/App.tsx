import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
// ✅ 1. Import SWR Config
import { SWRConfig } from "swr";

import Login from "./pages/Login";
import Page from "./pages/Page";
import { AlertProvider } from "./context/alert-context";
import { ViewProvider } from "./context/view-context";
import { LoadingProvider, useLoading } from "./context/loading-context";
import { AuthProvider } from "./context/auth-provider";
import Dashboard from "./pages/Dashboard";
import Applications from "./pages/Applications";
import { LoanForm } from "./pages/LoanForm";
import ProtectedRoute from "./components/feature/auth/protected-route";
import Logs from "./pages/Logs";
import { Spinner } from "@/components/shared/spinner";
import Loans from "./pages/Loans";
import PublicRoute from "./components/feature/auth/public-route";
import NotFound from "./components/shared/not-found";
import Users from "./pages/Users";
import AccountSettings from "./pages/AccountSettings";
import LoanDetails from "./pages/LoanDetails";
import { useClipboardRestrictions } from "./hooks/useClipboardRestrictions";

function App() {
  const { isLoading } = useLoading();
  useClipboardRestrictions();

  useEffect(() => {
    document.title = "Microbank";
  }, []);

  return (
    <>
      {isLoading && <Spinner size={50} className="h-screen" color="black" />}
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />

        {/* PROTECTED ROUTES */}
        <Route path="/pages" element={<ProtectedRoute><Page /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="loan-form" element={<LoanForm />} />
          <Route path="applications" element={<Applications />} />
          <Route path="loans" element={<Loans />} />
          <Route path="loans/:id" element={<LoanDetails />} />
          <Route path="logs" element={<Logs />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<AccountSettings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function WrappedApp() {
  return (
    // ✅ 2. Wrap App with SWR Configuration
    <SWRConfig
      value={{
        fetcher: (resource, init) => fetch(resource, init).then((res) => res.json()),
        refreshInterval: 3000,
        revalidateOnFocus: true,
      }}
    >
      <Router>
        <AlertProvider>
          <AuthProvider>
            <ViewProvider>
              <LoadingProvider>
                <App />
              </LoadingProvider>
            </ViewProvider>
          </AuthProvider>
        </AlertProvider>
      </Router>
    </SWRConfig>
  );
}