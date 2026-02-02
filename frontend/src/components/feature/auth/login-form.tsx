import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader2, Lock } from "lucide-react";

type LoginFormProps = {
  onLogin: (username: string, password: string) => Promise<void>;
  isLoading?: boolean; // <--- Added this prop
} & React.ComponentProps<"div">;

export function LoginForm({ className, onLogin, isLoading = false, ...props }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  // Removed internal [isLoading, setIsLoading] state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // We don't set loading here anymore; the parent hook handles it.
    await onLogin(username, password);
  };

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-5">
          
          {/* Username */}
          <div className="grid gap-2">
            <Label htmlFor="username" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Username
            </Label>
            <div className="relative">
              <Input
                id="username"
                placeholder="e.g. teller_01"
                type="text"
                autoCapitalize="none"
                autoComplete="username"
                autoCorrect="off"
                disabled={isLoading}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-10 bg-muted/30"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="grid gap-2">
            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 bg-muted/30"
                required
              />
            </div>
          </div>

          {/* Submit Action */}
          <Button type="submit" className="w-full h-10 mt-2 font-medium" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Lock className="mr-2 h-4 w-4 opacity-70" />
            )}
            {isLoading ? "Authenticating..." : "Access Workspace"}
          </Button>

        </div>
      </form>
    </div>
  );
}