import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Login from "./pages/Login";
import Page from "./pages/Page";
import { AlertProvider } from "./context/AlertContext";
import { ViewProvider } from "./context/ViewContext";
import Dashboard from "@/components/dashboard";
import Loans from "@/components/loans";
import { LoanForm } from "./components/loan-form";
import LoanDetailsPage from "./components/loan-details-page";
import ProtectedRoute from "./pages/ProtectedRoute"; // 👉 Import it

function App() {
  useEffect(() => {
    document.title = "Microbank";
  }, []);

  return (
    <Routes>
      {/* Public Route */}
      <Route path="/" element={<Login />} />

      {/* Protected Layout and Nested Routes */}
      <Route
        path="/pages"
        element={
          <ProtectedRoute> {/* ✨ Protect here */}
            <Page />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="loan-form" element={<LoanForm />} />
        <Route path="loans" element={<Loans />} />
        <Route path="loans/:id" element={<LoanDetailsPage />} />
      </Route>
    </Routes>
  );
}

export default function WrappedApp() {
  return (
    <Router>
      <AlertProvider>
        <ViewProvider>
          <App />
        </ViewProvider>
      </AlertProvider>
    </Router>
  );
}
