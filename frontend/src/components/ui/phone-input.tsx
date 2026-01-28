"use client";
import { useState, forwardRef, useEffect } from "react";
import parsePhoneNumber, { isValidPhoneNumber } from "libphonenumber-js";
import { CircleFlag } from "react-circle-flags";
import { lookup } from "country-data-list";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { GlobeIcon } from "lucide-react";

export const phoneSchema = z.string().refine((value) => {
  try {
    return isValidPhoneNumber(value);
  } catch {
    return false;
  }
}, "Invalid phone number");

export type CountryData = {
  alpha2: string;
  alpha3: string;
  countryCallingCodes: string[];
  currencies: string[];
  emoji?: string;
  ioc: string;
  languages: string[];
  name: string;
  status: string;
};

interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  onCountryChange?: (data: CountryData | undefined) => void;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  defaultCountry?: string;
  className?: string;
  inline?: boolean;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      className,
      onCountryChange,
      onChange,
      value,
      placeholder,
      defaultCountry,
      inline = false,
      ...props
    },
    ref
  ) => {
    const [countryData, setCountryData] = useState<CountryData | undefined>();
    const [displayFlag, setDisplayFlag] = useState<string>("");
    const [hasInitialized, setHasInitialized] = useState(false);

    // Initialize with default country code if value is empty
    useEffect(() => {
      if (defaultCountry && !hasInitialized) {
        const newCountryData = lookup.countries({
          alpha2: defaultCountry.toLowerCase(),
        })[0];
        
        if (newCountryData) {
            setCountryData(newCountryData);
            setDisplayFlag(defaultCountry.toLowerCase());

            // Only trigger synthetic change if there is no value yet
            if (newCountryData.countryCallingCodes?.[0] && !value) {
            const syntheticEvent = {
                target: {
                value: newCountryData.countryCallingCodes[0],
                },
            } as React.ChangeEvent<HTMLInputElement>;
            onChange?.(syntheticEvent);
            setHasInitialized(true);
            }
        }
      }
    }, [defaultCountry, onChange, value, hasInitialized]);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;

      // Ensure the value starts with "+"
      if (!newValue.startsWith("+")) {
        if (newValue.startsWith("00")) {
          newValue = "+" + newValue.slice(2);
        } else {
          newValue = "+" + newValue;
        }
      }

      try {
        const parsed = parsePhoneNumber(newValue);

        if (parsed && parsed.country) {
          const countryCode = parsed.country;

          // Optimization: Only update state if flag actually changed
          if (displayFlag !== countryCode.toLowerCase()) {
              setDisplayFlag(countryCode.toLowerCase());
              const countryInfo = lookup.countries({ alpha2: countryCode })[0];
              setCountryData(countryInfo);
              onCountryChange?.(countryInfo);
          }

          // Emit synthetic event with formatted number
          const syntheticEvent = {
            ...e,
            target: {
              ...e.target,
              value: parsed.number, // Normalized E.164 format
            },
          } as React.ChangeEvent<HTMLInputElement>;
          onChange?.(syntheticEvent);
        } else {
          // If parsing fails (incomplete typing), just pass the raw value
          // but ensure it goes through the onChange handler so state updates
          onChange?.(e); 
          if (displayFlag !== "") setDisplayFlag("");
        }
      } catch (error) {
        // Fallback for typing errors
        onChange?.(e);
      }
    };

    // FIX: Apply the 'className' (error border) ONLY to the wrapper div.
    // The inner input should remain transparent/clean.
    const wrapperClasses = cn(
      "flex items-center gap-2 relative transition-colors text-base rounded-md border border-input pl-3 h-9 shadow-sm md:text-sm focus-within:ring-1 focus-within:ring-ring",
      inline && "rounded-l-none w-full",
      className 
    );

    return (
      <div className={wrapperClasses}>
        {!inline && (
          <div className="w-4 h-4 shrink-0 flex items-center justify-center">
            {displayFlag ? (
              <CircleFlag countryCode={displayFlag} height={16} />
            ) : (
              <GlobeIcon size={16} className="text-muted-foreground" />
            )}
          </div>
        )}
        <input
          ref={ref}
          value={value}
          onChange={handlePhoneChange}
          placeholder={placeholder || "Enter number"}
          type="tel"
          autoComplete="tel"
          name="phone"
          // FIX: Do NOT apply 'className' here again to avoid double borders
          className="flex w-full border-none bg-transparent text-base placeholder:text-muted-foreground outline-none h-9 py-1 p-0 leading-none md:text-sm"
          {...props}
        />
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";