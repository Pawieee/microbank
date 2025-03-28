import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";

import Login from "./pages/Login";
import ApplicationForm from "./pages/ApplicationForm";
import Dashboard from "./pages/Dashboard";

function App() {
  const location = useLocation();

  useEffect(() => {
    const titles: Record<string, string> = {
      "/": "Login",
      "/dashboard": "Dashboard",
      "/appform": "Loan Application - Step 1",
    };

    document.title = titles[location.pathname] || "Microbank";
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/appform" element={<ApplicationForm />} />
    </Routes>
  );
}
export default function WrappedApp() {
  return (
    <Router>
      <App />
    </Router>
  );
}
