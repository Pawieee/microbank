import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";

import Login from "./pages/Login";
import Page from "./pages/Page";
import { useView, ViewProvider } from "./context/ViewContext";
import { AlertProvider } from "./context/AlertContext";

function App() {
  const location = useLocation();
  const { view } = useView();

  useEffect(() => {
    if (location.pathname === "/") {
      document.title = "Login";
    } else if (location.pathname === "/page") {
      document.title = view ? `${view}` : "Dashboard";
    } else {
      document.title = "Microbank";
    }
  }, [location.pathname, view]);

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/page" element={<Page />} />
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
