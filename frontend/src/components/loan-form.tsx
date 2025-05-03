/* eslint-disable @typescript-eslint/no-unused-vars */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { useState } from "react";
import { ApplicationStatusNotification } from "./application-status-notification";
import { Applicant } from "@/lib/microbank"; // adjust path to your file

const capitalizeFirstLetter = (value: string) => {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

// Updated Zod schema
const formSchema = z.object({
  employment_status: z.string(),
  loan_amount: z.coerce.number().min(5000).max(50000),
  loan_purpose: z.string(),
  payment_schedule: z.string(),
  monthly_revenue: z.coerce.number().min(5000),
  credit_score: z.string().min(1, "Required"),
  last_name: z
    .string()
    .min(1, "Last name is required")
    .trim()
    .max(50, "Last name must be less than 50 characters")
    .regex(/^[A-Za-z\s]+$/, "Last name must contain only letters and spaces"),
  first_name: z
    .string()
    .min(1, "First name is required")
    .trim()
    .max(50, "First name must be less than 50 characters")
    .regex(/^[A-Za-z\s]+$/, "First name must contain only letters and spaces"),
  middle_name: z
    .string()
    .min(1, "Middle name is required")
    .trim()
    .max(50, "Middle name must be less than 50 characters")
    .regex(/^[A-Za-z\s]+$/, "Middle name must contain only letters and spaces"),
  email: z.string().email("Invalid email format"),

  phone_number: z
    .string()
    .min(1, "Phone number is required")
    .refine(
      (val) => {
        const hasPlus = val.startsWith("+");
        const pureVal = hasPlus ? val.slice(1) : val;
        return /^[0-9]+$/.test(pureVal);
      },
      {
        message: "Phone number must contain digits only",
      }
    )
    .refine(
      (val) => {
        const hasPlus = val.startsWith("+");
        const pureVal = hasPlus ? val.slice(1) : val;
        if (pureVal.startsWith("09") && hasPlus) {
          return false;
        }
        if (pureVal.startsWith("09")) {
          return pureVal.length === 11;
        }
        if (pureVal.startsWith("63")) {
          return pureVal.length === 12;
        }
        return false;
      },
      {
        message:
          "Phone number must start with '09' (11 digits) or '+63' (12 digits).",
      }
    ),

  repayment_period: z.string(),
});

type LoanFormProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess?: (data: any) => void;
};

