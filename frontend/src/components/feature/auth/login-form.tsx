import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader2, Lock, Eye, EyeOff } from "lucide-react"; // Added Icons

type LoginFormProps = {
  onLogin: (username: string, password: string) => Promise<void>;
  isLoading?: boolean;
} & React.ComponentProps<"div">;

export function LoginForm({ className, onLogin, isLoading = false, ...props }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Visibility State

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onLogin(username, password);
    } catch {
      // Intentionally empty: error handled in parent
    }
  };

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="e.g. teller_01"
              disabled={isLoading}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-10 bg-muted/30"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"} // Toggle type
                placeholder="••••••••"
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 bg-muted/30 pr-10" // Add padding right for icon
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full h-10 mt-2"
            disabled={isLoading} // ✅ This will now be true if locked
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Lock className="mr-2 h-4 w-4 opacity-70" />
            )}

            {/* Change text based on state */}
            {isLoading ? "Please Wait..." : "Access Workspace"}
          </Button>
        </div>
      </form>
    </div>
  );
}