/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  IconArrowLeft, IconCalendar, IconCreditCard, IconId, IconEye, IconLock 
} from "@tabler/icons-react";
import { Loader2 } from "lucide-react";

import { Payment } from "@/components/feature/payments/payment-dialog";
import PaymentRecordTable from "@/components/feature/payments/payment-record";
import { Progress } from "@/components/ui/progress";
import { AccessDenied } from "@/components/shared/access-denied";
import { Dialog, DialogContent } from "@/components/ui/dialog"; 
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { useLoanDetails } from "@/hooks/useLoanDetails";
import { useLoanPayments } from "@/hooks/useLoanPayments";

export default function LoanDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const loanId = Number(id);

  const [showIdImage, setShowIdImage] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);

  const { loan: data, loading: detailsLoading, error, refetch: refreshDetails } = useLoanDetails(String(loanId));
  const { payments, totalPaid, loading: paymentsLoading, refreshPayments } = useLoanPayments(loanId);

  useEffect(() => {
    const role = localStorage.getItem("role");
    setUserRole(role);
    if (role === "admin") setIsForbidden(true);
  }, []);

  if (isForbidden || (error && error.includes("403"))) return <AccessDenied />;

  if (detailsLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-50 text-muted-foreground gap-2">
        <Loader2 className="h-6 w-6 animate-spin" /> Loading loan details...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full p-10 text-center bg-gray-50 min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-bold text-gray-800">Loan Not Found</h2>
        <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const {
    applicant_name, email, amount, principal, interest_rate,
    payment_schedule, phone_number, employment_status, credit_score,
    next_due, duration, status, date_applied, start_date, due_amount,
    applicant_id, loan_purpose, disbursement_method, 
    disbursement_account_number, gender, civil_status, monthly_income, 
    address, id_type, id_image_data
  } = data;

  const displayPhone = phone_number || "N/A"; 
  // FIX 1: Ensure remaining balance calculation is robust against floats
  const remainingBalance = Math.max(0, amount - totalPaid);
  const loanProgress = amount > 0 ? (totalPaid / amount) * 100 : 0;

  // FIX 2: Logic to handle the "Dust" (0.01 issue)
  // If remaining balance is tiny (less than regular due), we treat it as "Clearance"
  // This prevents the "June 1" bug by ignoring the calculated next_due if we are just clearing dust.
  const isClearance = remainingBalance > 0 && remainingBalance < (due_amount || 0);

  const displayNextDueDate = () => {
    if (remainingBalance <= 0) return "Paid Off";
    if (isClearance) return "Immediate"; // Don't show a future date for 0.01
    return next_due ? new Date(next_due).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "N/A";
  };

  const getStatusColor = (s: string) => {
    switch (s.toLowerCase()) {
      case "approved": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "settled": return "bg-blue-100 text-blue-700 border-blue-200";
      case "rejected": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const displayCreditScore = userRole === "manager" 
    ? String(credit_score || "N/A") 
    : <span className="flex items-center gap-1.5 text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full w-fit text-xs font-medium"><IconLock size={12} /> Manager Only</span>;

  return (
    <div className="w-full px-6 py-6 space-y-6 bg-gray-50/50 min-h-screen flex flex-col">
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="rounded-full h-9 w-9">
            <IconArrowLeft className="w-5 h-5 text-gray-700" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{applicant_name}</h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-mono text-gray-500 bg-gray-100 rounded border">#{applicant_id}</span>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getStatusColor(status)}`}>
                {status === "Approved" ? "Active" : status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              <span>Loan ID: {loanId}</span><span className="text-gray-300">|</span>
              <span>Applied {new Date(date_applied).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        {status.toLowerCase() === "approved" && (
          <div className="shrink-0">
            <Payment
              applicant_id={applicant_id}
              loan_id={loanId}
              leftToPaid={remainingBalance} // Pass exact remaining
              dueAmount={Number(due_amount)}
              onPaymentComplete={() => {
                refreshDetails();
                refreshPayments();
              }}
            />
          </div>
        )}
      </div>

      <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-3 gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1 text-sm font-medium text-gray-600">
              <IconCreditCard className="w-4 h-4" /> Repayment Progress
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">₱{totalPaid.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              <span className="text-gray-400 font-medium">/ ₱{amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-2xl font-bold text-gray-900">{loanProgress > 100 ? 100 : Math.floor(loanProgress).toFixed(2)}%</span>
            <p className="text-xs text-gray-400">Paid of total balance</p>
          </div>
        </div>
        <Progress value={loanProgress > 100 ? 100 : loanProgress} className="h-4 bg-gray-100 rounded-full" />
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>Principal: ₱{principal?.toLocaleString()}</span>
          <span>Balance Remaining: ₱{remainingBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* FIX 3: Use the smart date display logic */}
        <StatCard label={isClearance ? "Clearance Deadline" : "Next Due Date"} value={displayNextDueDate()} icon={<IconCalendar className="w-4 h-4 text-gray-400" />} />
        {/* FIX 4: If it's just dust (0.01), show that as the due amount, not the full monthly rate */}
        <StatCard label="Due Amount" value={`₱${(isClearance ? remainingBalance : Number(due_amount)).toLocaleString(undefined, {minimumFractionDigits: 2})}`} highlight />
        <StatCard label="Interest Rate" value={`${interest_rate || 0}%`} />
        <StatCard label="Duration" value={`${duration} Months`} subtext={`Start: ${start_date ? new Date(start_date).toLocaleDateString() : "N/A"}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-full flex flex-col">
          <h3 className="text-base font-semibold text-gray-900 mb-6 flex items-center gap-2"><div className="w-1 h-5 bg-blue-500 rounded-full"></div>Loan Particulars</h3>
          <div className="space-y-6 flex-1">
            <DetailItem label="Loan Purpose" value={loan_purpose || "General Purpose"} />
            <DetailItem label="Payment Schedule" value={payment_schedule} />
            <Separator />
            <DetailItem label="Disbursement Method" value={disbursement_method || "Cash Pickup"} />
            {disbursement_account_number && disbursement_account_number !== "N/A" && (<DetailItem label="Account Number" value={disbursement_account_number} />)}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-full flex flex-col">
          <h3 className="text-base font-semibold text-gray-900 mb-6 flex items-center gap-2"><div className="w-1 h-5 bg-orange-500 rounded-full"></div>Borrower Profile</h3>
          <div className="space-y-6 flex-1">
            <div className="grid grid-cols-2 gap-4"><DetailItem label="Civil Status" value={civil_status || "N/A"} /><DetailItem label="Gender" value={gender || "N/A"} /></div>
            <DetailItem label="Address" value={address || "No address on file"} />
            <Separator />
            <DetailItem label="Employment" value={employment_status ? employment_status.charAt(0).toUpperCase() + employment_status.slice(1) : "N/A"} />
            <div className="grid grid-cols-2 gap-4">
                <DetailItem label="Income" value={`₱${(monthly_income || 0).toLocaleString()}`} />
                <DetailItem label="Credit Score" value={displayCreditScore} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-full flex flex-col">
          <h3 className="text-base font-semibold text-gray-900 mb-6 flex items-center gap-2"><div className="w-1 h-5 bg-emerald-500 rounded-full"></div>Verification & Contact</h3>
          <div className="space-y-6 flex-1">
            <DetailItem label="Email Address" value={email} />
            <DetailItem label="Phone Number" value={displayPhone} />
            <Separator />
            <div>
                <span className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide block">Identification Document</span>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2"><IconId className="text-gray-400" size={20} /><span className="text-sm font-semibold text-gray-700">{id_type || "ID"}</span></div>
                    {id_image_data && (<Button variant="ghost" size="sm" className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => setShowIdImage(true)}><IconEye size={16} className="mr-1" /> View</Button>)}
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1">
        <div className="p-6 border-b border-gray-100"><h3 className="text-lg font-semibold text-gray-900">Transaction History</h3></div>
        <div className="w-full">
          {paymentsLoading ? (
             <div className="p-10 text-center text-muted-foreground">Loading history...</div>
          ) : (
             <PaymentRecordTable payments={payments} />
          )}
        </div>
      </div>

      <Dialog open={showIdImage} onOpenChange={setShowIdImage}>
        <DialogContent className="max-w-[80vw] max-h-[80vh] p-0 bg-transparent border-none shadow-none [&>button]:text-white">
            <div className="w-full h-full flex items-center justify-center" onClick={() => setShowIdImage(false)}>
                {id_image_data ? (<img src={id_image_data} alt="ID Proof" className="max-w-full max-h-[80vh] object-contain rounded-md shadow-2xl" />) : (<div className="bg-white p-4 rounded">No Image Available</div>)}
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const StatCard = ({ label, value, icon, highlight = false, subtext }: { label: string; value: string; icon?: React.ReactNode; highlight?: boolean; subtext?: string }) => (
  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center h-full min-w-0">
    <div className="flex items-center gap-2 text-gray-500 mb-2">{icon}<span className="text-xs font-bold uppercase tracking-wider truncate">{label}</span></div>
    <p className={`text-xl md:text-2xl font-bold truncate ${highlight ? "text-blue-600" : "text-gray-900"}`}>{value}</p>
    {subtext && <p className="text-xs text-gray-400 mt-1 truncate">{subtext}</p>}
  </div>
);

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col min-w-0">
    <span className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">{label}</span>
    <span className="text-sm font-medium text-gray-900 break-words leading-relaxed">{value}</span>
  </div>
);