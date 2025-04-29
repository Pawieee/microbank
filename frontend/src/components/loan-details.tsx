import React from "react";
import { IconTrashFilled, IconArrowLeft } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { Payment } from "./payment";
import { Release } from "./release-dialog";
import PaymentRecord from "./payment-record";

interface LoanDetailsProps {
  id: number;
  applicantName: string;
  applicant_id: number;
  startDate: string;
  duration: number;
  amount: number;
  status: string;
  email: string;
  dateApplied: string;
  dueAmount: string;
}

export const LoanDetails: React.FC<LoanDetailsProps> = (props) => {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = React.useState(0);
  const refreshPaymentRecords = () => setRefreshKey((prev) => prev + 1);

  const {
    id,
    applicantName,
    email,
    amount,
    duration,
    status,
    dateApplied,
    startDate,
    dueAmount,
  } = props;

  return (
    <div className="w-full max-w-full px-10 py-6 text-sm">
      {/* Top Buttons */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate(-1)}>
          <IconArrowLeft className="w-5 h-5 text-gray-600 hover:text-black" />
        </button>
        <div className="text-left pl-5 flex-1">
          <h2 className="text-2xl font-semibold">{id} Monthly</h2>
        </div>
        <div className="space-x-2">
          <IconTrashFilled className="w-5 h-5 text-red-500" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <Info label="Member" value={applicantName} />
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
          <Info label="Start Date" value={startDate} />
          <Info label="Duration" value={`${duration} Months`} />
          <Info label="End Date" value="2025-10-01" />
          <Info label="Status" value={status} />
          <Info label="Terms" value="Monthly" />
          <Info label="Amount" value={`₱${amount.toLocaleString()}`} />
          <Info label="Return" value="5%" />
          <Info label="Management Fee" value="₱500" />
          <Info label="Total" value={`₱${amount.toLocaleString()}`} />
          <Info label="Per month" value={`₱${dueAmount.toLocaleString()}`} />
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
            <h4 className="font-semibold mb-1">{email}</h4>
            <p>123 Kanto Kutas, Matina, Davao City</p>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold">Accounting Info</h4>
          <p>GCash: 09123456789, BDO: 1234-5678-90</p>
        </div>

        <PaymentRecord loanId={id} refreshKey={refreshKey} />

        <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
          <p>Created at {dateApplied}</p>

          <div className="space-x-2">
            {status.toLowerCase() === "pending" && (
              <Release applicantId={id} loanId={id} />
            )}
            {status.toLowerCase() === "approved" && (
              <Payment
                applicantId={id}
                loanId={id}
                onPaymentComplete={refreshPaymentRecords}
              />
            )}
          </div>
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
