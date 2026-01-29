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
import { Loader2 } from "lucide-react"; // Import spinner

interface PaymentProps {
  loan_id: number;
  applicant_id: number;
  onPaymentComplete?: () => void;
  leftToPaid: number;
}

export function Payment({
  loan_id, // applicant_id not strictly needed for payment logic, but okay
  onPaymentComplete,
  leftToPaid,
}: PaymentProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false); // Add loading state
  const { triggerAlert } = useAlert();

  const handleSubmit = async () => {
    const payAmount = parseFloat(amount);

    if (isNaN(payAmount) || payAmount <= 0) {
        triggerAlert({ title: "Error", description: "Invalid amount", variant: "destructive" });
        return;
    }

    if (payAmount > leftToPaid + 1) { // +1 for floating point tolerance
      triggerAlert({
        title: "Payment Error",
        description: `Cannot pay more than balance (₱${leftToPaid})`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/loans/payment", {
       method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            loan_id: loan_id,
            amount: payAmount
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Server Error");
      }

      triggerAlert({
        title: "Success",
        description: "Payment recorded.",
        variant: "success",
      });
      
      setAmount("");
      setOpen(false);
      if (onPaymentComplete) onPaymentComplete();
      
    } catch (error: any) {
      triggerAlert({
        title: "Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button variant="default" onClick={() => setOpen(true)}>
        Record Payment
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Current Balance: <span className="font-bold text-red-600">₱{leftToPaid.toLocaleString()}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paymentAmount" className="text-right">Amount</Label>
              <div className="col-span-3 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
                <Input
                  id="paymentAmount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!amount || loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}