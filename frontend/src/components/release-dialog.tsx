import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form"; // For form handling
import { useAlert } from "@/context/AlertContext";
import { useNavigate } from "react-router-dom";

interface ReleaseProps {
  applicantId: number;
  loanId: number;
}

export function Release({ applicantId, loanId }: ReleaseProps) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, setValue } = useForm();
  const navigate = useNavigate();

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const { triggerAlert } = useAlert(); // ⬅️ Access the alert

  const handleSubmitClick = async (data: any) => {
    const payload = {
      applicant_id: applicantId,
      loan_id: loanId,
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
      console.log(payload);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      triggerAlert({
        title: "Disbursement Successful!",
        description:
          "The loan has been released successfully to the applicant.",
        variant: "success",
        timeout: 4000,
      });

      console.log("Successfully submitted loan release!");
      console.log(payload);
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

    setOpen(false);
    navigate("/pages/applications");
  };

  return (
    <div>
      <div className="space-x-2">
        <Button variant="default" onClick={handleOpen}>
          Release Disbursement
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px] overflow-visible">
          <DialogHeader>
            <DialogTitle>Release Disbursement</DialogTitle>
            <DialogDescription>
              Choose a release date for this loan. Click Save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <form className="space-y-4">
              <div className="flex flex-col">
                <label htmlFor="releaseDate" className="font-medium text-sm">
                  Release Date
                </label>
                <input
                  type="date"
                  id="releaseDate"
                  {...register("releaseDate", { required: "Date is required" })}
                  className="border rounded-md px-3 py-2"
                />
              </div>
              <Button onClick={handleSubmit(handleSubmitClick)} type="button">
                Confirm
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
