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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useAlert } from "@/context/AlertContext"; // ⬅️ Use the global alert hook

interface PaymentProps {
  loanId: number;
  applicantId: number;
  onPaymentComplete?: () => void; // Ensure this is part of the props
}

export function Payment({ applicantId, loanId, onPaymentComplete }: PaymentProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const { triggerAlert } = useAlert(); // ⬅️ Access the alert

  const currentDate = new Date().toISOString().split("T")[0];

  const handleSubmit = async () => {
    const payload = {
      loan_id: loanId,
      applicant_id: applicantId,
      payment: parseFloat(amount),
      paymentType,
      paymentDate: currentDate,
    };
  
    try {
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
        description: error.message || "Something went wrong while recording the payment.",
        variant: "destructive",
        timeout: 4000,
      });
    }
  
    if (onPaymentComplete) onPaymentComplete(); // ⬅️ Trigger refresh or UI update
    setOpen(false);
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
              <Input
                id="paymentAmount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter payment amount"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paymentType" className="text-right">
                Payment Type
              </Label>
              <Select onValueChange={(value) => setPaymentType(value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paymentDate" className="text-right">
                Date of Payment
              </Label>
              <Input
                id="paymentDate"
                value={currentDate}
                readOnly
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit} disabled={!amount || !paymentType}>
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
