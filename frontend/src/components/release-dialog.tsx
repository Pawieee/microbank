/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { 
  User, Mail, Calendar as CalendarIcon, 
  CreditCard, Building2, Wallet, CheckCircle2, 
  AlertCircle, Loader2, ArrowRightLeft, 
  MapPin, Phone, FileText, BadgeCheck, ShieldAlert,
  Maximize2
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAlert } from "@/context/AlertContext";
import { IconId } from "@tabler/icons-react";

interface ReleaseProps {
  loan_id: string;
  applicant_id: number;
  applicant_name: string;
  email: string;
  amount: number;
  duration: number;
  date_applied: string;
  monthly_income: number;
  credit_score: number | string;
  employment_status: string;
  loan_purpose: string;
  payment_schedule: string;
  gender: string;
  civil_status: string;
  phone_num: string; 
  phone_number: string;
  address: string;
  id_type: string;
  id_image_data: string;
  disbursement_method: string;
  disbursement_account_number?: string;
  
  onClose: () => void;
}

export function Release(props: ReleaseProps) {
  const { 
    loan_id, applicant_id, applicant_name, email, amount, duration, onClose 
  } = props;

  const [open, setOpen] = useState(true);
  const { triggerAlert } = useAlert();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Image Preview State
  const [showFullImage, setShowFullImage] = useState(false);

  // Use props as initial data
  const [loanDetails] = useState<any>(props); 
  const [processStage, setProcessStage] = useState<'idle' | 'connecting' | 'transferring' | 'finalizing'>('idle');

  const form = useForm({
    defaultValues: {
      releaseDate: new Date(),
    },
  });

  const role = localStorage.getItem("role");
  const isManager = role === "manager";

  const handleDialogChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) onClose();
  };

  // MOCK DISBURSEMENT LOGIC
  const runMockDisbursement = async () => {
    return new Promise<void>((resolve) => {
      setProcessStage('connecting');
      setTimeout(() => {
        setProcessStage('transferring');
        setTimeout(() => {
          setProcessStage('finalizing');
          setTimeout(() => {
            resolve();
          }, 1000);
        }, 2000);
      }, 1500);
    });
  };

  const onSubmit = async (data: { releaseDate: Date }) => {
    if (!isManager) return;

    const method = loanDetails?.disbursement_method || "Cash Pickup";
    const isDigital = method !== "Cash Pickup";

    try {
      if (isDigital) {
        await runMockDisbursement();
      }

      const payload = {
        applicant_id,
        loan_id,
        email,
        release_date: format(data.releaseDate, "yyyy-MM-dd"),
      };

      const response = await fetch("/api/loans/disburse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.message);

      triggerAlert({
        title: isDigital ? "Transfer Successful" : "Disbursement Recorded",
        description: `Funds released to ${applicant_name} via ${method}.`,
        variant: "success",
      });

      handleDialogChange(false);
    } catch (error: any) {
      setProcessStage('idle');
      triggerAlert({
        title: "Action Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getMethodIcon = (method: string) => {
    if (method?.includes("GCash")) return <Wallet className="text-blue-500" />;
    if (method?.includes("Bank")) return <Building2 className="text-emerald-600" />;
    return <CreditCard className="text-orange-500" />;
  };

  const getRiskBadge = (score: number) => {
    if (score >= 700) return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 gap-1"><BadgeCheck size={12}/> Low Risk</Badge>;
    if (score >= 600) return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100 gap-1"><AlertCircle size={12}/> Medium Risk</Badge>;
    return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 gap-1"><ShieldAlert size={12}/> High Risk</Badge>;
  };

  const hasImage = loanDetails?.id_image_data && loanDetails.id_image_data.length > 50;

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-[750px] p-0 gap-0 overflow-hidden flex flex-col h-[600px] [&>button]:hidden">
          
          {/* HEADER */}
          <DialogHeader className="px-6 py-5 border-b bg-zinc-50/50 shrink-0">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  Loan Review Console
                  {getRiskBadge(Number(loanDetails.credit_score || 0))}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 text-xs">
                  Application ID: <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded border text-zinc-700">#{loan_id}</span>
                </DialogDescription>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold tracking-tight text-zinc-900 block">₱{amount.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Principal Amount</span>
              </div>
            </div>
          </DialogHeader>

          {/* CONTENT AREA */}
          <div className="flex flex-col flex-1 overflow-hidden">
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 border-b shrink-0">
                <TabsList className="bg-transparent p-0 h-10 w-full justify-start gap-6">
                  <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:shadow-none rounded-none px-0 h-full bg-transparent">Overview</TabsTrigger>
                  <TabsTrigger value="kyc" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:shadow-none rounded-none px-0 h-full bg-transparent">Identity & KYC</TabsTrigger>
                  <TabsTrigger value="disbursement" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:shadow-none rounded-none px-0 h-full bg-transparent">Disbursement</TabsTrigger>
                </TabsList>
              </div>

              {/* SCROLLABLE CONTENT */}
              <div className="flex-1 overflow-y-auto p-6 bg-white">
                
                {/* TAB 1: OVERVIEW */}
                <TabsContent value="overview" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="grid grid-cols-2 gap-8">
                    {/* Financials */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                          <Building2 size={14} /> Financial Profile
                        </h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm text-zinc-500">Monthly Income</span>
                                <span className="font-semibold text-zinc-900">₱{loanDetails?.monthly_income?.toLocaleString() || "0"}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm text-zinc-500">Employment Status</span>
                                <span className="font-medium capitalize text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded text-xs">{loanDetails?.employment_status || "N/A"}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm text-zinc-500">Credit Score</span>
                                <span className="font-bold text-zinc-900">{loanDetails?.credit_score || "N/A"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Loan Config */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                          <FileText size={14} /> Loan Config
                        </h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm text-zinc-500">Purpose</span>
                                <span className="font-medium text-zinc-900">{loanDetails?.loan_purpose || "General"}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm text-zinc-500">Term Duration</span>
                                <span className="font-medium text-zinc-900">{duration} Months</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm text-zinc-500">Payment Schedule</span>
                                <span className="font-medium text-zinc-900">{loanDetails?.payment_schedule || "Monthly"}</span>
                            </div>
                        </div>
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 2: KYC */}
                <TabsContent value="kyc" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Contact Information</h4>
                            
                            <div className="flex items-start gap-3">
                                <User className="w-4 h-4 text-zinc-400 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold text-zinc-900">{applicant_name}</p>
                                  <p className="text-xs text-zinc-500 capitalize">{loanDetails?.civil_status || "N/A"} • {loanDetails?.gender || "N/A"}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-zinc-400" />
                                <p className="text-sm text-zinc-700">{email}</p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-zinc-400" />
                                <p className="text-sm text-zinc-700">{loanDetails?.phone_num || loanDetails?.phone_number || "N/A"}</p>
                            </div>
                            
                            <div className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-zinc-400 mt-0.5" />
                                <p className="text-sm text-zinc-700 leading-snug">{loanDetails?.address || "No address on file"}</p>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                                <span>Proof of Identity</span>
                                <Badge variant="outline" className="text-xs font-normal">{loanDetails?.id_type || "ID"}</Badge>
                            </h4>
                            
                            {/* ID IMAGE VIEWER (CLICKABLE) */}
                            <div 
                              className={cn(
                                "aspect-video bg-zinc-50 rounded-lg border border-dashed border-zinc-200 flex flex-col items-center justify-center text-zinc-400 gap-2 overflow-hidden relative group",
                                hasImage && "cursor-zoom-in hover:border-emerald-400 transition-colors"
                              )}
                              onClick={() => hasImage && setShowFullImage(true)}
                            >
                                {hasImage ? (
                                   <>
                                     <img 
                                       src={loanDetails.id_image_data} 
                                       alt="Proof of ID" 
                                       className="w-full h-full object-contain" 
                                     />
                                     <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                        <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                                     </div>
                                   </>
                                ) : (
                                   <div className="flex flex-col items-center gap-2">
                                       <div className="p-3 bg-zinc-100 rounded-full">
                                          <IconId size={24} className="text-zinc-300" />
                                       </div>
                                       <span className="text-xs font-medium">No Image Available</span>
                                   </div>
                                )}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* TAB 3: DISBURSEMENT */}
                <TabsContent value="disbursement" className="mt-0 h-full flex flex-col items-center justify-center py-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="w-full max-w-sm border bg-card rounded-xl p-6 shadow-sm text-center">
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Selected Method</p>
                        
                        <div className="flex items-center justify-center gap-3 text-2xl font-bold text-zinc-800 mb-6">
                            {getMethodIcon(loanDetails?.disbursement_method)}
                            {loanDetails?.disbursement_method || "Cash Pickup"}
                        </div>
                        
                        {loanDetails?.disbursement_method !== "Cash Pickup" ? (
                            <div className="bg-zinc-50 border rounded-lg p-4 mb-4">
                                <p className="text-xs text-zinc-500 uppercase mb-1">Account Number</p>
                                <p className="font-mono text-xl font-bold tracking-wider text-zinc-900">
                                    {loanDetails?.disbursement_account_number || "N/A"}
                                </p>
                            </div>
                        ) : (
                            <div className="bg-amber-50 text-amber-800 border border-amber-200 rounded-lg p-4 mb-4 text-sm">
                                Client will pick up cash at the branch counter.
                            </div>
                        )}

                        <div className="flex items-center justify-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 py-2 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Details Verified
                        </div>
                    </div>
                </TabsContent>
              </div>
            </Tabs>

            {/* FOOTER - FIXED AT BOTTOM */}
            <div className="p-6 border-t bg-zinc-50 shrink-0">
              {processStage !== 'idle' ? (
                  // MOCK PROGRESS BAR
                  <div className="w-full flex flex-col items-center justify-center gap-3 py-2 animate-in fade-in">
                      <div className="flex items-center gap-3 text-emerald-700">
                          {processStage === 'connecting' && (
                              <>
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                  <span className="font-medium">Connecting to banking gateway...</span>
                              </>
                          )}
                          {processStage === 'transferring' && (
                              <>
                                  <ArrowRightLeft className="w-5 h-5 animate-pulse" />
                                  <span className="font-medium">Transferring funds...</span>
                              </>
                          )}
                          {processStage === 'finalizing' && (
                              <>
                                  <CheckCircle2 className="w-5 h-5" />
                                  <span className="font-medium">Transaction Complete. Finalizing...</span>
                              </>
                          )}
                      </div>
                      <div className="h-1.5 w-64 bg-zinc-200 rounded-full overflow-hidden">
                          <div 
                              className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                              style={{ width: processStage === 'connecting' ? '30%' : processStage === 'transferring' ? '70%' : '100%' }}
                          />
                      </div>
                  </div>
              ) : isManager ? (
                  // MANAGER CONTROLS
                  <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center justify-between w-full gap-4">
                          <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-zinc-700">Effective Date:</span>
                              <FormField
                                  control={form.control}
                                  name="releaseDate"
                                  rules={{ required: true }}
                                  render={({ field }) => (
                                  <FormItem className="m-0">
                                      <Popover>
                                      <FormControl>
                                          <PopoverTrigger asChild>
                                          {/* UPDATED: Date Picker Button UI */}
                                          <Button
                                              variant={"outline"}
                                              size="sm"
                                              className={cn(
                                              "w-[240px] pl-3 text-left font-normal bg-white h-9 flex justify-between items-center",
                                              !field.value && "text-muted-foreground"
                                              )}
                                          >
                                              {field.value ? format(field.value, "PPP") : <span>Pick release date</span>}
                                              <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                                          </Button>
                                          </PopoverTrigger>
                                      </FormControl>
                                      <PopoverContent className="w-auto p-0" align="start">
                                          <Calendar
                                          mode="single"
                                          selected={field.value}
                                          onSelect={field.onChange}
                                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                          initialFocus
                                          />
                                      </PopoverContent>
                                      </Popover>
                                      <FormMessage className="absolute" />
                                  </FormItem>
                                  )}
                              />
                          </div>
                          
                          <div className="flex gap-2">
                              <Button variant="ghost" type="button" onClick={() => handleDialogChange(false)}>Cancel</Button>
                              <Button 
                                  type="submit" 
                                  className={cn(
                                      "min-w-[150px] shadow-sm text-white",
                                      loanDetails?.disbursement_method !== "Cash Pickup" 
                                          ? "bg-blue-600 hover:bg-blue-700" 
                                          : "bg-emerald-600 hover:bg-emerald-700"
                                  )}
                              >
                                  {loanDetails?.disbursement_method !== "Cash Pickup" 
                                      ? "Transfer Funds" 
                                      : "Confirm Release"}
                              </Button>
                          </div>
                      </form>
                  </Form>
              ) : (
                  // READ ONLY VIEW
                  <div className="w-full flex justify-between items-center">
                      <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-2 rounded-md text-sm font-medium border border-amber-100">
                          <AlertCircle size={16} />
                          <span>Waiting for Manager Approval</span>
                      </div>
                      <Button variant="outline" onClick={() => handleDialogChange(false)}>Close</Button>
                  </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* FULL IMAGE PREVIEW MODAL */}
      <Dialog open={showFullImage} onOpenChange={setShowFullImage}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-transparent border-none shadow-none [&>button]:text-white [&>button]:bg-black/20 [&>button]:hover:bg-black/40 [&>button]:rounded-full [&>button]:p-2">
          <div 
            className="w-full h-full flex items-center justify-center"
            onClick={() => setShowFullImage(false)}
          >
            {hasImage && (
              <img 
                src={loanDetails.id_image_data} 
                alt="ID Full View" 
                className="max-w-full max-h-[85vh] object-contain rounded-md shadow-2xl animate-in zoom-in-95 duration-200"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}