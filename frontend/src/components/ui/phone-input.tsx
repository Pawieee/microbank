import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FixedPhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string;
  onValueChange?: (value: string) => void;
  error?: boolean;
}

export const FixedPhoneInput = React.forwardRef<HTMLInputElement, FixedPhoneInputProps>(
  ({ className, value, onValueChange, error, ...props }, ref) => {
    
    // Extract part after "+63" for display
    const displayValue = value?.startsWith("+63") ? value.slice(3) : "";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // 1. Allow only numbers
      const rawInput = e.target.value.replace(/\D/g, "");
      
      // 2. Limit to 10 digits (Standard PH Mobile: 9xx xxx xxxx)
      const trimmed = rawInput.slice(0, 10);

      // 3. Pass full value (+63 + 10 digits) to parent
      if (trimmed.length === 0) {
        onValueChange?.("");
      } else {
        onValueChange?.(`+63${trimmed}`);
      }
    };

    return (
      <div className="relative">
        {/* The uneditable prefix */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none select-none">
          <span className="text-sm font-medium text-muted-foreground">+63</span>
          <div className="h-4 w-px bg-border" /> 
        </div>
        <Input
          {...props}
          ref={ref}
          type="tel"
          value={displayValue}
          onChange={handleChange}
          className={cn(
            "pl-[4rem] ", // Adjusted padding for shorter prefix
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          placeholder="9XX XXX XXXX" // Placeholder guide
        />
      </div>
    );
  }
);
FixedPhoneInput.displayName = "FixedPhoneInput";