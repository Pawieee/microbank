/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useAlert } from "@/context/AlertContext";
import { Loader2 } from "lucide-react";
import {
  IconWallet,
  IconReceipt2,
  IconAlertCircle
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PaymentProps {
  loan_id: number;
  applicant_id: number;
  dueAmount?: number;
  leftToPaid: number;
  onPaymentComplete?: () => void;
}

export function Payment({
  loan_id,
  applicant_id,
  dueAmount = 0,
  leftToPaid,
  onPaymentComplete,
}: PaymentProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentType, setPaymentType] = useState<"partial" | "exact" | "advance" | "settlement" | null>(null);

  const { triggerAlert } = useAlert();

  useEffect(() => {
    if (open) {
      setAmount("");
      setPaymentType(null);
    }
  }, [open]);

  const val = parseFloat(amount);
  const isOverLimit = val > leftToPaid; // Check if overpayment

  useEffect(() => {
    if (!val || isNaN(val)) {
      setPaymentType(null);
      return;
    }

    if (val >= leftToPaid && !isOverLimit) setPaymentType("settlement");
    else if (val > dueAmount) setPaymentType("advance");
    else if (val === dueAmount) setPaymentType("exact");
    else setPaymentType("partial");
  }, [amount, dueAmount, leftToPaid, val, isOverLimit]);

  const handleSubmit = async () => {
    const payAmount = parseFloat(amount);

    if (isNaN(payAmount) || payAmount <= 0) {
      triggerAlert({ title: "Error", description: "Invalid amount", variant: "destructive" });
      return;
    }

    // STRICT FRONTEND BLOCKER
    if (payAmount > leftToPaid) {
      triggerAlert({
        title: "Overpayment Detected",
        description: `You cannot accept a payment of ₱${payAmount.toLocaleString()} because it exceeds the remaining balance of ₱${leftToPaid.toLocaleString()}.`,
        variant: "destructive",
      });
      return; // Stop execution
    }

    setLoading(true);
    try {
      const response = await fetch("/api/loans/payment", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loan_id: loan_id,
          applicant_id: applicant_id,
          amount: payAmount
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Server Error");
      }

      triggerAlert({
        title: "Success",
        description: `Payment of ₱${payAmount.toLocaleString()} recorded.`,
        variant: "success",
      });

      setOpen(false);
      if (onPaymentComplete) onPaymentComplete();

    } catch (error: any) {
      triggerAlert({
        title: "Transaction Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setQuickAmount = (val: number) => {
    setAmount(val.toString());
  };

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} className="h-8 bg-zinc-900 hover:bg-zinc-800">
        <IconWallet className="mr-2 h-3.5 w-3.5" />
        Record Payment
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden rounded-xl">

          {/* HEADER */}
          <div className="bg-zinc-50 border-b p-6 pb-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 bg-white border rounded-lg shadow-sm">
                  <IconReceipt2 className="h-5 w-5 text-zinc-600" />
                </div>
                Record Payment
              </DialogTitle>
            </DialogHeader>

            <div className="mt-4 bg-white border rounded-lg p-4 shadow-sm grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 rounded-md p-1 px-2 border border-emerald-100">
                <span className="text-[10px] uppercase font-bold text-emerald-600">Current Due</span>
                <p className="font-bold text-emerald-700">₱{dueAmount.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400">Total Balance</span>
                <p className="font-semibold text-zinc-900">₱{leftToPaid.toLocaleString()}</p>
              </div>

            </div>
          </div>

          {/* INPUT SECTION */}
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="paymentAmount" className="text-sm font-medium">Amount Received</Label>
                {paymentType && !isOverLimit && (
                  <Badge variant="outline" className="capitalize text-[10px] h-5 px-2">
                    {paymentType === "settlement" ? "Full Settlement" : paymentType}
                  </Badge>
                )}
                {isOverLimit && (
                  <Badge variant="destructive" className="text-[10px] h-5 px-2">
                    Overpayment
                  </Badge>
                )}
              </div>

              <div className="relative">
                <span className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2 text-xl font-medium",
                  isOverLimit ? "text-red-400" : "text-zinc-400"
                )}>₱</span>
                <Input
                  id="paymentAmount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={cn(
                    "pl-9 h-14 text-2xl font-bold focus-visible:ring-zinc-900",
                    isOverLimit ? "border-red-500 text-red-600 focus-visible:ring-red-500 bg-red-50" : "border-zinc-200"
                  )}
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              {/* Quick Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="text-xs h-9 border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700"
                  onClick={() => setQuickAmount(dueAmount)}
                >
                  Pay Due (₱{dueAmount.toLocaleString()})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="text-xs h-9 border-dashed hover:bg-zinc-50"
                  onClick={() => setQuickAmount(leftToPaid)}
                >
                  Full Balance (₱{leftToPaid.toLocaleString()})
                </Button>
              </div>
            </div>

            {/* WARNINGS */}
            {isOverLimit && (
              <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-md text-xs border border-red-100 animate-in fade-in slide-in-from-top-1">
                <IconAlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  <strong>Amount too high.</strong> You cannot accept more than ₱{leftToPaid.toLocaleString()}. Please correct the amount.
                </p>
              </div>
            )}

            {!isOverLimit && val > 0 && val < dueAmount && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 text-amber-700 rounded-md text-xs border border-amber-100">
                <IconAlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>This payment is less than the current amount due. Arrears will persist.</p>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <DialogFooter className="p-6 pt-0">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              // DISABLE BUTTON IF OVER LIMIT
              disabled={!amount || parseFloat(amount) <= 0 || loading || isOverLimit}
              className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}