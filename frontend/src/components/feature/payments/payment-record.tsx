import React from "react";

type PaymentProps = {
  payment_id: string;
  amount_paid: number;
  remarks: string;
  transaction_date: string;
};

interface PaymentRecordProps {
  payments: PaymentProps[];
}

const PaymentRecord: React.FC<PaymentRecordProps> = ({ payments }) => {
  // 1. Empty State - Centered and Clean
  if (!payments || payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4">
        <div className="text-gray-400 mb-2">
          {/* Simple icon representation */}
          <svg
            className="w-10 h-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <p className="text-gray-500 font-medium">No payment records found</p>
        <p className="text-gray-400 text-sm">
          Once a payment is settled, it will appear here.
        </p>
      </div>
    );
  }

  // 2. Data Table - Full Width & Airy
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50/50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
              Date
            </th>
            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
              Payment ID
            </th>
            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-full">
              Remarks
            </th>
            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right whitespace-nowrap">
              Amount Paid
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {payments.map((payment) => (
            <tr key={payment.payment_id} className="hover:bg-gray-50/80 transition-colors">
              {/* Date */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {new Date(payment.transaction_date).toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
                <span className="text-gray-400 text-xs ml-2 hidden sm:inline">
                  {new Date(payment.transaction_date).toLocaleTimeString("en-PH", {
                     hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </td>
              
              {/* ID - Monospace for readability */}
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                  {payment.payment_id}
                </span>
              </td>

              {/* Remarks */}
              <td className="px-6 py-4 text-sm text-gray-600">
                {payment.remarks || <span className="text-gray-300 italic">None</span>}
              </td>

              {/* Amount - Right Aligned */}
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <span className="text-sm font-bold text-emerald-600">
                  ₱{payment.amount_paid.toLocaleString()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentRecord;