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

export function Release() {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, setValue } = useForm(); // Setup react-hook-form

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmitClick = (data: any) => {
    console.log("Submitted data:", data);

    // DIRI BACKEND API CALL
    // DIRI BACKEND API CALL
    // DIRI BACKEND API CALL
    setOpen(false);
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
            {/* Input Field for Date */}
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
                {/* You can add error handling here if needed */}
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
