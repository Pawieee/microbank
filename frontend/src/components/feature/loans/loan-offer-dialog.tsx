"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconFileCertificate, IconCheck, IconX } from "@tabler/icons-react";
import { Loader2, ShieldCheck, Lock } from "lucide-react";

// Define the shape of the Offer object based on your usage
export interface LoanOffer {
  principal: number;
  interest_rate: number;
  total_repayment: number;
  payment_amount: number;
  schedule: string;
  payment_count: number;
}

interface LoanOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: LoanOffer | null;
  loading: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function LoanOfferDialog({
  open,
  onOpenChange,
  offer,
  loading,
  onAccept,
  onDecline,
}: LoanOfferDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-700">
            <IconFileCertificate size={24} />
            System Offer Generated
          </DialogTitle>
          <DialogDescription>
            The system has assessed the application. Please communicate these terms
            to the client.
          </DialogDescription>
        </DialogHeader>

        {offer && (
          <div className="space-y-4 py-2">
            <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm font-medium text-zinc-500">
                  Risk Assessment
                </span>
                <span className="font-bold text-emerald-700 flex items-center gap-1 bg-emerald-100 px-2 py-0.5 rounded text-xs">
                  <ShieldCheck size={14} /> System Verified
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-zinc-500">
                  Principal Amount
                </span>
                <span className="font-mono text-zinc-900">
                  ₱{offer.principal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-zinc-500">
                  Interest Rate
                </span>
                <span className="font-mono text-zinc-900">
                  {offer.interest_rate}%
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-dashed border-zinc-300">
                <span className="text-sm font-bold text-zinc-700">
                  Total Repayment
                </span>
                <span className="font-bold text-xl text-emerald-600">
                  ₱{offer.total_repayment.toLocaleString()}
                </span>
              </div>
            </div>

            {/* UPDATED SECTION: Payment Schedule with Dust Value Note */}
            <div className="text-xs text-center text-muted-foreground bg-blue-50 p-3 rounded text-blue-700 border border-blue-100 flex flex-col gap-1">
              <span>
                <strong>Payment Schedule:</strong> ₱
                {offer.payment_amount.toLocaleString()} per {offer.schedule} (
                {offer.payment_count} payments)
              </span>
              <span className="text-[10px] opacity-80 italic">
                *The final payment amount may vary slightly to settle the exact total repayment balance.
              </span>
            </div>

            <div className="text-[10px] text-zinc-400 text-center flex items-center justify-center gap-1">
              <Lock size={10} /> Credit Score hidden for security compliance.
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onDecline} disabled={loading}>
            <IconX size={16} className="mr-2" /> Client Declined
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={onAccept}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <IconCheck size={16} className="mr-2" /> Client Accepts
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}