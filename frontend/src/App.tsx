import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import ApplicationForm from "./pages/ApplicationForm";
import Dashboard from "./pages/Dashboard";
import Test from "./pages/test";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/appform" element={<ApplicationForm />} />
      </Routes>
    </Router>
  );
}
