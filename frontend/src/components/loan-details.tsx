/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import { IconTrashFilled, IconArrowLeft } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { Payment } from "./payment";
import { Release } from "./release-dialog";
import PaymentRecord from "./payment-record";
import { useLoanDetails } from "@/hooks/useLoanDetails";

export const LoanDetails: React.FC<{ loan_id: number }> = ({ loan_id }) => {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = React.useState(0);
  const refreshPaymentRecords = () => setRefreshKey((prev) => prev + 1);

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
    duration,
    status,
    date_applied,
    start_date,
    due_amount,
    applicant_id,
  } = data;

  return (
    <div className="w-full max-w-full px-10 py-6 text-sm">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate(-1)}>
          <IconArrowLeft className="w-5 h-5 text-gray-600 hover:text-black" />
        </button>
        <div className="pl-5 flex-1 flex items-center text-left">
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

        <div className="space-x-2">
          <IconTrashFilled className="w-5 h-5 text-red-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        <div>
          <p className="text-gray-500">Total</p>
          <p className="font-medium">
            {`₱${amount.toLocaleString()}`}
            <span className="text-sm text-gray-400 ml-1">
              ({interest_rate}%)
            </span>
          </p>
        </div>
        <Info label="Amount" value={`₱${principal.toLocaleString()}`} />
        <Info label="Group Leader" value="John Doe" />
        <Info label="Action" value="Auto Pay" />
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
        <Info label="Start Date" value={start_date} />
        <Info label="Duration" value={`${duration} Months`} />
        <Info label="End Date" value="2025-10-01" />
        <Info label="Status" value={status} />
        <Info label="Payment Schedule" value={payment_schedule} />
        <Info label="Loan Amount" value={`₱${amount.toLocaleString()}`} />
        <Info label="Return" value="5%" />
        <Info label="Management Fee" value="₱500" />
        <Info label="Total Amount" value={`₱${amount.toLocaleString()}`} />
        <Info label="Due Amount" value={`₱${due_amount.toLocaleString()}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="font-semibold mb-1">Notes</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>Verified income</li>
            <li>Repayment starts next month</li>
          </ul>
        </div>
        <div>
          <p>Email</p>
          <h4 className="font-semibold mb-1">{email}</h4>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold">Accounting Info</h4>
        <p>GCash: 09123456789, BDO: 1234-5678-90</p>
      </div>

      <PaymentRecord loan_id={loan_id} refreshKey={refreshKey} />

      <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
        <p>Created at {date_applied}</p>

        <div className="space-x-2">
          {status.toLowerCase() === "pending" && (
            <Release
              applicant_id={applicant_id}
              loan_id={loan_id.toString()}
              applicant_name={""}
              email={""}
              amount={0}
              duration={0}
              date_applied={""}
              onClose={() => {}}
            />
          )}
          {status.toLowerCase() === "approved" && (
            <Payment
              applicant_id={applicant_id}
              loan_id={loan_id}
              onPaymentComplete={() => {
                refresh(); // Now this refresh function will work as intended
                refreshPaymentRecords(); // Refresh payment records
              }}
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
