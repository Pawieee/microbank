import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Login from "./pages/Login";
import Page from "./pages/Page";
import { AlertProvider } from "./context/AlertContext";
import { ViewProvider } from "./context/ViewContext";
import { LoadingProvider, useLoading } from "./context/LoadingContext";
import Dashboard from "@/components/dashboard";
import Applications from "@/components/applications";
import { LoanForm } from "./components/loan-form";
import ProtectedRoute from "./context/ProtectedRoute";
import Logs from "./components/logs";
import { Spinner } from "@/components/spinner";
import LoanView from "./components/loan-view";
import Loans from "./components/loans";
import PublicRoute from "./context/PublicRoute";
import NotFound from "./components/not-found";

function App() {
  const { isLoading } = useLoading();

  useEffect(() => {
    document.title = "Microbank";
  }, []);

  return (
    <>
      {isLoading && <Spinner size={50} className="h-screen" color="black" />}
      <Routes>

        {/* PUBLIC ROUTE: Only for guests */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* PROTECTED ROUTE: Only for logged in users */}
        <Route
          path="/pages"
          element={
            <ProtectedRoute>
              <Page />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="loan-form" element={<LoanForm />} />
          <Route path="applications" element={<Applications />} />
          <Route path="loans" element={<Loans />} />
          <Route path="loans/:id" element={<LoanView />} />
          <Route path="logs" element={<Logs />} />
        </Route>

        {/* ✅ THE CATCH-ALL ROUTE (Must be last) */}
        <Route path="*" element={<NotFound />} />
        
      </Routes>
    </>
  );
}

export default function WrappedApp() {
  return (
    <Router>
      <AlertProvider>
        <ViewProvider>
          <LoadingProvider>
            <App />
          </LoadingProvider>
        </ViewProvider>
      </AlertProvider>
    </Router>
  );
}
