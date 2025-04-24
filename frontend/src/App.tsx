import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Login from "./pages/Login";
import Page from "./pages/Page";
import { AlertProvider } from "./context/AlertContext";
import { ViewProvider } from "./context/ViewContext";
import Dashboard from "@/components/dashboard";
import Loans from "@/components/loans";
import { LoanForm } from "./components/loan-form";
import LoanDetailsPage from "./components/loan-details-page"; // Import the new LoanDetailsPage component

function App() {
  useEffect(() => {
    // Update document title based on the route
    document.title = "Microbank"; // Default title
  }, []);

  return (
    <Routes>
      {/* Public Route */}
      <Route path="/" element={<Login />} />

      {/* Protected Layout and Nested Routes */}
      <Route path="/pages" element={<Page />}>
        <Route index element={<Dashboard />} /> {/* default child */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="loan-form" element={<LoanForm />} />
        <Route path="loans" element={<Loans />} />
        {/* Add the Loan Details route */}
        <Route path="loans/:id" element={<LoanDetailsPage />} />{" "}
        {/* Add LoanDetailsPage */}
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
