/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { useState, useEffect } from "react";

// --- UI Components ---
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  // DialogHeader, DialogTitle, DialogDescription, DialogFooter // Removed unused imports
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ApplicationStatusNotification } from "@/components/feature/loans/application-status-notification";
import { AccessDenied } from "@/components/shared/access-denied";
import { FixedPhoneInput } from "@/components/ui/phone-input";
import { LoanOfferDialog } from "@/components/feature/loans/loan-offer-dialog";

// --- Icons & Utils ---
import { cn } from "@/lib/utils";
import {
  IconUser,
  IconCash,
  IconBuildingBank,
  IconUpload,
  IconTrash,
  IconCalendar,
  IconFileCertificate,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { Loader2 } from "lucide-react"; // ShieldCheck & Lock moved to new component

// --- Hooks ---
import { useLoanForm } from "@/hooks/useLoanForm";
import { usePhAddress } from "@/hooks/usePHAddress";

// ... (Helpers formatName, FormErrorSpace, LabelReq remain same) ...
const formatName = (value: string) => {
  if (!value) return "";
  return value.split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
};

const FormErrorSpace = ({ children }: { children: React.ReactNode }) => (
  <div className="h-5 mt-1 text-xs">{children}</div>
);

const LabelReq = ({ children }: { children: React.ReactNode }) => (
  <span className="flex items-center gap-1">
    {children} <span className="text-red-500 font-bold">*</span>
  </span>
);

const formSchema = z.object({
  last_name: z.string().min(1, "Required").trim().max(50),
  first_name: z.string().min(1, "Required").trim().max(50),
  middle_name: z.string().optional(),
  date_of_birth: z.date({ required_error: "Required" }).refine((date) => {
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    return age >= 18;
  }, "Must be 18+ years old"),
  civil_status: z.string().min(1, "Required"),
  gender: z.string().min(1, "Required"),
  id_type: z.string().min(1, "Required"),
  id_image_data: z.string().min(1, "ID Image is required"),
  email: z.string().email("Invalid email"),
  phone_number: z.string()
    .min(13, "Must be 9 digits")
    .max(13, "Must be 9 digits")
    .refine((val) => val.startsWith("+63"), "Format error"),
  address: z.string().min(10, "Incomplete address"),
  employment_status: z.string().min(1, "Required"),
  monthly_revenue: z.coerce.number().min(5000, "Min. 5000"),
  loan_amount: z.coerce.number().min(5000).max(50000),
  loan_purpose: z.string().min(1, "Required"),
  payment_schedule: z.string().min(1, "Required"),
  repayment_period: z.string().min(1, "Required"),
  disbursement_method: z.string().min(1, "Required"),
  account_number: z.string().optional(),
  agree_terms: z.boolean().refine((val) => val === true, "Required"),
}).superRefine((data, ctx) => {
  if (data.disbursement_method !== "Cash Pickup" && (!data.account_number || data.account_number.length < 5)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Account number required", path: ["account_number"] });
  }
});

type LoanFormProps = {
  onSuccess?: (data: any) => void;
};

export const LoanForm: React.FC<LoanFormProps> = ({ onSuccess }) => {
  const [isRestricted, setIsRestricted] = useState(false);
  const [isClientCheckLoading, setIsClientCheckLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    provinces, cities, barangays,
    loadingProvinces, loadingCities, loadingBarangays,
    fetchCities, fetchBarangays
  } = usePhAddress();

  const [addrSelection, setAddrSelection] = useState({
    street: "", provinceName: "", provinceCode: "", cityName: "", cityCode: "", barangayName: "", barangayCode: "", zip: ""
  });

  const [purposeCategory, setPurposeCategory] = useState<string>("");
  const { loading, checkEligibility, submitApplication, offer, resetFormState } = useLoanForm();

  const [showDisclosure, setShowDisclosure] = useState(false);
  const [showRejection, setShowRejection] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [generatedScore, setGeneratedScore] = useState<number | null>(null);
  const [loanStatus, setLoanStatus] = useState<"Approved" | "Rejected" | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role === "admin") setIsRestricted(true);
    setIsClientCheckLoading(false);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      loan_amount: 5000, monthly_revenue: 0, employment_status: "", loan_purpose: "",
      payment_schedule: "", repayment_period: "", disbursement_method: "", account_number: "",
      id_type: "", id_image_data: "", last_name: "", first_name: "", middle_name: "",
      civil_status: "", gender: "", email: "", phone_number: "", address: "", agree_terms: false,
    },
  });

  const disbursementMethod = form.watch("disbursement_method");

  useEffect(() => {
    const { street, barangayName, cityName, provinceName, zip } = addrSelection;
    if (street || barangayName || cityName || provinceName) {
      const fullAddress = `${street}, ${barangayName}, ${cityName}, ${provinceName} ${zip}`.replace(/^, /, '').replace(/, ,/g, ',').trim();
      form.setValue("address", fullAddress, { shouldValidate: true });
    }
  }, [addrSelection, form]);

  const handleAddressSelect = (type: 'province' | 'city' | 'barangay', value: string) => {
    if (type === 'province') {
      const selected = provinces.find(p => p.code === value);
      if (selected) {
        setAddrSelection(prev => ({ ...prev, provinceCode: selected.code, provinceName: selected.name, cityCode: "", cityName: "", barangayCode: "", barangayName: "" }));
        fetchCities(selected.code);
      }
    } else if (type === 'city') {
      const selected = cities.find(c => c.code === value);
      if (selected) {
        setAddrSelection(prev => ({ ...prev, cityCode: selected.code, cityName: selected.name, barangayCode: "", barangayName: "" }));
        fetchBarangays(selected.code);
      }
    } else if (type === 'barangay') {
      const selected = barangays.find(b => b.code === value);
      if (selected) {
        setAddrSelection(prev => ({ ...prev, barangayCode: selected.code, barangayName: selected.name }));
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, onChange: (value: any) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreviewUrl(base64String);
        onChange(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (onChange: (value: any) => void) => { onChange(""); setPreviewUrl(null); };

  const onCheckEligibility = async (data: z.infer<typeof formSchema>) => {
    const result = await checkEligibility(data);
    if (result.success && result.offer) {
      setGeneratedScore(result.credit_score || null);
      setShowDisclosure(true);
    } else {
      setRejectionReason(result.message || "Does not meet eligibility.");
      setShowRejection(true);
    }
  };

  const confirmSubmission = async () => {
    if (!generatedScore) return;
    const data = form.getValues();
    const result = await submitApplication(data, generatedScore);
    if (result.success) {
      setLoanStatus("Approved");
      setShowDisclosure(false);
      if (onSuccess) onSuccess(data);
    } else {
      setRejectionReason(result.message || "System error.");
      setShowRejection(true);
    }
  };

  const handleReset = () => {
    form.reset();
    setPreviewUrl(null);
    setAddrSelection({ street: "", provinceName: "", provinceCode: "", cityName: "", cityCode: "", barangayName: "", barangayCode: "", zip: "" });
    setPurposeCategory("");
    resetFormState();
    setGeneratedScore(null);
  };

  if (isRestricted) return <AccessDenied />;
  if (isClientCheckLoading) return null;
  if (loanStatus === "Approved") return <ApplicationStatusNotification />;

  return (
    <div className="w-full h-full p-6 bg-gray-50/50">
      <div className="flex items-center justify-between mb-8 max-w-[1800px] mx-auto">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">Loan Application</h2>
          <p className="text-muted-foreground mt-1">Teller-Assisted Form • Fields marked with <span className="text-red-500">*</span> are mandatory.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onCheckEligibility)} className="space-y-6 max-w-[1800px] mx-auto">
          {/* [Identity Section] */}
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="bg-zinc-100/50 px-6 py-3 border-b flex items-center gap-2">
              <IconUser className="text-zinc-600" size={18} />
              <h3 className="font-bold text-sm uppercase tracking-wide text-zinc-700">Applicant Identity & KYC</h3>
            </div>

            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-2">

                {/* NAME FIELDS */}
                <div className="md:col-span-4"><FormField control={form.control} name="last_name" render={({ field, fieldState }) => (<FormItem><FormLabel><LabelReq>Last Name</LabelReq></FormLabel><FormControl><Input placeholder="Enter last name" {...field} onChange={(e) => field.onChange(formatName(e.target.value))} className={cn("w-full", fieldState.invalid && "border-red-500 focus-visible:ring-red-500")} /></FormControl><FormErrorSpace><FormMessage /></FormErrorSpace></FormItem>)} /></div>
                <div className="md:col-span-4"><FormField control={form.control} name="first_name" render={({ field, fieldState }) => (<FormItem><FormLabel><LabelReq>First Name</LabelReq></FormLabel><FormControl><Input placeholder="Enter first name" {...field} onChange={(e) => field.onChange(formatName(e.target.value))} className={cn("w-full", fieldState.invalid && "border-red-500 focus-visible:ring-red-500")} /></FormControl><FormErrorSpace><FormMessage /></FormErrorSpace></FormItem>)} /></div>
                <div className="md:col-span-4"><FormField control={form.control} name="middle_name" render={({ field, fieldState }) => (<FormItem><FormLabel>Middle Name</FormLabel><FormControl><Input placeholder="Enter middle name" {...field} onChange={(e) => field.onChange(formatName(e.target.value))} className={cn("w-full", fieldState.invalid && "border-red-500 focus-visible:ring-red-500")} /></FormControl><FormErrorSpace><FormMessage /></FormErrorSpace></FormItem>)} /></div>

                {/* DOB, GENDER, CIVIL */}
                <div className="md:col-span-4"><FormField control={form.control} name="date_of_birth" render={({ field, fieldState }) => (<FormItem className="flex flex-col"><FormLabel><LabelReq>Date of Birth</LabelReq></FormLabel><Popover><FormControl><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground", fieldState.invalid && "border-red-500 ring-red-500")}>{field.value ? format(field.value, "PPP") : <span>Select date of birth</span>}<IconCalendar className="ml-auto h-4 w-4 opacity-50" /></Button></PopoverTrigger></FormControl><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus fromYear={1940} toYear={new Date().getFullYear()} captionLayout="dropdown" /></PopoverContent></Popover><FormErrorSpace><FormMessage /></FormErrorSpace></FormItem>)} /></div>
                <div className="md:col-span-4"><FormField control={form.control} name="gender" render={({ field, fieldState }) => (<FormItem className="w-full"><FormLabel><LabelReq>Gender</LabelReq></FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className={cn("w-full", fieldState.invalid && "border-red-500 focus:ring-red-500")}><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent></Select><FormErrorSpace><FormMessage /></FormErrorSpace></FormItem>)} /></div>
                <div className="md:col-span-4"><FormField control={form.control} name="civil_status" render={({ field, fieldState }) => (<FormItem className="w-full"><FormLabel><LabelReq>Civil Status</LabelReq></FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className={cn("w-full", fieldState.invalid && "border-red-500 focus:ring-red-500")}><SelectValue placeholder="Select civil status" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Single">Single</SelectItem><SelectItem value="Married">Married</SelectItem><SelectItem value="Widowed">Widowed</SelectItem><SelectItem value="Separated">Separated</SelectItem></SelectContent></Select><FormErrorSpace><FormMessage /></FormErrorSpace></FormItem>)} /></div>

                <div className="md:col-span-12 h-px bg-border my-2" />

                {/* ID & CONTACT */}
                <div className="md:col-span-4"><FormField control={form.control} name="id_type" render={({ field, fieldState }) => (<FormItem><FormLabel><LabelReq>Valid ID Type</LabelReq></FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className={cn("w-full", fieldState.invalid && "border-red-500 focus:ring-red-500")}><SelectValue placeholder="Select ID type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Passport">Passport</SelectItem><SelectItem value="Driver License">Driver's License</SelectItem><SelectItem value="UMID">UMID</SelectItem><SelectItem value="PhilSys">National ID (PhilSys)</SelectItem><SelectItem value="PRC">PRC ID</SelectItem></SelectContent></Select><FormErrorSpace><FormMessage /></FormErrorSpace></FormItem>)} /></div>
                <div className="md:col-span-8"><FormField control={form.control} name="id_image_data" render={({ field: { value, onChange, ...fieldProps }, fieldState }) => (<FormItem><FormLabel><LabelReq>Upload ID Image</LabelReq></FormLabel><FormControl><div className={cn("relative flex w-full items-center justify-center rounded-md border border-dashed hover:bg-muted/50 overflow-hidden", previewUrl ? "h-64 border-solid bg-zinc-900 border-zinc-900" : "h-32 p-4", fieldState.invalid && !previewUrl ? "border-red-500 bg-red-50/50" : "border-input")}>{!previewUrl ? (<><Input {...fieldProps} type="file" accept="image/*" className="hidden" id="id_upload" onChange={(e) => handleImageChange(e, onChange)} /><label htmlFor="id_upload" className="flex w-full h-full cursor-pointer flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground"><div className="p-3 bg-muted rounded-full"><IconUpload size={20} /></div><span className="text-sm font-medium">Click to upload valid ID (JPG/PNG)</span></label></>) : (<div className="relative w-full h-full group"><img src={previewUrl} className="h-full w-full object-contain" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Button type="button" variant="destructive" size="sm" onClick={() => removeImage(onChange)} className="gap-2"><IconTrash size={16} /> Remove Image</Button></div></div>)}</div></FormControl><FormErrorSpace><FormMessage /></FormErrorSpace></FormItem>)} /></div>
                <div className="md:col-span-12 h-px bg-border my-2" />

                <div className="md:col-span-6"><FormField control={form.control} name="email" render={({ field, fieldState }) => (<FormItem><FormLabel><LabelReq>Email Address</LabelReq></FormLabel><FormControl><Input placeholder="Enter email address" {...field} className={cn(fieldState.invalid && "border-red-500 focus-visible:ring-red-500")} /></FormControl><FormErrorSpace><FormMessage /></FormErrorSpace></FormItem>)} /></div>

                {/* --- FIXED PHONE INPUT --- */}
                <div className="md:col-span-6">
                  <FormField
                    control={form.control}
                    name="phone_number"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel><LabelReq>Mobile Number</LabelReq></FormLabel>
                        <FormControl>
                          <FixedPhoneInput
                            {...field}
                            value={field.value}
                            onValueChange={field.onChange}
                            error={!!fieldState.invalid}
                          />
                        </FormControl>
                        <FormErrorSpace><FormMessage /></FormErrorSpace>
                      </FormItem>
                    )}
                  />
                </div>

                {/* --- ADDRESS INPUTS --- */}
                <div className="md:col-span-12">
                  <FormLabel><LabelReq>Permanent Address</LabelReq></FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-2">
                    <div className="md:col-span-12"><Input placeholder="Enter street, block, lot, etc." value={addrSelection.street} onChange={(e) => setAddrSelection(prev => ({ ...prev, street: e.target.value }))} className={cn(form.formState.errors.address && "border-red-500 focus-visible:ring-red-500")} /></div>
                    <div className="md:col-span-3"><Select onValueChange={(val) => handleAddressSelect('province', val)} value={addrSelection.provinceCode}><SelectTrigger className={cn("w-full", form.formState.errors.address && "border-red-500 focus:ring-red-500")}><SelectValue placeholder={loadingProvinces ? "Loading..." : "Select province"} /></SelectTrigger><SelectContent>{provinces.map((prov) => (<SelectItem key={prov.code} value={prov.code}>{prov.name}</SelectItem>))}</SelectContent></Select></div>
                    <div className="md:col-span-3"><Select onValueChange={(val) => handleAddressSelect('city', val)} value={addrSelection.cityCode} disabled={!addrSelection.provinceCode}><SelectTrigger className={cn("w-full", form.formState.errors.address && "border-red-500 focus:ring-red-500")}><SelectValue placeholder={loadingCities ? "Loading..." : "Select city/municipality"} /></SelectTrigger><SelectContent>{cities.map((city) => (<SelectItem key={city.code} value={city.code}>{city.name}</SelectItem>))}</SelectContent></Select></div>
                    <div className="md:col-span-4"><Select onValueChange={(val) => handleAddressSelect('barangay', val)} value={addrSelection.barangayCode} disabled={!addrSelection.cityCode}><SelectTrigger className={cn("w-full", form.formState.errors.address && "border-red-500 focus:ring-red-500")}><SelectValue placeholder={loadingBarangays ? "Loading..." : "Select barangay"} /></SelectTrigger><SelectContent>{barangays.map((brgy) => (<SelectItem key={brgy.code} value={brgy.code}>{brgy.name}</SelectItem>))}</SelectContent></Select></div>
                    <div className="md:col-span-2"><Input placeholder="Enter zip code" value={addrSelection.zip} onChange={(e) => setAddrSelection(prev => ({ ...prev, zip: e.target.value }))} className={cn(form.formState.errors.address && "border-red-500 focus-visible:ring-red-500")} /></div>
                  </div>
                  <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormControl><Input type="hidden" {...field} /></FormControl><FormErrorSpace><FormMessage /></FormErrorSpace></FormItem>)} />
                </div>

              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden h-full">
              <div className="bg-blue-50/50 px-6 py-3 border-b flex items-center gap-2"><IconBuildingBank className="text-blue-600" size={18} /><h3 className="font-bold text-sm uppercase tracking-wide text-blue-900">Financial Profile</h3></div>
              <div className="p-6 space-y-4">
                <FormField control={form.control} name="employment_status" render={({ field, fieldState }) => (<FormItem className="w-full"><FormLabel><LabelReq>Employment Status</LabelReq></FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className={cn("w-full", fieldState.invalid && "border-red-500 focus:ring-red-500")}><SelectValue placeholder="Select employment status" /></SelectTrigger></FormControl><SelectContent><SelectItem value="employed">Employed (Private/Gov)</SelectItem><SelectItem value="self-employed">Self-Employed / Business</SelectItem><SelectItem value="ofw">OFW</SelectItem><SelectItem value="retired">Retired / Pensioner</SelectItem></SelectContent></Select><FormErrorSpace><FormMessage /></FormErrorSpace></FormItem>)} />
                <FormField control={form.control} name="monthly_revenue" render={({ field, fieldState }) => (<FormItem><FormLabel><LabelReq>Monthly Gross Income</LabelReq></FormLabel><FormControl><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₱</span><Input type="number" className={cn("pl-7", fieldState.invalid && "border-red-500 focus-visible:ring-red-500")} placeholder="0.00" {...field} /></div></FormControl><FormErrorSpace><FormMessage /></FormErrorSpace></FormItem>)} />
                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-md flex items-start gap-3"><IconFileCertificate className="text-zinc-400 shrink-0" size={20} /><div className="space-y-1"><p className="text-sm font-medium text-zinc-900">Automated Risk Assessment</p><p className="text-xs text-zinc-500 leading-snug">The system will automatically calculate risk and eligibility. Credit Scores are hidden for security.</p></div></div>
              </div>
            </div>

            <div className="bg-card border rounded-xl shadow-sm overflow-hidden h-full">
              <div className="bg-emerald-50/50 px-6 py-3 border-b flex items-center gap-2"><IconCash className="text-emerald-600" size={18} /><h3 className="font-bold text-sm uppercase tracking-wide text-emerald-900">Loan Structure</h3></div>
              <div className="p-6 space-y-2">
                <FormField control={form.control} name="loan_amount" render={({ field: { value, onChange } }) => (<FormItem className="bg-emerald-50/30 p-4 rounded border border-emerald-100 mb-4"><div className="flex justify-between items-center mb-4"><FormLabel className="text-emerald-900 font-semibold">Principal Amount</FormLabel><span className="text-3xl font-bold text-emerald-700">₱{value.toLocaleString()}</span></div><FormControl><Slider min={5000} max={50000} step={500} value={[value]} onValueChange={(vals) => onChange(vals[0])} /></FormControl><FormErrorSpace><FormMessage /></FormErrorSpace></FormItem>)} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="repayment_period" render={({ field, fieldState }) => (<FormItem className="w-full"><FormLabel><LabelReq>Term</LabelReq></FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className={cn("w-full", fieldState.invalid && "border-red-500 focus:ring-red-500")}><SelectValue placeholder="Select loan term" /></SelectTrigger></FormControl><SelectContent><SelectItem value="3">3 Months</SelectItem><SelectItem value="6">6 Months</SelectItem><SelectItem value="12">12 Months</SelectItem><SelectItem value="24">24 Months</SelectItem></SelectContent></Select><FormErrorSpace><FormMessage /></FormErrorSpace></FormItem>)} />
                  <FormField control={form.control} name="payment_schedule" render={({ field, fieldState }) => (<FormItem className="w-full"><FormLabel><LabelReq>Payment Frequency</LabelReq></FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className={cn("w-full", fieldState.invalid && "border-red-500 focus:ring-red-500")}><SelectValue placeholder="Select payment frequency" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Weekly">Weekly</SelectItem><SelectItem value="Bi-Weekly">Bi-Weekly</SelectItem><SelectItem value="Monthly">Monthly</SelectItem></SelectContent></Select><FormErrorSpace><FormMessage /></FormErrorSpace></FormItem>)} />
                </div>
                <FormField control={form.control} name="loan_purpose" render={({ field, fieldState }) => (<FormItem className="w-full"><FormLabel><LabelReq>Loan Purpose</LabelReq></FormLabel><div className="space-y-2"><Select value={purposeCategory} onValueChange={(val) => { setPurposeCategory(val); if (val !== "Other") { field.onChange(val); } else { field.onChange(""); } }}><FormControl><SelectTrigger className={cn("w-full", fieldState.invalid && "border-red-500 focus:ring-red-500")}><SelectValue placeholder="Select loan purpose" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Business Capital">Business Capital</SelectItem><SelectItem value="Emergency">Emergency Funds</SelectItem><SelectItem value="Education">Education</SelectItem><SelectItem value="Medical">Medical Expenses</SelectItem><SelectItem value="Renovation">Home Renovation</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select>{purposeCategory === "Other" && (<Input placeholder="Specify other purpose..." value={field.value} onChange={field.onChange} className={cn(fieldState.invalid && "border-red-500 focus-visible:ring-red-500")} />)}</div><FormErrorSpace><FormMessage /></FormErrorSpace></FormItem>)} />
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="bg-zinc-50 px-6 py-3 border-b flex items-center gap-2"><h3 className="font-bold text-sm text-foreground">Disbursement Method</h3></div>
            <div className="p-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><FormField control={form.control} name="disbursement_method" render={({ field, fieldState }) => (<FormItem className="w-full"><FormLabel><LabelReq>Preferred Method</LabelReq></FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className={cn("w-full", fieldState.invalid && "border-red-500 focus:ring-red-500")}><SelectValue placeholder="Select disbursement method" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Cash Pickup">Cash Pickup (Branch)</SelectItem><SelectItem value="GCash">GCash</SelectItem><SelectItem value="Maya">Maya</SelectItem><SelectItem value="Bank Transfer">Bank Transfer (BDO/BPI)</SelectItem></SelectContent></Select><FormErrorSpace><FormMessage /></FormErrorSpace></FormItem>)} />{disbursementMethod && disbursementMethod !== "Cash Pickup" && (<FormField control={form.control} name="account_number" render={({ field, fieldState }) => (<FormItem><FormLabel><LabelReq>Account / Mobile Number</LabelReq></FormLabel><FormControl><Input placeholder="Enter account or mobile number" {...field} className={cn("font-mono bg-yellow-50/50 border-yellow-200", fieldState.invalid && "border-red-500 focus-visible:ring-red-500")} /></FormControl><FormErrorSpace><FormMessage /></FormErrorSpace></FormItem>)} />)}</div></div>
          </div>

          <div className={cn("bg-card p-6 rounded-xl border border-dashed flex items-start gap-4 transition-colors", form.formState.errors.agree_terms ? "border-red-500 bg-red-50/30" : "")}><FormField control={form.control} name="agree_terms" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 w-full"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className={cn(form.formState.errors.agree_terms && "border-red-500")} /></FormControl><div className="space-y-1 leading-none w-full"><FormLabel className="font-bold text-base flex items-center gap-2">Teller Attestation <span className="text-red-500">*</span></FormLabel><FormDescription>I hereby certify that I have verified the applicant's identity using the Valid ID provided above.</FormDescription><FormErrorSpace><FormMessage /></FormErrorSpace></div></FormItem>)} /></div>

          <div className="flex justify-end gap-4 py-6">
            <Button type="button" variant="ghost" size="lg" onClick={handleReset} disabled={loading}>Clear Form</Button>
            <Button type="submit" size="lg" disabled={loading} className="min-w-[200px] bg-zinc-900 hover:bg-zinc-800">{loading ? <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Processing...</div> : "Check Eligibility"}</Button>
          </div>
        </form>
      </Form>

      {/* --- NEW OFFER DIALOG --- */}
      <LoanOfferDialog
        open={showDisclosure}
        onOpenChange={setShowDisclosure}
        offer={offer}
        loading={loading}
        onAccept={confirmSubmission}
        onDecline={() => setShowDisclosure(false)}
      />

      {/* --- REJECTION DIALOG --- */}
      <Dialog open={showRejection} onOpenChange={setShowRejection}><DialogContent className="sm:max-w-[400px]"><div className="flex flex-col items-center justify-center text-center p-4"><div className="p-3 bg-red-100 rounded-full mb-4"><IconAlertTriangle className="size-10 text-red-600" /></div><h3 className="text-xl font-bold text-red-700 mb-2">Application Rejected</h3><p className="text-sm text-zinc-500 mb-6">{rejectionReason}</p><Button variant="outline" className="w-full border-red-200 text-red-700 hover:bg-red-50" onClick={() => setShowRejection(false)}>Dismiss</Button></div></DialogContent></Dialog>
    </div>
  );
};