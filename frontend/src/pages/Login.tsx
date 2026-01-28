/* eslint-disable @typescript-eslint/no-explicit-any */
import { LoginForm } from "@/components/login-form";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { login } from "@/lib/auth";
import { useAlert } from "@/context/AlertContext";
import { 
  Command, 
  Server, 
  ShieldAlert, 
  Activity 
} from "lucide-react"; 

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const { triggerAlert, closeAlert } = useAlert();

  const handleLogin = async (username: string, password: string) => {
    setError("");

    try {
      const { ok, data } = await login(username, password);

      if (ok && data.success) {
        closeAlert();
        localStorage.setItem("username", data.username);
        localStorage.setItem("role", data.role); 

        // Slight delay for UX smoothness
        setTimeout(() => {
            if (data.role === 'admin') navigate("/pages/logs");
            else if (data.role === 'teller') navigate("/pages/applications");
            else if (data.role === 'manager') navigate("/pages/dashboard");
            else {
                localStorage.removeItem("username");
                localStorage.removeItem("role");
                setError("Role configuration error. Contact IT Admin.");
            }
        }, 500);

      } else {
        setError(data.message || "Invalid credentials.");
        triggerAlert({
          title: "Access Denied",
          description: "Credentials do not match our records.",
          variant: "destructive",
          timeout: 4000,
        });
      }
    } catch (err: any) {
      setError("Unable to connect to authentication server.");
      console.error(err);
    }
  };

  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0 bg-background">
      
      {/* LEFT PANEL: BRANDING & SYSTEM STATUS */}
      <div className="relative hidden h-full flex-col bg-zinc-950 p-10 text-white lg:flex border-r border-zinc-800">
        
        {/* Subtle Tech Pattern */}
        <div className="absolute inset-0 bg-zinc-950">
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:32px_32px] opacity-20"></div>
        </div>

        {/* Top: Logo */}
        <div className="relative z-20 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-zinc-950 shadow-md">
             <Command className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">MicroBank Corp.</h1>
            <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest">Core Banking System</p>
          </div>
        </div>

        {/* Bottom: System Status Indicators */}
        <div className="relative z-20 mt-auto space-y-6">
            <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                    <ShieldAlert className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Restricted Area</span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                    This system is for authorized use only. Activity is monitored and recorded. Unauthorized access is a violation of corporate policy.
                </p>
            </div>

            {/* Mock Server Status */}
            <div className="flex items-center gap-6 text-xs font-mono text-zinc-500">
                <div className="flex items-center gap-2">
                    <Server className="h-3 w-3" />
                    <span>Node: <span className="text-zinc-300">PH-DVO-01</span></span>
                </div>
                <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-emerald-500" />
                    <span className="text-emerald-500">System Operational</span>
                </div>
            </div>
        </div>
      </div>

      {/* RIGHT PANEL: LOGIN FORM */}
      <div className="lg:p-8 relative flex items-center justify-center h-full">
        <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[360px]">
          
          <div className="flex flex-col space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Sign In
            </h2>
            <p className="text-sm text-muted-foreground">
              Please identify yourself to access the workspace.
            </p>
          </div>

          <div className="grid gap-6">
            <LoginForm onLogin={handleLogin} />
          </div>

          {/* Error Display */}
          {error && (
             <div className="p-3 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 animate-in fade-in zoom-in-95">
                <ShieldAlert className="h-4 w-4" />
                <span>{error}</span>
             </div>
          )}

          {/* Minimal Footer */}
          <div className="pt-8 text-center">
            <p className="text-xs text-muted-foreground/40 font-mono">
                MicroBank Internal Suite v2.4.0 &middot; IT Support Ext. 1024
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}