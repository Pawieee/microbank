import * as React from "react";
import { useEffect } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "text-destructive bg-red-100 border-red-100 [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",
        success:
          "text-emerald-700 bg-emerald-100 border-emerald-200 [&>svg]:text-emerald-600 *:data-[slot=alert-description]:text-emerald-700/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

type AlertProps = React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants> & {
    title?: string;
    description?: string;
    variant?: "default" | "destructive" | "success";
    timeout?: number;
    onClose?: () => void;
  };

export function Alert({
  className,
  variant = "default",
  title,
  description,
  timeout,
  onClose,
  ...props
}: AlertProps) {
  useEffect(() => {
    if (timeout && onClose) {
      const timer = setTimeout(() => onClose(), timeout);
      return () => clearTimeout(timer);
    }
  }, [timeout, onClose]);

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn("fixed top-4 right-4 z-[9999] w-full max-w-sm", className)}
    >
      <div
        data-slot="alert"
        role="alert"
        className={cn(alertVariants({ variant }))}
        {...props}
      >
        {variant === "success" ? <CheckCircle /> : <AlertCircle />}
        {title && (
          <div
            data-slot="alert-title"
            className="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight"
          >
            {title}
          </div>
        )}
        {description && (
          <div
            data-slot="alert-description"
            className="text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed"
          >
            {description}
          </div>
        )}
      </div>
    </motion.div>
  );
}
