/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import { IconArrowLeft } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { Payment } from "./payment";
import PaymentRecord from "./payment-record";
import { useLoanDetails } from "@/hooks/useLoanDetails";
import { fetchPaymentsByLoanId } from "@/lib/payment-records";
import { Progress } from "@/components/ui/progress";

type PaymentProps = {
  payment_id: string;
  amount_paid: number;
  remarks: string;
  transaction_date: string;
};

export const LoanDetails: React.FC<{ loan_id: number }> = ({ loan_id }) => {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = React.useState(0);
  const refreshPaymentRecords = () => setRefreshKey((prev) => prev + 1);
  const [payments, setPayments] = React.useState<PaymentProps[]>([]);
  const [totalPaid, setTotalPaid] = React.useState(0); // ✅ totalPaid state

  React.useEffect(() => {
    fetchPaymentsByLoanId(loan_id)
      .then(({ payments, total_paid }) => {
        setPayments(payments);
        setTotalPaid(total_paid); // ✅ set totalPaid
      })
      .catch((err) => console.error("Error loading payments:", err));
  }, [loan_id, refreshKey]);

  const { data, loading, error, refresh } = useLoanDetails(loan_id); // hook called here

  if (loading) return <p className="px-10 py-6">Loading loan details...</p>;
  if (error) return <p className="px-10 py-6 text-red-500">{error}</p>;
  if (!data) return <p className="px-10 py-6">No loan data found.</p>;

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

  return (
    <div className="flex flex-col gap-6 mb-6 px-10 py-6  md:px-10">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div className="flex items-start gap-4">
          <button onClick={() => navigate(-1)} className="mt-1">
            <IconArrowLeft className="w-5 h-5 text-gray-600 hover:text-black" />
          </button>
          <div>
            <h2 className="text-2xl font-semibold inline-flex items-center gap-1">
              {applicant_name}
              <span className="font-light text-base align-middle">
                ({applicant_id})
              </span>
            </h2>
            <h4 className="font-light">Loan ID: {loan_id}</h4>
          </div>
        </div>

        <div className="md:text-right md:max-w-md w-full">
          <p className="text-xl font-bold">
            ₱{totalPaid.toLocaleString()}
            <span className="text-gray-500 font-normal">
              {" "}
              / ₱{amount.toLocaleString()}
            </span>
            <span className="text-sm text-gray-600 ml-2 font-normal">
              (+{interest_rate}% interest)
            </span>
          </p>
          <div className="mt-3">
            <Progress
              value={loanProgress > 100 ? 100 : loanProgress}
              className="h-2 bg-gray-100 rounded-full"
            />
            <p className="text-sm text-gray-600 font-medium mt-1">
              {loanProgress > 100 ? 100 : Math.floor(loanProgress).toFixed(2)}% paid
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Info label="Total" value={`₱${amount.toLocaleString()}`} />
        <Info label="Amount" value={`₱${principal.toLocaleString()}`} />
        <Info label="Due Amount" value={`₱${due_amount.toLocaleString()}`} />
        <div>
          <p className="text-gray-500">Status</p>
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                status === "Approved"
                  ? "bg-green-500"
                  : status === "Settled"
                    ? "bg-blue-500"
                    : "bg-gray-400"
              }`}
            ></span>
            <p className="font-medium">
              {status === "Approved" ? "Ongoing" : status}
            </p>
          </div>
        </div>

        <Info
          label="Start Date"
          value={new Date(start_date).toLocaleDateString("en-PH", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        />
        <Info
          label="Next Due Date"
          value={new Date(next_due).toLocaleDateString("en-PH", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        />
        <div>
          <p className="text-gray-500">Duration</p>
          <p className="font-medium">
            {`${duration} Months`}
            <span className="text-sm text-gray-600 ml-1">
              ({interest_rate}%)
            </span>
          </p>
        </div>
        <Info label="Payment Schedule" value={payment_schedule} />
        <Info label="Phone Number" value={phone_number} />
        <Info label="Email" value={email} />
        <Info
          label="Employment Status"
          value={
            employment_status?.charAt(0).toUpperCase() +
              employment_status?.slice(1) || "N/A"
          }
        />
        <Info
          label="Credit Score"
          value={
            credit_score?.charAt(0).toUpperCase() + credit_score?.slice(1) ||
            "N/A"
          }
        />
        <Info
          label="Loan Agreement"
          value={
            <a
              href="/sample-agreement.pdf"
              className="text-green-600 underline"
              download
            >
              Download
            </a>
          }
        />
      </div>

      <PaymentRecord payments={payments} />

      <div className="flex justify-between items-center text-xs text-gray-500">
        <p>Created at {date_applied}</p>
        <div className="space-x-2">
          {status.toLowerCase() === "approved" && (
            <Payment
              applicant_id={applicant_id}
              loan_id={loan_id}
              onPaymentComplete={() => {
                refresh();
                refreshPaymentRecords();
              }}
              leftToPaid={amount - totalPaid}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const Info = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p className="text-gray-500">{label}</p>
    <p className="font-medium">{value}</p>
  </div>
);