export const LoanForm: React.FC<LoanFormProps> = ({ onSuccess }) => {
  // const navigate = useNavigate();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      loan_amount: 5000,
      credit_score: "",
      last_name: "",
      first_name: "",
      middle_name: "",
      email: "",
      phone_number: "",
    },
  });

  function handleReset() {
    form.reset({
      employment_status: "",
      loan_amount: 5000,
      loan_purpose: "",
      payment_schedule: "",
      monthly_revenue: 0,
      credit_score: "",
      last_name: "",
      first_name: "",
      middle_name: "",
      email: "",
      phone_number: "",
      repayment_period: "",
    });
  }

  const [loading, setLoading] = useState(false);
  const [loanStatus, setLoanStatus] = useState<"Approved" | "Rejected" | null>(
    null
  );
  async function onSubmit(data: z.infer<typeof formSchema>) {
    setLoading(true);

    try {
      // TYPESCRIPT VALIDATION
      const applicant = new Applicant(data);
      const result = applicant.assess_eligibility();

      if (result.status === "Approved") {
        const response = await fetch(
          "/api/loan-status-notification-typescript",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              first_name: data.first_name,
              middle_name: data.middle_name,
              last_name: data.last_name,
              email: data.email,
              phone_num: data.phone_number,
              employment_status: data.employment_status,
              loan_amount: data.loan_amount,
              loan_purpose: data.loan_purpose,
              monthly_revenue: data.monthly_revenue,
              credit_score: data.credit_score,
              repayment_period: data.repayment_period,
              payment_schedule: data.payment_schedule, //REMOVE THE APPLICANT OBJECT HERE, INSTEAD JUD EVALUATE ONLY THE DATA AND LET THE PYTHON DO THE CONVERSION
            }),
          }
        );

        const responseInfo = await response.json();
        if (responseInfo.status !== "Approved")
          throw new Error("Failed to send loan status email");
      }

      // PYTHON VALIDATION
      // const response = await fetch("/api/loan-status-notification", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     first_name: data.first_name,
      //     middle_name: data.middle_name,
      //     last_name: data.last_name,
      //     email: data.email,
      //     phone_num: data.phone_number,
      //     employment_status: data.employment_status,
      //     loan_amount: data.loan_amount,
      //     loan_purpose: data.loan_purpose,
      //     monthly_revenue: data.monthly_revenue,
      //     credit_score: data.credit_score,
      //     repayment_period: data.repayment_period,
      //     payment_schedule: data.payment_schedule,
      //   }),
      // });

      // if (!response.ok) {
      //   throw new Error("Failed to fetch loan status notification");
      // }

      // const result = await response.json();

      // EMAIL NOTIFICATION
      // if (result.status === "Approved" || result.status === "Rejected") {
      //   const emailResponse = await fetch("/api/send-loan-status-email", {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify({
      //       email: data.email,
      //       status: result.status,
      //       applicant_name: `${data.first_name} ${data.middle_name} ${data.last_name}`,
      //       loan_amount: data.loan_amount,
      //       loan_purpose: data.loan_purpose,
      //       support_email: "support@microbank.com",
      //     }),
      //   });

      //   if (!emailResponse.ok) {
      //     throw new Error("Failed to send loan status email");
      //   }
      // }

      setLoanStatus(result.status);

      if (onSuccess) onSuccess(data);
    } catch (error) {
      setLoanStatus("Rejected");
    } finally {
      setLoading(false);
    }
  }

  function handleDone() {
    // Reset everything, or navigate somewhere else
    setLoanStatus(null);
  }

  // --- UI RENDER ---
  if (loanStatus) {
    return (
      <ApplicationStatusNotification
        status={loanStatus as "Approved" | "Rejected"}
        onDone={handleDone}
      />
    );
  }

  return (
    <Form {...form}>
      <div className="w-full mt-6 mx-auto px-10">
        <h2 className="text-3xl font-bold text-left">Loan Form</h2>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mx-auto py-8"
        >
          <FormField
            control={form.control}
            name="loan_amount"
            render={({ field: { value, onChange } }) => (
              <FormItem>
                <FormLabel>Loan Amount - ₱{value}</FormLabel>
                <FormControl>
                  <Slider
                    min={5000}
                    max={50000}
                    step={500}
                    value={[value]}
                    onValueChange={(vals) => {
                      onChange(vals[0]);
                    }}
                  />
                </FormControl>
                <FormDescription>Adjust the amount by sliding.</FormDescription>
                <div className="min-h-[10px]">
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          {/* Employment Status */}
          <FormField
            control={form.control}
            name="employment_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employment Status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select employment status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="employed">Employed</SelectItem>
                    <SelectItem value="self-employed">Self-Employed</SelectItem>
                    <SelectItem value="unemployed">Unemployed</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>

                <div className="min-h-[10px]">
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          {/* Loan Amount */}

          <FormField
            control={form.control}
            name="loan_purpose"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loan Purpose</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select loan purpose" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Business Capital">
                      Business Capital
                    </SelectItem>
                    <SelectItem value="Medical Expenses">
                      Medical Expenses
                    </SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Debt Consolidation">
                      Debt Consolidation
                    </SelectItem>
                    <SelectItem value="Home Improvement">
                      Home Improvement
                    </SelectItem>
                    <SelectItem value="Emergency Funds">
                      Emergency Funds
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="min-h-[10px]">
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="monthly_revenue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Revenue</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter monthly revenue"
                    type="number"
                    {...field}
                  />
                </FormControl>

                <div className="min-h-[10px]">
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="credit_score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Credit Score</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select credit score" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="poor">Poor (639 or less)</SelectItem>
                    <SelectItem value="fair">Fair (640-679)</SelectItem>
                    <SelectItem value="good">Good (680-719)</SelectItem>
                    <SelectItem value="excellent">Excellent (720+)</SelectItem>
                  </SelectContent>
                </Select>
                <div className="min-h-[10px]">
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payment_schedule"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Schedule</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select payment schedule" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Bi-Weekly">Bi-Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <div className="min-h-[10px]">
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="repayment_period"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repayment Period</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select repayment period" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="3">3 Months</SelectItem>
                    <SelectItem value="6">6 Months</SelectItem>
                    <SelectItem value="12">12 Months</SelectItem>
                    <SelectItem value="24">24 Months</SelectItem>
                    <SelectItem value="36">36 Months</SelectItem>
                  </SelectContent>
                </Select>
                <div className="min-h-[10px]">
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <div className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Last Name */}
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter first name"
                        {...field}
                        onChange={(e) => {
                          const formattedValue = e.target.value
                            .split(" ")
                            .map((word) => capitalizeFirstLetter(word))
                            .join(" ");
                          field.onChange(formattedValue);
                        }}
                      />
                    </FormControl>
                    <div className="min-h-[10px]">
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              {/* First Name */}
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter first name"
                        {...field}
                        onChange={(e) => {
                          const formattedValue = e.target.value
                            .split(" ")
                            .map((word) => capitalizeFirstLetter(word))
                            .join(" ");
                          field.onChange(formattedValue);
                        }}
                      />
                    </FormControl>
                    <div className="min-h-[10px]">
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              {/* Middle Name */}
              <FormField
                control={form.control}
                name="middle_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Middle Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter middle name"
                        {...field}
                        onChange={(e) =>
                          field.onChange(capitalizeFirstLetter(e.target.value))
                        }
                      />
                    </FormControl>
                    <div className="min-h-[10px]">
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <FormField
            control={form.control}
            name="phone_number"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <PhoneInput
                    {...field}
                    defaultCountry="PH"
                    placeholder="Enter phone number"
                    onBlur={field.onBlur}
                    onChange={(value) => field.onChange(value || "")}
                    className={
                      form.formState.errors.phone_number ? "border-red-500" : ""
                    }
                  />
                </FormControl>
                <div className="min-h-[10px]">
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter email address"
                    type="email"
                    {...field}
                  />
                </FormControl>
                <div className="min-h-[10px]">
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <div className="md:col-span-2 flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </Button>
            <Button type="submit" disabled={loading}>
              {" "}
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </form>
      </div>
    </Form>
  );
};
