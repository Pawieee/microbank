/* eslint-disable @typescript-eslint/no-unused-vars */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { useState, useEffect } from "react";
import { ApplicationStatusNotification } from "./application-status-notification";
import { cn } from "@/lib/utils";
import {
  IconUser,
  IconCash,
  IconBuildingBank,
} from "@tabler/icons-react";
import { AccessDenied } from "./access-denied";

const formatName = (value: string) => {
  if (!value) return "";
  return value
    .split(" ") // Split the string by spaces
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize each word
    .join(" "); // Join them back with spaces
};

const formSchema = z.object({
  employment_status: z.string().min(1, "Employment status is required"),
  loan_amount: z.coerce.number().min(5000).max(50000),
  loan_purpose: z.string().min(1, "Loan purpose is required"),
  payment_schedule: z.string().min(1, "Payment schedule is required"),
  monthly_revenue: z.coerce.number().min(5000, "Minimum revenue is 5000"),
  credit_score: z.string().min(1, "Credit score is required"),

  last_name: z.string().min(1, "Required").trim().max(50).regex(/^[A-Za-z\s]+$/),
  first_name: z.string().min(1, "Required").trim().max(50).regex(/^[A-Za-z\s]+$/),
  middle_name: z.string().trim().max(50).regex(/^[A-Za-z\s]*$/).optional().or(z.literal("")),

  email: z.string().min(1, "Required").email("Invalid email"),

  phone_number: z.string()
    .min(1, "Phone number is required")
    .refine((val) => val.length > 4, "Invalid phone number"),

  repayment_period: z.string().min(1, "Required"),
});

type LoanFormProps = {
  onSuccess?: (data: any) => void;
};

