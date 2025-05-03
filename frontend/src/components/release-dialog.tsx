/* eslint-disable @typescript-eslint/no-unused-vars */
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
  onClose: () => void; // ✅ new prop
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

  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    setValue("releaseDate", today);
  }, [setValue, today]);

  const handleSubmitClick = async (data: any) => {
    const payload = {
      applicant_id,
      loan_id,
      release_date: data.releaseDate,
    };

    try {
      const response = await fetch("/api/loans/disburse", {
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
        title: "Disbursement Successful!",
        description:
          "The loan has been released successfully to the applicant.",
        variant: "success",
        timeout: 2000,
      });

      handleDialogChange(false); // ✅ close the modal
    } catch (error: any) {
      triggerAlert({
        title: "Disbursement Failed",
        description:
          error.message ||
          "Something went wrong while processing the disbursement.",
        variant: "destructive",
        timeout: 4000,
      });
    }
  };

  const handleDialogChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      onClose(); // ✅ notify parent
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[500px] overflow-visible">
        <DialogHeader>
          <DialogTitle>Release Disbursement</DialogTitle>
          <DialogDescription>
            Review the loan details and confirm the release date.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p>
            <strong>Loan ID:</strong> {loan_id}
          </p>
          <p>
            <strong>Client:</strong> {applicant_name}
          </p>
          <p>
            <strong>Email:</strong> {email}
          </p>
          <p>
            <strong>Term:</strong> {`${duration} Months`}
          </p>
          <p>
            <strong>Date Applied:</strong>{" "}
            {new Date(date_applied).toLocaleDateString("en-PH", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
          <p>
            <strong>Amount:</strong> ₱{amount.toLocaleString()}
          </p>
        </div>

        <form className="mt-4 space-y-2">
          <label htmlFor="releaseDate" className="block text-sm font-medium">
            Release Date
          </label>
          <input
            type="date"
            id="releaseDate"
            min={today}
            defaultValue={today}
            {...register("releaseDate", { required: "Date is required" })}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </form>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => handleDialogChange(false)}>
            Close
          </Button>
          <Button type="button" onClick={handleSubmit(handleSubmitClick)}>
            Release
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
