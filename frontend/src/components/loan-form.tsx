/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
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
import { Checkbox } from "@/components/ui/checkbox";
import { PhoneInput } from "@/components/ui/phone-input";
import { Calendar } from "@/components/ui/calendar"; 
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useState, useEffect } from "react";
import { ApplicationStatusNotification } from "./application-status-notification";
import { cn } from "@/lib/utils";
import {
  IconUser,
  IconCash,
  IconBuildingBank,
  IconUpload,
  IconTrash,
  IconCalendar, 
} from "@tabler/icons-react";
import { AccessDenied } from "./access-denied";

// --- HELPERS ---
const formatName = (value: string) => {
  if (!value) return "";
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const FormErrorSpace = ({ children }: { children: React.ReactNode }) => (
  <div className="h-5 mt-1 text-xs">{children}</div>
);

const LabelReq = ({ children }: { children: React.ReactNode }) => (
  <span className="flex items-center gap-1">
    {children} <span className="text-red-500 font-bold">*</span>
  </span>
);

// --- SCHEMA ---
const formSchema = z.object({
  // 1. Identity & KYC
  last_name: z.string().min(1, "Required").trim().max(50),
  first_name: z.string().min(1, "Required").trim().max(50),
  middle_name: z.string().optional(),

  date_of_birth: z.date({
    required_error: "Date of birth is required.",
  }).refine((date) => {
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    return age >= 18;
  }, "Must be 18+ years old"),

  civil_status: z.string().min(1, "Required"),
  gender: z.string().min(1, "Required"),

  // Valid ID
  id_type: z.string().min(1, "Required"),
  // UPDATED: Now expects a String (Base64) instead of File object
  id_image_data: z.string().min(1, "ID Image is required"),

  // Contact
  email: z.string().email("Invalid email"),
  phone_number: z.string().min(10, "Invalid number"),
  address: z.string().min(10, "Incomplete address"),

  // 2. Financials
  employment_status: z.string().min(1, "Required"),
  monthly_revenue: z.coerce.number().min(5000, "Min. 5000"),
  credit_score: z.string().min(1, "Required"),

  // 3. Loan Config
  loan_amount: z.coerce.number().min(5000).max(50000),
  loan_purpose: z.string().min(1, "Required"),
  payment_schedule: z.string().min(1, "Required"),
  repayment_period: z.string().min(1, "Required"),

  // 4. Disbursement
  disbursement_method: z.string().min(1, "Required"),
  account_number: z.string().optional(),

  // 5. Legal
  agree_terms: z.boolean().refine((val) => val === true, "Required"),
}).superRefine((data, ctx) => {
  if (data.disbursement_method !== "Cash Pickup" && (!data.account_number || data.account_number.length < 5)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Account number required",
      path: ["account_number"],
    });
  }
});

type LoanFormProps = {
  onSuccess?: (data: any) => void;
};

