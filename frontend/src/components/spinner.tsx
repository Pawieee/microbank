// src/components/ui/Spinner.tsx
import { HashLoader } from "react-spinners";
import { type CSSProperties } from "react";

interface SpinnerProps {
  size?: number;
  color?: string;
  loading?: boolean;
  className?: string;
}

const override: CSSProperties = {
  display: "block",
  margin: "2",
  borderColor: "black",
};

export function Spinner({
  size = 50,
  color = "black",
  loading = true,
  className = "",
}: SpinnerProps) {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <HashLoader
        color={color}
        loading={loading}
        cssOverride={override}
        size={size}
        aria-label="Loading Spinner"
        data-testid="loader"
      />
    </div>
  );
}
