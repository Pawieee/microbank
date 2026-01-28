/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { useAlert } from "@/context/AlertContext";
import { format } from "date-fns";

interface ReleaseProps {
  loan_id: string;
  applicant_id: number;
  applicant_name: string;
  email: string;
  amount: number;
  duration: number;
  date_applied: string;
  onClose: () => void;
}

export function Release({
  loan_id,
  applicant_id,
  applicant_name,
  email,
  amount,
  duration,
  date_applied,
  onClose,
}: ReleaseProps) {
  const [open, setOpen] = useState(true);
  const { register, handleSubmit, setValue } = useForm();
  const { triggerAlert } = useAlert();

  // 1. CHECK PERMISSION
  const role = localStorage.getItem("role");
  const isManager = role === "manager";

  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    setValue("releaseDate", today);
  }, [setValue, today]);

  const handleSubmitClick = async (data: any) => {
    // Double check: If not manager, stop immediately
    if (!isManager) return;

    const payload = {
      applicant_id,
      loan_id,
      release_date: data.releaseDate,
    };

    try {
      const response = await fetch("/api/loans/disburse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      triggerAlert({
        title: "Disbursement Successful!",
        description: "The loan has been released successfully.",
        variant: "success",
        timeout: 2000,
      });

      handleDialogChange(false);
    } catch (error: any) {
      triggerAlert({
        title: "Disbursement Failed",
        description: error.message || "Something went wrong.",
        variant: "destructive",
        timeout: 4000,
      });
    }
  };

  const handleDialogChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          {/* Change Title based on Role */}
          <DialogTitle>
            {isManager ? "Release Disbursement" : "Loan Details"}
          </DialogTitle>
          <DialogDescription>
            {isManager 
              ? "Review the loan details and confirm the release date."
              : "View the approved loan details below."}
          </DialogDescription>
        </DialogHeader>

        {/* 2. SHARED VIEW: Everyone can see this info */}
        <div className="space-y-4 text-sm mt-2">
          <div className="grid grid-cols-2 gap-4 border-b pb-4">
             <div>
                <span className="text-muted-foreground block text-xs">Loan ID</span>
                <span className="font-medium">{loan_id}</span>
             </div>
             <div>
                <span className="text-muted-foreground block text-xs">Date Applied</span>
                <span className="font-medium">{new Date(date_applied).toLocaleDateString()}</span>
             </div>
          </div>
          
          <div>
            <span className="text-muted-foreground block text-xs">Client Name</span>
            <span className="font-medium text-base">{applicant_name}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground block text-xs">Term</span>
              <span className="font-medium">{duration} Months</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Total Amount</span>
              <span className="font-bold text-lg text-green-700">₱{amount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 3. MANAGER ONLY: The Input Form */}
        {isManager ? (
            <form className="mt-6 space-y-2 p-4 bg-muted/50 rounded-md">
            <label htmlFor="releaseDate" className="block text-sm font-medium">
                Set Release Date
            </label>
            <input
                type="date"
                id="releaseDate"
                min={today}
                defaultValue={today}
                {...register("releaseDate", { required: "Date is required" })}
                className="w-full border rounded-md px-3 py-2 text-sm bg-white"
            />
            </form>
        ) : (
            // TELLER VIEW: A helpful status message instead of the form
            <div className="mt-6 p-3 bg-blue-50 text-blue-700 text-sm rounded-md flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                <span>Ready for disbursement. Awaiting Manager action.</span>
            </div>
        )}

        <DialogFooter className="pt-4">
          {/* 4. FOOTER ACTIONS */}
          {isManager ? (
            <>
                <Button variant="outline" onClick={() => handleDialogChange(false)}>
                Cancel
                </Button>
                <Button type="button" onClick={handleSubmit(handleSubmitClick)}>
                Confirm Release
                </Button>
            </>
          ) : (
            <Button className="w-full sm:w-auto" onClick={() => handleDialogChange(false)}>
                Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}