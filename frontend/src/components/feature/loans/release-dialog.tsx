/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { format} from "date-fns";
import { 
  User,
  CreditCard, Building2, Wallet, 
  AlertCircle, Loader2, BadgeCheck, ShieldAlert,
  Maximize2, Banknote, FileText, XCircle, ChevronLeft, ChevronRight, // Added ChevronRight
  EyeOff, Printer, FileSignature, Ban, Send, Mail,
  Check, Clock, Lock
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAlert } from "@/context/alert-context";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Import Hooks & Utils
import { useLoanRelease } from "@/hooks/useLoanRelease";
import { printLoanAgreement } from "@/lib/print-loan-agreement"; 

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
  payment_schedule: string;
  disbursement_method: string;
  disbursement_account_number?: string;
  
  status?: string; 
  remarks?: string;

  onClose: () => void;
}

const REJECTION_REASONS = [
  "Credit Score below threshold",
  "Insufficient Monthly Income",
  "Inconsistent Documents",
  "Unable to verify Employment",
  "Existing Bad Debt Record"
];

export function Release(props: ReleaseProps) {
  const { 
    loan_id, applicant_name, email, amount, duration, date_applied, onClose 
  } = props;

  const [open, setOpen] = useState(true);
  const { triggerAlert } = useAlert();
  
  const { 
    details, 
    loading: isLoadingDetails, 
    processStage, 
    processDisbursement, 
    processRejection,
    processApproval 
  } = useLoanRelease(loan_id);

  const [viewMode, setViewMode] = useState<'review' | 'agreement' | 'reject' | 'view-rejected' | 'teller-release'>('review');
  const [showFullImage, setShowFullImage] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isPrinted, setIsPrinted] = useState(false);
  const [isSignedConfirmed, setIsSignedConfirmed] = useState(false);
  const [isNotified, setIsNotified] = useState(false); 
  
  const role = localStorage.getItem("role");
  const isManager = role === "manager";
  const isTeller = role === "teller"; 
  const managerName = localStorage.getItem("full_name") || "Manager";

  const displayData = { ...props, ...details };
  const hasImage = displayData?.id_image_data && displayData.id_image_data.length > 50;

  // --- EFFECT: Determine Initial View based on Status & Role ---
  useEffect(() => {
    const currentStatus = details?.status || props.status;

    if (currentStatus === "Rejected") {
      setViewMode('view-rejected');
    } else if (currentStatus === "For Release") {
      if (isTeller) {
        setViewMode('teller-release'); 
      } else {
        setViewMode('agreement'); 
      }
    } else {
      setViewMode('review');
    }
  }, [props.status, details, isTeller]);

  const handleDialogChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) onClose();
  };

  // --- ACTIONS ---

  const onNotifyApplicant = () => {
    setTimeout(() => {
      setIsNotified(true);
      triggerAlert({
        title: "Notification Sent",
        description: `Approval notice sent to ${email}`,
        variant: "default" 
      });
    }, 800);
  };

  const onApproveApplication = async () => {
    if (!isManager) return;

    const result = await processApproval(); 

    if (result.success) {
        onNotifyApplicant();
        triggerAlert({
            title: "Application Approved",
            description: "Loan marked as 'For Release'. Proceed to signing when applicant arrives.",
            variant: "default",
        });
        setViewMode('agreement');
    } else {
        triggerAlert({
            title: "Error",
            description: result.message,
            variant: "destructive",
        });
    }
  };

  const onDisburse = async () => {
    if (!isManager || !isSignedConfirmed) return;

    const result = await processDisbursement(props.applicant_id, props.email);

    if (result.success) {
      triggerAlert({
        title: "Disbursement Complete",
        description: `Funds released to ${applicant_name}. Loan is now Active.`,
        variant: "default",
      });
      handleDialogChange(false);
    } else {
      triggerAlert({
        title: "Action Failed",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const onReject = async () => {
    if (!rejectReason) return;
    
    const result = await processRejection(rejectReason);

    if (result.success) {
      triggerAlert({
        title: "Application Rejected",
        description: `Application for ${applicant_name} has been formally rejected.`,
        variant: "default",
      });
      handleDialogChange(false);
    } else {
      triggerAlert({
        title: "Rejection Failed",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    setIsPrinted(true);
    printLoanAgreement({
      loan_id: loan_id,
      applicant_name: applicant_name,
      address: displayData.address || "Davao City", 
      principal: displayData.principal || amount,
      interest_rate: displayData.interest_rate || 0,
      total_repayment: displayData.amount || amount,
      payment_schedule: displayData.payment_schedule || "Monthly",
      duration: duration,
      date_applied: date_applied,
      manager_name: managerName
    });
  };

  const getMethodIcon = (method: string) => {
    if (method?.includes("GCash")) return <Wallet className="text-blue-500" />;
    if (method?.includes("Bank")) return <Building2 className="text-emerald-600" />;
    return <CreditCard className="text-orange-500" />;
  };

  const getRiskBadge = (score: number) => {
    if (!isManager) return null;
    if (score >= 700) return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 gap-1"><BadgeCheck size={12}/> Low Risk</Badge>;
    if (score >= 600) return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100 gap-1"><AlertCircle size={12}/> Medium Risk</Badge>;
    return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 gap-1"><ShieldAlert size={12}/> High Risk</Badge>;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-[800px] p-0 gap-0 overflow-hidden flex flex-col h-[780px] [&>button]:hidden transition-all">
          
          {/* HEADER */}
          <DialogHeader className="px-6 py-5 border-b bg-zinc-50/50 shrink-0">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  {viewMode === 'agreement' ? "Loan Closing" : 
                   viewMode === 'teller-release' ? "Application Approved" :
                   viewMode === 'reject' ? "Decline Application" : 
                   viewMode === 'view-rejected' ? "Application Rejected" : 
                   "Application Details"}
                  {viewMode === 'review' && getRiskBadge(Number(displayData.credit_score || 0))}
                </DialogTitle>
                
                <div className="flex items-center gap-3">
                    <DialogDescription className="flex items-center gap-2 text-xs">
                        Application ID: <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded border text-zinc-700">#{loan_id}</span>
                    </DialogDescription>
                    
                    {!isLoadingDetails && (
                        <>
                            {(displayData.status === 'Pending') && (
                                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 animate-in fade-in">
                                    <span className="relative flex h-2 w-2 mr-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                    </span>
                                    Waiting for Approval
                                </Badge>
                            )}
                            {(displayData.status === 'For Release') && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 animate-in fade-in">
                                    <Clock size={12} className="mr-1" />
                                    Ready for Disbursement
                                </Badge>
                            )}
                        </>
                    )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold tracking-tight text-zinc-900 block">₱{amount.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Principal Amount</span>
              </div>
            </div>
          </DialogHeader>

          {/* MAIN CONTENT */}
          <div className="flex flex-col flex-1 overflow-hidden bg-white">
            
            {isLoadingDetails ? (
               <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="text-sm">Retrieving application data...</span>
               </div>
            ) : viewMode === 'view-rejected' ? (
                <div className="flex-1 overflow-y-auto p-6 bg-red-50/30 space-y-6">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col items-center text-center space-y-2">
                        <div className="p-3 bg-red-100 rounded-full text-red-600 mb-2"><Ban size={32} /></div>
                        <h3 className="text-lg font-bold text-red-900">Application Discarded</h3>
                        <p className="text-sm text-red-700 font-medium">This application was reviewed and rejected by the manager.</p>
                        <Separator className="bg-red-200 my-4" />
                        <div className="w-full text-left bg-white p-4 rounded-lg border border-red-100">
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">Remarks / Reason</span>
                            <p className="text-zinc-800 italic">"{details?.remarks || displayData?.remarks || "No remarks provided."}"</p>
                        </div>
                    </div>
                </div>
            ) : viewMode === 'teller-release' ? (
                // --- TELLER READ-ONLY VIEW ---
                <div className="flex-1 overflow-y-auto p-8 bg-zinc-50/50 flex flex-col items-center justify-center">
                    <div className="max-w-md w-full space-y-6">
                        <div className="bg-white p-6 rounded-xl border shadow-sm text-center space-y-2">
                            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-2">
                                <Banknote size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900">Ready for Disbursement</h3>
                            <p className="text-sm text-zinc-500">This application has been approved by the Manager and is awaiting fund release.</p>
                        </div>
                        <div className="bg-white p-0 rounded-xl border shadow-sm overflow-hidden">
                            <div className="p-4 bg-zinc-50 border-b flex justify-between items-center">
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Amount to Release</span>
                                <Badge className="bg-emerald-600">Approved</Badge>
                            </div>
                            <div className="p-6 text-center">
                                <div className="text-4xl font-extrabold text-emerald-700 tracking-tight">₱{displayData.principal?.toLocaleString()}</div>
                                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-zinc-600 bg-zinc-100 py-2 rounded-lg">{getMethodIcon(displayData.disbursement_method)}<span className="font-semibold">{displayData.disbursement_method || "Cash Pickup"}</span></div>
                                {displayData.disbursement_method !== "Cash Pickup" && (<p className="text-xs text-zinc-400 mt-2 font-mono">Acct: {displayData.disbursement_account_number}</p>)}
                            </div>
                        </div>
                        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 flex items-start gap-3">
                            <Lock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="space-y-1"><p className="text-sm font-bold text-amber-800">Action Restricted</p><p className="text-xs text-amber-700 leading-snug">Disbursement authority is currently restricted to Manager access. Please refer to an authorized officer to proceed.</p></div>
                        </div>
                    </div>
                </div>
            ) : viewMode === 'agreement' ? (
                // --- MANAGER CLOSING VIEW ---
                <div className="flex-1 overflow-y-auto p-8 bg-zinc-50/50">
                    <div className="max-w-xl mx-auto space-y-6">
                        <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
                            <div className="flex items-center gap-3"><div className={cn("p-2 rounded-full transition-colors", isNotified ? "bg-emerald-100 text-emerald-600" : "bg-blue-50 text-blue-600")}><Mail size={20} /></div><div><h4 className="text-sm font-bold text-zinc-900">Notify Applicant</h4><p className="text-xs text-zinc-500">Send approval notice to {email}</p></div></div>
                            <Button size="sm" variant={isNotified ? "outline" : "default"} className={cn(isNotified ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "bg-blue-600 hover:bg-blue-700")} onClick={onNotifyApplicant} disabled={isNotified}><Send size={14} className="mr-2" />{isNotified ? "Sent" : "Send Notice"}</Button>
                        </div>
                        <div className="bg-white p-6 rounded-xl border shadow-sm text-center space-y-4">
                            <div className="p-3 bg-zinc-100 rounded-full w-fit mx-auto text-zinc-600"><FileText size={32} /></div>
                            <div><h3 className="text-lg font-bold text-zinc-900">Generate Loan Documents</h3><p className="text-sm text-zinc-500 max-w-xs mx-auto">Please print the Loan Agreement & Promissory Note for physical signing.</p></div>
                            <Button onClick={handlePrint} variant="outline" className="w-full gap-2 border-zinc-200 hover:bg-zinc-50"><Printer size={16} /> Print Agreement</Button>
                        </div>
                        <div className={cn("p-6 rounded-xl border transition-all duration-300", isPrinted ? "bg-white border-zinc-200 shadow-sm opacity-100" : "bg-gray-50 border-gray-100 opacity-50 grayscale pointer-events-none")}>
                            <div className="flex flex-col gap-4">
                                <div className="space-y-1"><h3 className="font-bold text-zinc-900 flex items-center gap-2"><FileSignature size={18} className="text-emerald-600"/> Signing Verification</h3><p className="text-xs text-zinc-500">Confirm that the physical documents have been signed by the borrower and the manager.</p></div>
                                <div className="flex items-start space-x-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg"><Checkbox id="signed" checked={isSignedConfirmed} onCheckedChange={(checked) => setIsSignedConfirmed(checked as boolean)} className="mt-0.5 border-emerald-500 data-[state=checked]:bg-emerald-600 data-[state=checked]:text-white"/><Label htmlFor="signed" className="text-sm leading-snug cursor-pointer text-zinc-700">I certify that the Loan Agreement has been physically signed by {applicant_name} and verified against their ID.</Label></div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : viewMode === 'reject' ? (
                <div className="flex-1 overflow-y-auto p-8 bg-white">
                    <div className="max-w-md mx-auto flex flex-col gap-6">
                        <div className="text-center space-y-2"><div className="p-4 bg-red-50 rounded-full text-red-600 mb-2 w-fit mx-auto"><XCircle size={32} /></div><h3 className="text-lg font-bold text-zinc-900">Decline Application?</h3><p className="text-sm text-zinc-500">Select a reason for rejection. This will be recorded in the audit logs.</p></div>
                        <div className="grid grid-cols-1 gap-2">{REJECTION_REASONS.map((reason) => (<Button key={reason} variant="outline" className={cn("justify-start h-auto py-3 px-4 text-left font-normal border-zinc-200 hover:border-red-300 hover:bg-red-50 hover:text-red-700", rejectReason === reason && "border-red-500 bg-red-50 text-red-800 ring-1 ring-red-500")} onClick={() => setRejectReason(reason)}>{reason}</Button>))}</div>
                        <div className="space-y-2"><Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Other Reason / Specific Remarks</Label><Textarea placeholder="Type specific details here..." className="min-h-[100px] resize-none" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} /></div>
                    </div>
                </div>
            ) : (
                // REVIEW VIEW
                <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/30 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-7 bg-white rounded-lg border shadow-sm overflow-hidden flex flex-col">
                        <div className="px-4 py-3 border-b bg-emerald-50/50 flex justify-between items-center"><h4 className="text-xs font-bold text-emerald-800 uppercase tracking-widest flex items-center gap-2"><Banknote size={14} /> Approved Loan Terms</h4><Badge variant="outline" className="bg-white text-emerald-700 border-emerald-200 shadow-sm text-[10px]">{displayData.duration} Months</Badge></div>
                        <div className="p-5 flex-1 flex flex-col justify-center">
                          <div className="flex justify-between items-baseline mb-4"><span className="text-xs font-medium text-zinc-500 uppercase">Total Repayment</span><span className="text-2xl font-bold text-zinc-900 tracking-tight">₱{displayData.amount?.toLocaleString()}</span></div>
                          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                            <div><span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-0.5">Principal</span><div className="text-sm font-semibold text-zinc-700">₱{displayData.principal?.toLocaleString()}</div></div>
                            <div><span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-0.5">Interest</span><div className="text-sm font-semibold text-zinc-700">{displayData.interest_rate}%</div></div>
                            <div><span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-0.5">Schedule</span><div className="text-sm font-semibold text-zinc-700">{displayData.payment_schedule}</div></div>
                            <div><span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-0.5">Application Date</span><div className="text-sm font-semibold text-zinc-700">{date_applied ? format(new Date(date_applied), "MMM dd, yyyy h:mm a") : "N/A"}</div></div>
                          </div>
                        </div>
                      </div>
                      <div className="md:col-span-5 bg-white rounded-lg border shadow-sm overflow-hidden flex flex-col">
                        <div className="px-4 py-3 border-b bg-zinc-50/50"><h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Building2 size={14} /> Financial Capacity</h4></div>
                        <div className="p-5 flex-1 flex flex-col justify-center space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-dashed border-zinc-200"><span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Monthly Income</span><span className="text-sm font-bold text-zinc-800">₱{displayData.monthly_income?.toLocaleString()}</span></div>
                            <div className="flex justify-between items-center pb-2 border-b border-dashed border-zinc-200"><span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Employment</span><span className={cn("text-sm font-medium text-zinc-700", displayData.employment_status === 'ofw' ? "uppercase" : "capitalize")}>{displayData.employment_status}</span></div>
                            <div className="flex justify-between items-center"><span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Credit Score</span>{isManager ? (<span className={cn("text-sm font-bold", Number(displayData.credit_score) >= 700 ? "text-emerald-600" : Number(displayData.credit_score) >= 600 ? "text-amber-600" : "text-red-600")}>{displayData.credit_score}</span>) : (<span className="text-[10px] italic text-zinc-400 flex items-center gap-1"><EyeOff size={10} /> Hidden</span>)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                      <div className="px-4 py-3 border-b flex justify-between items-center bg-zinc-50/50"><h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2"><User size={14} /> Applicant Profile</h4><Badge variant="secondary" className="text-[10px] font-normal text-zinc-600 bg-zinc-200/50">{displayData.id_type || "Government ID"}</Badge></div>
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-1/3 bg-zinc-100/50 p-4 border-b md:border-b-0 md:border-r flex flex-col items-center justify-center gap-2 cursor-zoom-in group transition-colors hover:bg-zinc-100" onClick={() => hasImage && setShowFullImage(true)}>
                          <div className="relative w-full aspect-[1.58/1] bg-white rounded border shadow-sm overflow-hidden flex items-center justify-center">
                            {hasImage ? (<><img src={displayData.id_image_data} alt="ID" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all"><Maximize2 className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md" size={24} /></div></>) : (<span className="text-xs text-zinc-400 flex flex-col items-center gap-1"><EyeOff size={20} /> No ID Uploaded</span>)}
                          </div>
                          <span className="text-[10px] text-zinc-400 group-hover:text-zinc-600 transition-colors">Click to enlarge image</span>
                        </div>
                        <div className="md:w-2/3 p-5">
                          <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                            <div className="col-span-2 md:col-span-1"><label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block mb-1">Full Name</label><p className="text-sm font-semibold text-zinc-900">{applicant_name}</p></div>
                            <div className="col-span-2 md:col-span-1"><label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block mb-1">Civil Status & Gender</label><div className="flex items-center gap-2"><Badge variant="outline" className="font-normal text-zinc-600 capitalize rounded-sm px-2">{displayData.civil_status}</Badge><Badge variant="outline" className="font-normal text-zinc-600 capitalize rounded-sm px-2">{displayData.gender}</Badge></div></div>
                            <div className="col-span-2"><label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block mb-1">Permanent Address</label><p className="text-sm text-zinc-700 leading-snug">{displayData.address}</p></div>
                            <div className="col-span-2"><label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block mb-1">Email Address</label><p className="text-sm text-zinc-700 font-medium break-all">{email}</p></div>
                            <div className="col-span-2"><label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block mb-1">Phone Number</label><p className="text-sm text-zinc-700 font-mono">{displayData.phone_num || displayData.phone_number}</p></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3"><div className="p-2 bg-blue-50 text-blue-600 rounded-full"><Wallet size={18} /></div><div><h4 className="text-xs font-bold text-zinc-900 uppercase">Disbursement Method</h4><p className="text-[10px] text-zinc-500">Payout Channel & Details</p></div></div>
                      <div className="flex-1 w-full md:w-auto flex items-center justify-end gap-4">
                        <div className="flex items-center gap-2 border rounded-md px-3 py-1.5 bg-zinc-50">{getMethodIcon(displayData.disbursement_method)}<span className="text-sm font-semibold text-zinc-700">{displayData.disbursement_method || "Cash Pickup"}</span></div>
                        {displayData.disbursement_method !== "Cash Pickup" && (<><div className="h-8 w-px bg-zinc-100 hidden md:block"></div><div className="text-right"><span className="text-[10px] text-zinc-400 font-bold uppercase block">Account No.</span><span className="text-sm font-mono font-medium text-zinc-800">{displayData.disbursement_account_number || "N/A"}</span></div></>)}
                      </div>
                    </div>
                </div>
            )}
          </div>

          {/* FOOTER - WITH NAVIGATION LOGIC */}
          <div className="p-6 border-t bg-zinc-50 shrink-0">
            {viewMode === 'view-rejected' ? (
                <div className="w-full flex justify-end"><Button variant="outline" onClick={() => handleDialogChange(false)}>Close</Button></div>
            ) : viewMode === 'teller-release' ? (
                // TELLER RELEASE FOOTER - WITH BACK NAV
                <div className="w-full flex justify-between items-center">
                    <Button variant="ghost" onClick={() => setViewMode('review')}>
                        <ChevronLeft size={16} className="mr-2" /> View Application
                    </Button>
                    <Button variant="outline" onClick={() => handleDialogChange(false)}>Close</Button>
                </div>
            ) : viewMode === 'agreement' ? (
                // MANAGER CLOSING FOOTER - WITH BACK NAV
                <div className="flex items-center justify-between w-full gap-4">
                    <div className="flex gap-2">
                        <Button variant="ghost" type="button" onClick={() => setViewMode('review')}>
                            <ChevronLeft size={16} className="mr-2" /> Details
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={() => handleDialogChange(false)}>Close</Button>
                        {processStage !== 'idle' ? (
                            <div className="flex items-center gap-2 text-emerald-700 font-medium animate-in fade-in">
                                <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                            </div>
                        ) : (
                            <Button onClick={onDisburse} disabled={!isSignedConfirmed} className={cn("min-w-[150px] ml-2", !isSignedConfirmed ? "bg-zinc-300 text-zinc-500 cursor-not-allowed" : displayData.disbursement_method !== "Cash Pickup" ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white")}>
                                {!isSignedConfirmed ? "Waiting for Sign" : displayData.disbursement_method !== "Cash Pickup" ? "Transfer Funds" : "Release Cash"}
                            </Button>
                        )}
                    </div>
                </div>
            ) : isManager ? (
                // MANAGER REVIEW FOOTER
                viewMode === 'review' ? (
                    <div className="flex justify-between items-center w-full">
                        {displayData.status === 'For Release' ? (
                            // ALREADY APPROVED -> Navigate Forward
                            <>
                                <Button variant="outline" onClick={() => handleDialogChange(false)}>Close</Button>
                                <Button 
                                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                                    onClick={() => setViewMode('agreement')}
                                >
                                    Proceed to Closing <ChevronRight size={16} />
                                </Button>
                            </>
                        ) : (
                            // PENDING -> Approve/Reject
                            <>
                                <div className="flex gap-2"><Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setViewMode('reject')}>Reject</Button><Button variant="ghost" onClick={() => handleDialogChange(false)}>Cancel</Button></div>
                                <Button onClick={onApproveApplication} className="bg-zinc-900 hover:bg-zinc-800 text-white min-w-[180px] gap-2"><Check size={16} /> Approve Application</Button>
                            </>
                        )}
                    </div>
                ) : viewMode === 'reject' ? (
                    <div className="flex justify-between items-center w-full"><Button variant="ghost" onClick={() => setViewMode('review')}><ChevronLeft size={16} className="mr-1"/> Back</Button><Button variant="destructive" onClick={onReject} disabled={!rejectReason}>Confirm Rejection</Button></div>
                ) : null
            ) : (
                // TELLER PENDING FOOTER
                <div className="w-full flex justify-between items-center">
                    {displayData.status === 'For Release' ? (
                        // TELLER - READY FOR RELEASE NAV
                        <>
                            <Button variant="outline" onClick={() => handleDialogChange(false)}>Close</Button>
                            <Button 
                                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                                onClick={() => setViewMode('teller-release')}
                            >
                                Back to Disbursement <ChevronRight size={16} />
                            </Button>
                        </>
                    ) : (
                        // TELLER - PENDING
                        <>
                            <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-2 rounded-md text-sm font-medium border border-amber-100"><AlertCircle size={16} /><span>Awaiting Manager Decision</span></div>
                            <Button variant="outline" onClick={() => handleDialogChange(false)}>Close</Button>
                        </>
                    )}
                </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showFullImage} onOpenChange={setShowFullImage}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-transparent border-none shadow-none [&>button]:text-white"><div className="w-full h-full flex items-center justify-center" onClick={() => setShowFullImage(false)}>{hasImage && <img src={displayData.id_image_data} alt="ID Full View" className="max-w-full max-h-[85vh] object-contain rounded-md shadow-2xl animate-in zoom-in-95 duration-200" />}</div></DialogContent>
      </Dialog>
    </>
  );
}