import React from "react";
import { IconTrashFilled, IconArrowLeft } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { Payment } from "./payment";

interface LoanDetailsProps {
  id: string;
  applicantName: string;
  startDate: string;
  duration: string;
  amount: number;
  status: string;
  email: string;
  term: string;
  dateApplied: string;
}

export const LoanDetailsView: React.FC<LoanDetailsProps> = (props) => {
  const navigate = useNavigate();
  const { id, applicantName, email, amount, term, status, dateApplied, startDate } = props;

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
          <Info label="Duration" value={`${term} months`} />
          <Info label="End Date" value="2025-10-01" />
          <Info label="Status" value={status} />
          <Info label="Terms" value="Monthly" />
          <Info label="Amount" value={`₱${amount.toLocaleString()}`} />
          <Info label="Return" value="5%" />
          <Info label="Management Fee" value="₱500" />
          <Info label="Total" value={`₱${(amount * 1.05).toLocaleString()}`} />
          <Info
            label="Per month"
            value={`₱${((amount * 1.05) / Number(term)).toFixed(2)}`}
          />
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

        <div className="overflow-x-auto mb-10">
          <h4 className="font-semibold mb-2">Issued Cheques</h4>
          <table className="min-w-full border border-gray-200 text-left text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="p-2 border">R-ID</th>
                <th className="p-2 border">Cheque #</th>
                <th className="p-2 border">Cheque Date</th>
                <th className="p-2 border">Cashed Date</th>
                <th className="p-2 border">Type</th>
                <th className="p-2 border">PDF</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="p-2">001</td>
                <td className="p-2">CHQ123456</td>
                <td className="p-2">2025-04-10</td>
                <td className="p-2">2025-04-15</td>
                <td className="p-2">Loan</td>
                <td className="p-2 text-blue-600 underline cursor-pointer">
                  View
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
          <p>Created at {dateApplied}</p>
          
          <div className="space-x-2">
            <Payment />
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