export const LoanForm: React.FC<LoanFormProps> = ({ onSuccess }) => {
  const [isRestricted, setIsRestricted] = useState(false);
  const [isClientCheckLoading, setIsClientCheckLoading] = useState(true);

  // 1. ROLE CHECK
  useEffect(() => {
    const role = localStorage.getItem("role");

    // Managers and Admins cannot view Loan Form
    if (role === "manager" || role === "admin") {
      setIsRestricted(true);
      setIsClientCheckLoading(false);
      return;
    }

    setIsClientCheckLoading(false);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      loan_amount: 5000,
      monthly_revenue: 0,
      employment_status: "",
      loan_purpose: "",
      payment_schedule: "",
      repayment_period: "",
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
      loan_amount: 5000,
      monthly_revenue: 0,
      employment_status: "",
      loan_purpose: "",
      payment_schedule: "",
      repayment_period: "",
      credit_score: "",
      last_name: "",
      first_name: "",
      middle_name: "",
      email: "",
      phone_number: "",
    });
  }

  const [loading, setLoading] = useState(false);
  const [loanStatus, setLoanStatus] = useState<"Approved" | "Rejected" | null>(null);

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const response = await fetch("/api/loan-status-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed");
      const result = await response.json();
      setLoanStatus(result.status);
      if (onSuccess) onSuccess(data);
    } catch (error) {
      setLoanStatus("Rejected");
    } finally {
      setLoading(false);
    }
  }

  if (isRestricted) {
    return <AccessDenied />;
  }

  if (isClientCheckLoading) {
    return <div className="p-10 text-center text-muted-foreground">Checking permissions...</div>;
  }

  if (loanStatus) {
    return (
      <ApplicationStatusNotification
        status={loanStatus as "Approved" | "Rejected"}
      />
    );
  }

  return (
    <div className="w-full mx-auto py-6 px-4 md:px-8">
      {/* HEADER */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">New Loan Application</h2>
        <p className="text-muted-foreground mt-2">
          Fill out the details below to process a new loan request.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          {/* SECTION 1: LOAN DETAILS */}
          <div className="bg-card border rounded-xl shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <IconCash size={24} />
              </div>
              <h3 className="text-lg font-semibold">Loan Configuration</h3>
            </div>

            <FormField
              control={form.control}
              name="loan_amount"
              render={({ field: { value, onChange } }) => (
                <FormItem className="space-y-4 bg-muted/30 p-4 rounded-lg border border-dashed">
                  <div className="flex justify-between items-end">
                    <FormLabel className="text-base font-medium">Desired Amount</FormLabel>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-primary">₱{value.toLocaleString()}</span>
                    </div>
                  </div>
                  <FormControl>
                    <Slider
                      min={5000}
                      max={50000}
                      step={500}
                      value={[value]}
                      onValueChange={(vals) => onChange(vals[0])}
                      className="py-4"
                    />
                  </FormControl>
                  <div className="flex justify-between text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    <span>Min: ₱5k</span>
                    <span>Max: ₱50k</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Changed gap-6 to gap-5 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              <FormField
                control={form.control}
                name="loan_purpose"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Loan Purpose</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select purpose" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Business Capital">Business Capital</SelectItem>
                        <SelectItem value="Medical Expenses">Medical Expenses</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Debt Consolidation">Debt Consolidation</SelectItem>
                        <SelectItem value="Home Improvement">Home Improvement</SelectItem>
                        <SelectItem value="Emergency Funds">Emergency Funds</SelectItem>
                      </SelectContent>
                    </Select>
                    {/* Reduced height & font size */}
                    <div className="h-4 mt-1">
                      <FormMessage className="text-xs" />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="repayment_period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term (Months)</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select duration" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="3">3 Months</SelectItem>
                        <SelectItem value="6">6 Months</SelectItem>
                        <SelectItem value="12">12 Months</SelectItem>
                        <SelectItem value="24">24 Months</SelectItem>
                        <SelectItem value="36">36 Months</SelectItem>
                      </SelectContent>
                    </Select>
                    {/* Reduced height & font size */}
                    <div className="h-4 mt-1">
                      <FormMessage className="text-xs" />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_schedule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Frequency</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select schedule" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                        <SelectItem value="Bi-Weekly">Bi-Weekly</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    {/* Reduced height & font size */}
                    <div className="h-4 mt-1">
                      <FormMessage className="text-xs" />
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* SECTION 2: FINANCIAL PROFILE */}
          <div className="bg-card border rounded-xl shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg dark:bg-blue-900/20">
                <IconBuildingBank size={24} />
              </div>
              <h3 className="text-lg font-semibold">Financial Profile</h3>
            </div>

            {/* Changed gap-6 to gap-5 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              <FormField
                control={form.control}
                name="monthly_revenue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Revenue</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        className={cn(form.formState.errors.monthly_revenue && "border-red-500 ring-red-500")}
                      />
                    </FormControl>
                    {/* Reduced height & font size */}
                    <div className="h-4 mt-1">
                      <FormMessage className="text-xs" />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="credit_score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Score Rating</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select rating" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="poor">Poor (639 or less)</SelectItem>
                        <SelectItem value="fair">Fair (640-679)</SelectItem>
                        <SelectItem value="good">Good (680-719)</SelectItem>
                        <SelectItem value="excellent">Excellent (720+)</SelectItem>
                      </SelectContent>
                    </Select>
                    {/* Reduced height & font size */}
                    <div className="h-4 mt-1">
                      <FormMessage className="text-xs" />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employment_status"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Employment Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select status" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="employed">Employed</SelectItem>
                        <SelectItem value="self-employed">Self-Employed</SelectItem>
                        <SelectItem value="unemployed">Unemployed</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                      </SelectContent>
                    </Select>
                    {/* Reduced height & font size */}
                    <div className="h-4 mt-1">
                      <FormMessage className="text-xs" />
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* SECTION 3: APPLICANT DETAILS */}
          <div className="bg-card border rounded-xl shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg dark:bg-green-900/20">
                <IconUser size={24} />
              </div>
              <h3 className="text-lg font-semibold">Applicant Information</h3>
            </div>

            {/* Changed gap-4 to gap-3 for tighter name fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Santos"
                        {...field}
                        onChange={(e) => field.onChange(formatName(e.target.value))}
                        className={cn(form.formState.errors.last_name && "border-red-500 focus-visible:ring-red-500")}
                      />
                    </FormControl>
                    {/* Reduced height & font size */}
                    <div className="h-4 mt-1">
                      <FormMessage className="text-xs" />
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Juan"
                        {...field}
                        onChange={(e) => field.onChange(formatName(e.target.value))} className={cn(form.formState.errors.first_name && "border-red-500 focus-visible:ring-red-500")}
                      />
                    </FormControl>
                    {/* Reduced height & font size */}
                    <div className="h-4 mt-1">
                      <FormMessage className="text-xs" />
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="middle_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Middle Name <span className="text-muted-foreground font-normal ml-1">(Optional)</span></FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Delacruz"
                        {...field}
                        onChange={(e) => field.onChange(formatName(e.target.value))} />
                    </FormControl>
                    {/* Reduced height & font size */}
                    <div className="h-4 mt-1">
                      <FormMessage className="text-xs" />
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Changed gap-6 to gap-5 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <PhoneInput
                        {...field}
                        defaultCountry="PH"
                        className={form.formState.errors.phone_number ? "border-red-500" : ""}
                      />
                    </FormControl>
                    {/* Reduced height & font size */}
                    <div className="h-4 mt-1">
                      <FormMessage className="text-xs" />
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
                        placeholder="juan@example.com"
                        {...field}
                        className={cn(form.formState.errors.email && "border-red-500 focus-visible:ring-red-500")}
                      />
                    </FormControl>
                    {/* Reduced height & font size */}
                    <div className="h-4 mt-1">
                      <FormMessage className="text-xs" />
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-4 pt-4 pb-10">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleReset}
              disabled={loading}
              className="w-full md:w-auto"
            >
              Reset Form
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full md:w-auto min-w-[150px]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Processing...
                </div>
              ) : "Submit Application"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};