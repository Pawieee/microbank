/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useAlert } from "@/context/AlertContext";

interface PaymentProps {
  loan_id: number;
  applicant_id: number;
  onPaymentComplete?: () => void;
  leftToPaid: number;
}

export function Payment({
  applicant_id,
  loan_id,
  onPaymentComplete,
  leftToPaid,
}: PaymentProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const { triggerAlert } = useAlert();

  const current_date = new Date().toISOString().split("T")[0];

  const handleSubmit = async () => {
    const payload = {
      loan_id: loan_id,
      applicant_id: applicant_id,
      payment: parseFloat(amount),
      paymentDate: current_date,
    };

    try {
      if (payload.payment > leftToPaid) {
        triggerAlert({
          title: "Payment Error",
          description: `The payment amount cannot exceed the remaining balance of ₱${leftToPaid}. Please enter a valid amount.`,
          variant: "destructive",
          timeout: 4000,
        });
        return;
      }
      const response = await fetch("/api/loans/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      triggerAlert({
        title: "Payment Successful!",
        description: "The payment has been recorded successfully.",
        variant: "success",
        timeout: 4000,
      });
    } catch (error: any) {
      triggerAlert({
        title: "Payment Failed",
        description:
          error.message || "Something went wrong while recording the payment.",
        variant: "destructive",
        timeout: 4000,
      });
    }

    if (onPaymentComplete) onPaymentComplete();
    setOpen(false);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value === "" || /^[1-9][0-9]*$/.test(value)) {
      setAmount(value);
    }
  };

  return (
    <div>
      <div className="space-x-2">
        <Button variant="default" onClick={() => setOpen(true)}>
          Record Payment
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Enter the payment details here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paymentAmount" className="text-right">
                Payment Amount
              </Label>
              <div className="col-span-3 relative">
                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xl text-gray-500">
                  ₱
                </span>
                <Input
                  id="paymentAmount"
                  type="text" // Changed to text to handle custom input validation
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="Enter payment amount"
                  className="pl-7" // Add padding to the left so the text doesn't overlap with the peso sign
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit} disabled={!amount}>
              Confirm
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
