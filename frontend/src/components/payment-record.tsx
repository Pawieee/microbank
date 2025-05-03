/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { fetchPaymentsByLoanId } from "@/lib/payment-records";

type PaymentProps = {
  payment_id: string;
  amount_paid: number;
  remarks: string;
  transaction_date: string;
};

interface PaymentRecordProps {
  loan_id: number;
  refreshKey: number;
}

const PaymentRecord: React.FC<PaymentRecordProps> = ({ loan_id, refreshKey }) => {
  const [payments, setPayments] = useState<PaymentProps[]>([]);

  useEffect(() => {
    fetchPaymentsByLoanId(loan_id)
      .then(setPayments)
      .catch((err: any) => console.error("Error loading payments:", err));
  }, [loan_id, refreshKey]);

  return (
    <div className="overflow-x-auto mb-10">
      <h4 className="font-semibold mb-2">Payment Records</h4>
      {payments.length === 0 ? (
        <div className="text-gray-500 text-sm italic border border-dashed border-gray-300 p-4 rounded">
          No payment record
        </div>
      ) : (
        <table className="min-w-full border border-gray-200 text-left text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-2 border">Payment ID</th>
              <th className="p-2 border">Amount Paid</th>
              <th className="p-2 border">Remarks</th>
              <th className="p-2 border">Transaction Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.payment_id} className="border-t">
                <td className="p-2">{payment.payment_id}</td>
                <td className="p-2">₱{payment.amount_paid.toLocaleString()}</td>
                <td className="p-2">{payment.remarks}</td>
                <td className="p-2">{payment.transaction_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PaymentRecord;