export const LoanForm: React.FC<LoanFormProps> = ({ onSuccess }) => {
  const [isRestricted, setIsRestricted] = useState(false);
  const [isClientCheckLoading, setIsClientCheckLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role === "admin") setIsRestricted(true);
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
      disbursement_method: "",
      account_number: "",
      credit_score: "",
      id_type: "",
      id_image_data: "",
      last_name: "",
      first_name: "",
      middle_name: "",
      civil_status: "",
      gender: "",
      email: "",
      phone_number: "",
      address: "",
      agree_terms: false,
    },
  });

  const [loading, setLoading] = useState(false);
  const [loanStatus, setLoanStatus] = useState<"Approved" | "Rejected" | null>(null);
  const disbursementMethod = form.watch("disbursement_method");

  // UPDATED: Convert File to Base64 String
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, onChange: (value: any) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreviewUrl(base64String); // Show preview
        onChange(base64String);      // Save actual base64 string to form
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (onChange: (value: any) => void) => {
    onChange("");
    setPreviewUrl(null);
  };

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      // FIX 1: Clean the data before sending
      // Ensure date_of_birth is a string for JSON transmission
      const formattedData = {
        ...data,
        date_of_birth: data.date_of_birth.toISOString(), // Send as ISO string
        // Note: id_image_data is already a Base64 string from the handleImageChange
      };

      const response = await fetch("/api/loan-status-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) throw new Error("Failed");
      const result = await response.json();
      setLoanStatus(result.status);
      if (onSuccess) onSuccess(data);
    } catch (error) {
      console.error(error);
      setLoanStatus("Rejected");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    form.reset();
    setPreviewUrl(null);
  }

  if (isRestricted) return <AccessDenied />;
  if (isClientCheckLoading) return null;
  if (loanStatus) return <ApplicationStatusNotification status={loanStatus as "Approved" | "Rejected"} />;

  return (
    <div className="w-full h-full p-6 bg-gray-50/50">
      {/* ... [Header Code - Unchanged] ... */}
      <div className="flex items-center justify-between mb-8 max-w-[1800px] mx-auto">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            Loan Application
          </h2>
          <p className="text-muted-foreground mt-1">
            Teller-Assisted Form • Fields marked with <span className="text-red-500">*</span> are mandatory.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-[1800px] mx-auto">
          {/* ... [Section 1 Code] ... */}
          
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="bg-zinc-100/50 px-6 py-3 border-b flex items-center gap-2">
              <IconUser className="text-zinc-600" size={18} />
              <h3 className="font-bold text-sm uppercase tracking-wide text-zinc-700">Applicant Identity & KYC</h3>
            </div>

            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-2">
                
                {/* [Name Fields - Unchanged] */}
                <div className="md:col-span-4">
                  <FormField control={form.control} name="last_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel><LabelReq>Last Name</LabelReq></FormLabel>
                      <FormControl><Input placeholder="Dela Cruz" {...field} onChange={(e) => field.onChange(formatName(e.target.value))} className={cn(form.formState.errors.last_name && "border-red-500 focus-visible:ring-red-500")} /></FormControl>
                      <FormErrorSpace><FormMessage /></FormErrorSpace>
                    </FormItem>
                  )} />
                </div>
                <div className="md:col-span-4">
                  <FormField control={form.control} name="first_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel><LabelReq>First Name</LabelReq></FormLabel>
                      <FormControl><Input placeholder="Juan" {...field} onChange={(e) => field.onChange(formatName(e.target.value))} className={cn(form.formState.errors.first_name && "border-red-500 focus-visible:ring-red-500")} /></FormControl>
                      <FormErrorSpace><FormMessage /></FormErrorSpace>
                    </FormItem>
                  )} />
                </div>
                <div className="md:col-span-4">
                  <FormField control={form.control} name="middle_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Middle Name <span className="text-muted-foreground text-xs font-normal">(Optional)</span></FormLabel>
                      <FormControl><Input placeholder="Reyes" {...field} onChange={(e) => field.onChange(formatName(e.target.value))} /></FormControl>
                      <FormErrorSpace><FormMessage /></FormErrorSpace>
                    </FormItem>
                  )} />
                </div>

                {/* [Demographics - Unchanged] */}
                <div className="md:col-span-4">
                  <FormField
                    control={form.control}
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel><LabelReq>Date of Birth</LabelReq></FormLabel>
                        <Popover>
                          <FormControl>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                  form.formState.errors.date_of_birth && "border-red-500 ring-red-500"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <IconCalendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                          </FormControl>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                              captionLayout="dropdown"
                              fromYear={1940}
                              toYear={new Date().getFullYear()}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormErrorSpace><FormMessage /></FormErrorSpace>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="md:col-span-4">
                  <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem>
                      <FormLabel><LabelReq>Gender</LabelReq></FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className={cn("w-full", form.formState.errors.gender && "border-red-500 ring-red-500")}>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent>
                      </Select>
                      <FormErrorSpace><FormMessage /></FormErrorSpace>
                    </FormItem>
                  )} />
                </div>
                <div className="md:col-span-4">
                  <FormField control={form.control} name="civil_status" render={({ field }) => (
                    <FormItem>
                      <FormLabel><LabelReq>Civil Status</LabelReq></FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className={cn("w-full", form.formState.errors.civil_status && "border-red-500 ring-red-500")}>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent><SelectItem value="Single">Single</SelectItem><SelectItem value="Married">Married</SelectItem><SelectItem value="Widowed">Widowed</SelectItem><SelectItem value="Separated">Separated</SelectItem></SelectContent>
                      </Select>
                      <FormErrorSpace><FormMessage /></FormErrorSpace>
                    </FormItem>
                  )} />
                </div>

                {/* ID & UPLOAD */}
                <div className="md:col-span-12 h-px bg-border my-2" />

                <div className="md:col-span-4">
                  <FormField control={form.control} name="id_type" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><LabelReq>Valid ID Type</LabelReq></FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className={cn("w-full", form.formState.errors.id_type && "border-red-500 ring-red-500")}>
                            <SelectValue placeholder="Choose ID Type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Passport">Passport</SelectItem>
                          <SelectItem value="Driver License">Driver's License</SelectItem>
                          <SelectItem value="UMID">UMID / SSS</SelectItem>
                          <SelectItem value="PhilSys">National ID (PhilSys)</SelectItem>
                          <SelectItem value="PRC">PRC ID</SelectItem>
                          <SelectItem value="Voter ID">Voter's ID</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormErrorSpace><FormMessage /></FormErrorSpace>
                    </FormItem>
                  )} />
                </div>

                <div className="md:col-span-8">
                  <FormField
                    control={form.control}
                    name="id_image_data"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                      <FormItem>
                        <FormLabel><LabelReq>Upload ID Image</LabelReq></FormLabel>
                        <FormControl>
                          <div className={cn(
                            "relative flex w-full items-center justify-center rounded-md border border-dashed transition-all hover:bg-muted/50 overflow-hidden",
                            previewUrl ? "h-64 border-solid bg-zinc-900 border-zinc-900" : "h-32 p-4",
                            form.formState.errors.id_image_data && !previewUrl ? "border-red-500 bg-red-50/50" : "border-input"
                          )}>
                            {!previewUrl ? (
                              <>
                                <Input
                                  {...fieldProps}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  id="id_upload"
                                  onChange={(e) => handleImageChange(e, onChange)}
                                />
                                <label
                                  htmlFor="id_upload"
                                  className="flex w-full h-full cursor-pointer flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
                                >
                                  <div className="p-3 bg-muted rounded-full">
                                    <IconUpload size={20} />
                                  </div>
                                  <span className="text-sm font-medium">Click to upload valid ID (JPG/PNG)</span>
                                </label>
                              </>
                            ) : (
                              <div className="relative w-full h-full group">
                                <img
                                  src={previewUrl}
                                  alt="ID Preview"
                                  className="h-full w-full object-contain"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeImage(onChange)}
                                    className="gap-2"
                                  >
                                    <IconTrash size={16} /> Remove Image
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormErrorSpace><FormMessage /></FormErrorSpace>
                      </FormItem>
                    )}
                  />
                </div>

                {/* [Contact Fields - Unchanged] */}
                <div className="md:col-span-12 h-px bg-border my-2" />
                <div className="md:col-span-6">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel><LabelReq>Email Address</LabelReq></FormLabel>
                      <FormControl><Input placeholder="client@email.com" {...field} className={cn(form.formState.errors.email && "border-red-500 focus-visible:ring-red-500")} /></FormControl>
                      <FormErrorSpace><FormMessage /></FormErrorSpace>
                    </FormItem>
                  )} />
                </div>
                <div className="md:col-span-6">
                  <FormField control={form.control} name="phone_number" render={({ field }) => (
                    <FormItem>
                      <FormLabel><LabelReq>Mobile Number</LabelReq></FormLabel>
                      <FormControl>
                        <div className={cn(form.formState.errors.phone_number && "border border-red-500 rounded-md focus-within:ring-red-500")}>
                          <PhoneInput {...field} defaultCountry="PH" />
                        </div>
                      </FormControl>
                      <FormErrorSpace><FormMessage /></FormErrorSpace>
                    </FormItem>
                  )} />
                </div>
                <div className="md:col-span-12">
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><LabelReq>Permanent Address</LabelReq></FormLabel>
                      <FormControl><Input placeholder="House No., Street, Subdivision, Barangay, City, Province" {...field} className={cn(form.formState.errors.address && "border-red-500 focus-visible:ring-red-500")} /></FormControl>
                      <FormErrorSpace><FormMessage /></FormErrorSpace>
                    </FormItem>
                  )} />
                </div>
              </div>
            </div>
          </div>

          {/* [Financials, Loan Config, Disbursement, Agreement, Footer - Unchanged] */}
          {/* ... (Rest of the component remains exactly as you had it, just mapped to the form) ... */}
          {/* To save space in this answer, imagine the rest of the form sections here */}
          {/* If you need the full file again, I can provide it, but only the file input logic and validation changed above. */}
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* LEFT: FINANCIALS */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden h-full">
              <div className="bg-blue-50/50 px-6 py-3 border-b flex items-center gap-2">
                <IconBuildingBank className="text-blue-600" size={18} />
                <h3 className="font-bold text-sm uppercase tracking-wide text-blue-900">Financial Profile</h3>
              </div>
              <div className="p-6 space-y-2">
                <div className="grid grid-cols-1 gap-y-2">
                  <FormField control={form.control} name="employment_status" render={({ field }) => (
                    <FormItem>
                      <FormLabel><LabelReq>Employment Status</LabelReq></FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className={cn("w-full", form.formState.errors.employment_status && "border-red-500 ring-red-500")}><SelectValue placeholder="Select Status" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="employed">Employed (Private/Gov)</SelectItem>
                          <SelectItem value="self-employed">Self-Employed / Business</SelectItem>
                          <SelectItem value="ofw">OFW</SelectItem>
                          <SelectItem value="retired">Retired / Pensioner</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormErrorSpace><FormMessage /></FormErrorSpace>
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="monthly_revenue" render={({ field }) => (
                    <FormItem>
                      <FormLabel><LabelReq>Monthly Gross Income</LabelReq></FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₱</span>
                          <Input type="number" className={cn("pl-7", form.formState.errors.monthly_revenue && "border-red-500 focus-visible:ring-red-500")} placeholder="0.00" {...field} />
                        </div>
                      </FormControl>
                      <FormErrorSpace><FormMessage /></FormErrorSpace>
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="credit_score" render={({ field }) => (
                    <FormItem>
                      <FormLabel><LabelReq>Credit Score Rating</LabelReq></FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className={cn("w-full", form.formState.errors.credit_score && "border-red-500 ring-red-500")}><SelectValue placeholder="Assess Rating" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="excellent">Excellent (720+)</SelectItem>
                          <SelectItem value="good">Good (680-719)</SelectItem>
                          <SelectItem value="fair">Fair (640-679)</SelectItem>
                          <SelectItem value="poor">Poor (639 or below)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Based on credit investigation results.</FormDescription>
                      <FormErrorSpace><FormMessage /></FormErrorSpace>
                    </FormItem>
                  )} />
                </div>
              </div>
            </div>

            {/* RIGHT: LOAN CONFIG */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden h-full">
              <div className="bg-emerald-50/50 px-6 py-3 border-b flex items-center gap-2">
                <IconCash className="text-emerald-600" size={18} />
                <h3 className="font-bold text-sm uppercase tracking-wide text-emerald-900">Loan Structure</h3>
              </div>
              <div className="p-6 space-y-2">
                <FormField control={form.control} name="loan_amount" render={({ field: { value, onChange } }) => (
                  <FormItem className="bg-emerald-50/30 p-4 rounded border border-emerald-100 mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <FormLabel className="text-emerald-900 font-semibold">Principal Amount</FormLabel>
                      <span className="text-3xl font-bold text-emerald-700">₱{value.toLocaleString()}</span>
                    </div>
                    <FormControl><Slider min={5000} max={50000} step={500} value={[value]} onValueChange={(vals) => onChange(vals[0])} /></FormControl>
                    <FormErrorSpace><FormMessage /></FormErrorSpace>
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="repayment_period" render={({ field }) => (
                    <FormItem>
                      <FormLabel><LabelReq>Term</LabelReq></FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className={cn("w-full", form.formState.errors.repayment_period && "border-red-500 ring-red-500")}><SelectValue placeholder="Months" /></SelectTrigger></FormControl><SelectContent><SelectItem value="3">3 Months</SelectItem><SelectItem value="6">6 Months</SelectItem><SelectItem value="12">12 Months</SelectItem><SelectItem value="24">24 Months</SelectItem></SelectContent></Select>
                      <FormErrorSpace><FormMessage /></FormErrorSpace>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="payment_schedule" render={({ field }) => (
                    <FormItem>
                      <FormLabel><LabelReq>Payment Frequency</LabelReq></FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className={cn("w-full", form.formState.errors.payment_schedule && "border-red-500 ring-red-500")}><SelectValue placeholder="Select Frequency" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Weekly">Weekly</SelectItem><SelectItem value="Bi-Weekly">Bi-Weekly</SelectItem><SelectItem value="Monthly">Monthly</SelectItem></SelectContent></Select>
                      <FormErrorSpace><FormMessage /></FormErrorSpace>
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="loan_purpose" render={({ field }) => (
                  <FormItem>
                    <FormLabel><LabelReq>Loan Purpose</LabelReq></FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className={cn("w-full", form.formState.errors.loan_purpose && "border-red-500 ring-red-500")}><SelectValue placeholder="Select Purpose" /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="Business Capital">Business Capital</SelectItem><SelectItem value="Emergency">Emergency Funds</SelectItem><SelectItem value="Education">Education</SelectItem><SelectItem value="Medical">Medical Expenses</SelectItem><SelectItem value="Renovation">Home Renovation</SelectItem></SelectContent></Select>
                    <FormErrorSpace><FormMessage /></FormErrorSpace>
                  </FormItem>
                )} />
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="bg-zinc-50 px-6 py-3 border-b flex items-center gap-2">
              <h3 className="font-bold text-sm text-foreground">Disbursement Method</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="disbursement_method" render={({ field }) => (
                  <FormItem>
                    <FormLabel><LabelReq>Preferred Method</LabelReq></FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className={cn("w-full", form.formState.errors.disbursement_method && "border-red-500 ring-red-500")}><SelectValue placeholder="Select Method" /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="Cash Pickup">Cash Pickup (Branch)</SelectItem><SelectItem value="GCash">GCash</SelectItem><SelectItem value="Maya">Maya</SelectItem><SelectItem value="Bank Transfer">Bank Transfer (BDO/BPI)</SelectItem></SelectContent></Select>
                    <FormErrorSpace><FormMessage /></FormErrorSpace>
                  </FormItem>
                )} />

                {disbursementMethod && disbursementMethod !== "Cash Pickup" && (
                  <FormField control={form.control} name="account_number" render={({ field }) => (
                    <FormItem>
                      <FormLabel><LabelReq>Account / Mobile Number</LabelReq></FormLabel>
                      <FormControl><Input placeholder="e.g. 09xxxxxxxxx or Account No." {...field} className={cn("font-mono bg-yellow-50/50 border-yellow-200", form.formState.errors.account_number && "border-red-500 focus-visible:ring-red-500")} /></FormControl>
                      <FormErrorSpace><FormMessage /></FormErrorSpace>
                    </FormItem>
                  )} />
                )}
              </div>
            </div>
          </div>

          <div className={cn(
            "bg-card p-6 rounded-xl border border-dashed flex items-start gap-4 transition-colors",
            form.formState.errors.agree_terms ? "border-red-500 bg-red-50/30" : ""
          )}>
            <FormField control={form.control} name="agree_terms" render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 w-full">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className={cn(form.formState.errors.agree_terms && "border-red-500")} /></FormControl>
                <div className="space-y-1 leading-none w-full">
                  <FormLabel className="font-bold text-base flex items-center gap-2">
                    Teller Attestation <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormDescription>
                    I hereby certify that I have verified the applicant's identity using the Valid ID provided above. The applicant has been informed of the Terms & Conditions, Privacy Policy, and Loan Amortization Schedule, and has given their consent to proceed.
                  </FormDescription>
                  <FormErrorSpace><FormMessage /></FormErrorSpace>
                </div>
              </FormItem>
            )}
            />
          </div>

          <div className="flex justify-end gap-4 py-6">
            <Button type="button" variant="ghost" size="lg" onClick={handleReset} disabled={loading}>Clear Form</Button>
            <Button type="submit" size="lg" disabled={loading} className="min-w-[200px] bg-zinc-900 hover:bg-zinc-800">
              {loading ? (
                <div className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />Calculating...</div>
              ) : (
                "Submit Application"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};