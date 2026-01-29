import React, { useEffect, useState } from "react";
import { IconArrowLeft, IconFileText, IconCalendar, IconCreditCard } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { Payment } from "./payment";
import PaymentRecord from "./payment-record";
import { useLoanDetails } from "@/hooks/useLoanDetails";
import { fetchPaymentsByLoanId } from "@/lib/payment-records";
import { Progress } from "@/components/ui/progress";
import { AccessDenied } from "@/components/access-denied";

type PaymentProps = {
  payment_id: string;
  amount_paid: number;
  remarks: string;
  transaction_date: string;
};

export const LoanDetails: React.FC<{ loan_id: number }> = ({ loan_id }) => {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const refreshPaymentRecords = () => setRefreshKey((prev) => prev + 1);
  const [payments, setPayments] = useState<PaymentProps[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);

  // 1. STATE FOR ACCESS CONTROL
  const [isForbidden, setIsForbidden] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  // 2. CHECK ROLE IMMEDIATELY (Client Side)
  useEffect(() => {
    const role = localStorage.getItem("role");

    // Explicitly block Admin
    if (role === "admin") {
      setIsForbidden(true);
    }

    setIsCheckingRole(false);
  }, []);

  // 3. FETCH DATA (Backend Side)
  // We allow the hook to run even if checking role, 
  // because the backend might return 403 before our useEffect finishes.
  const { data, loading, error, refresh } = useLoanDetails(loan_id);

  useEffect(() => {
    // Only fetch payments if we are NOT forbidden
    // We check !error here to avoid making requests if the main loan fetch failed
    if (!isCheckingRole && !isForbidden && !error) {
      fetchPaymentsByLoanId(loan_id)
        .then(({ payments, total_paid }) => {
          setPayments(payments);
          setTotalPaid(total_paid);
        })
        .catch((err) => console.error("Error loading payments:", err));
    }
  }, [loan_id, refreshKey, isForbidden, isCheckingRole, error]);

  // --- RENDER LOGIC ---

  // A. Priority 1: Access Denied
  // Logic: 
  // 1. Client side says forbidden (Admin)
  // 2. OR Backend returns "403" error
  if (isForbidden || (error && error.includes("403"))) {
    return (
      <AccessDenied />
    );
  }

  // B. Priority 2: Loading
  if (loading || isCheckingRole) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-50">
        <p className="text-gray-500 animate-pulse">Loading loan details...</p>
      </div>
    );
  }

  // C. Priority 3: Genuine 404 or other errors
  if (error) {
    return (
      <div className="w-full p-10 text-center bg-gray-50 min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-bold text-gray-800">Loan Not Found</h2>
        <p className="text-gray-500">The loan ID #{loan_id} does not exist or has been deleted.</p>
        <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">Go Back</button>
      </div>
    );
  }

  // D. Priority 4: No Data (Safety Fallback)
  if (!data) return null;

  // --- DATA DESTRUCTURING ---
  const {
    applicant_name,
    email,
    amount,
    principal,
    interest_rate,
    payment_schedule,
    phone_number,
    employment_status,
    credit_score,
    next_due,
    duration,
    status,
    date_applied,
    start_date,
    due_amount,
    applicant_id,
  } = data;

  const loanProgress = (totalPaid / amount) * 100;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "settled":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="w-full px-6 py-6 space-y-6 bg-gray-50/50 min-h-screen flex flex-col">
      {/* ... (Rest of your UI remains exactly the same) ... */}

      {/* HEADER */}
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-200"
          >
            <IconArrowLeft className="w-5 h-5 text-gray-700" />
          </button>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {applicant_name}
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-mono text-gray-500 bg-gray-100 rounded border">
                #{applicant_id}
              </span>
              <span
                className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getStatusColor(
                  status
                )}`}
              >
                {status === "Approved" ? "Active" : status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              <span>Loan ID: {loan_id}</span>
              <span className="text-gray-300">|</span>
              <span>Applied {new Date(date_applied).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        {/* Action Button */}
        {status.toLowerCase() === "approved" && (
          <div className="shrink-0">
            <Payment
              applicant_id={applicant_id}
              loan_id={loan_id}
              onPaymentComplete={() => {
                refresh();
                refreshPaymentRecords();
              }}
              leftToPaid={amount - totalPaid}
            />
          </div>
        )}
      </div>

      {/* PROGRESS */}
      <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-3 gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <IconCreditCard className="w-4 h-4 text-gray-400" />
              <p className="text-sm font-medium text-gray-600">Repayment Progress</p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">
                ₱{totalPaid.toLocaleString()}
              </span>
              <span className="text-gray-400 font-medium">
                / ₱{amount.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-2xl font-bold text-gray-900">
              {loanProgress > 100 ? 100 : Math.floor(loanProgress).toFixed(2)}%
            </span>
            <p className="text-xs text-gray-400">Paid of total balance</p>
          </div>
        </div>
        <Progress
          value={loanProgress > 100 ? 100 : loanProgress}
          className="h-4 bg-gray-100 rounded-full"
        />
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>Interest Rate: {interest_rate}%</span>
          <span>Balance Remaining: ₱{(amount - totalPaid).toLocaleString()}</span>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <StatCard
          label="Next Due Date"
          value={new Date(next_due).toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
          icon={<IconCalendar className="w-4 h-4 text-gray-400" />}
        />
        <StatCard
          label="Due Amount"
          value={`₱${due_amount.toLocaleString()}`}
          highlight
        />
        <StatCard label="Principal" value={`₱${principal.toLocaleString()}`} />
        <StatCard
          label="Duration"
          value={`${duration} Months`}
          subtext={`Ends: ${new Date(
            new Date(start_date).setMonth(
              new Date(start_date).getMonth() + duration
            )
          ).toLocaleDateString("en-PH", { month: "short", year: "numeric" })}`}
        />
      </div>

      {/* DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Loan Terms */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-full">
          <h3 className="text-base font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
            Loan Particulars
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-6">
            <DetailItem
              label="Start Date"
              value={new Date(start_date).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
            <DetailItem label="Payment Schedule" value={payment_schedule} />
            <DetailItem
              label="Loan Agreement"
              value={
                <a
                  href="/sample-agreement.pdf"
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                  download
                >
                  <IconFileText className="w-4 h-4" /> Download
                </a>
              }
            />
            <DetailItem
              label="Application Date"
              value={new Date(date_applied).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
            <DetailItem label="Interest Rate" value={`${interest_rate}%`} />
            <DetailItem label="Total Duration" value={`${duration} months`} />
          </div>
        </div>

        {/* Applicant Info */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-full">
          <h3 className="text-base font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
            Borrower Profile
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
            <DetailItem label="Email Address" value={email} />
            <DetailItem label="Phone Number" value={phone_number} />
            <DetailItem
              label="Employment"
              value={
                employment_status
                  ? employment_status.charAt(0).toUpperCase() +
                  employment_status.slice(1)
                  : "N/A"
              }
            />
            <DetailItem
              label="Credit Score"
              value={
                credit_score
                  ? credit_score.charAt(0).toUpperCase() + credit_score.slice(1)
                  : "N/A"
              }
            />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
        </div>
        <div className="w-full">
          <PaymentRecord payments={payments} />
        </div>
      </div>
    </div>
  );
};

// --- Sub-Components ---
const StatCard = ({
  label,
  value,
  icon,
  highlight = false,
  subtext,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  highlight?: boolean;
  subtext?: string;
}) => (
  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center h-full min-w-0">
    <div className="flex items-center gap-2 text-gray-500 mb-2">
      {icon}
      <span className="text-xs font-bold uppercase tracking-wider truncate">
        {label}
      </span>
    </div>
    <p
      className={`text-xl md:text-2xl font-bold truncate ${highlight ? "text-blue-600" : "text-gray-900"
        }`}
    >
      {value}
    </p>
    {subtext && <p className="text-xs text-gray-400 mt-1 truncate">{subtext}</p>}
  </div>
);

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex flex-col min-w-0">
    <span className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">{label}</span>
    <span className="text-sm font-medium text-gray-900 break-words">{value}</span>
  </div>
);