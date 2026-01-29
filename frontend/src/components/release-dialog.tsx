/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { User, Mail, Hash, Calendar as CalendarLucide } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useAlert } from "@/context/AlertContext";

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
  const { triggerAlert } = useAlert();

  // 1. Initialize with a Date object (required for Shadcn Calendar)
  const form = useForm({
    defaultValues: {
      releaseDate: new Date(),
    },
  });

  const role = localStorage.getItem("role");
  const isManager = role === "manager";

  const handleDialogChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) onClose();
  };

  const onSubmit = async (data: { releaseDate: Date }) => {
    if (!isManager) return;

    const payload = {
      applicant_id,
      loan_id,
      email,
      // 2. Format Date object to string for the API
      release_date: format(data.releaseDate, "yyyy-MM-dd"),
    };

    try {
      const response = await fetch("/api/loans/disburse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP error! Status: ${response.status}`);
      }

      triggerAlert({
        title: "Disbursement Successful!",
        description: `₱${amount.toLocaleString()} has been released to ${applicant_name}.`,
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

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div>
              <DialogTitle>
                {isManager ? "Release Disbursement" : "Loan Details"}
              </DialogTitle>
              <DialogDescription>
                {isManager
                  ? "Confirm funds release and set the effective date."
                  : "Review the approved loan specifications."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* HERO SECTION */}
        <div className="bg-muted/40 p-4 rounded-lg border border-border/50 flex flex-col items-center justify-center my-2 gap-1">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Total Disbursement Amount
          </span>
          <span className="text-3xl font-bold text-emerald-600 tracking-tight">
            ₱{amount.toLocaleString()}
          </span>
          <span className="text-sm font-medium text-muted-foreground bg-background px-3 py-1 rounded-full border shadow-sm mt-2">
            {duration} Months Term
          </span>
        </div>

        {/* DETAILS GRID */}
        <div className="grid grid-cols-2 gap-y-4 gap-x-6 py-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Hash className="w-3 h-3" />
              <span className="text-xs uppercase font-bold tracking-wider">
                Loan ID
              </span>
            </div>
            <p className="text-sm font-mono font-medium truncate">{loan_id}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarLucide className="w-3 h-3" />
              <span className="text-xs uppercase font-bold tracking-wider">
                Applied On
              </span>
            </div>
            <p className="text-sm font-medium">
              {new Date(date_applied).toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-1 col-span-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-3 h-3" />
              <span className="text-xs uppercase font-bold tracking-wider">
                Applicant
              </span>
            </div>
            <p className="text-sm font-medium truncate" title={applicant_name}>
              {applicant_name}
            </p>
          </div>

          <div className="space-y-1 col-span-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-3 h-3" />
              <span className="text-xs uppercase font-bold tracking-wider">
                Email
              </span>
            </div>
            <p className="text-sm font-medium truncate" title={email}>
              {email}
            </p>
          </div>
        </div>

        {isManager ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <Separator />

              <FormField
                control={form.control}
                name="releaseDate"
                rules={{ required: true }}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Effective Release Date</FormLabel>

                    {/* CHANGE THIS LINE: Remove 'modal={true}' */}
                    <Popover>
                      <FormControl>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarLucide className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                      </FormControl>

                      {/* Note: The pointer-events-auto class is a safety net if clicks don't register */}
                      <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => handleDialogChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Confirm Release
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <>
            <div className="mt-4 p-4 bg-blue-50/50 text-blue-700 text-sm rounded-lg flex items-start gap-3 border border-blue-100">
              <div className="bg-blue-100 p-1 rounded-full">
                <CalendarLucide className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-semibold">Pending Disbursement</span>
                <span className="text-blue-600/80 text-xs">
                  This loan is ready. Please await action from a Manager.
                </span>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button
                className="w-full sm:w-auto"
                onClick={() => handleDialogChange(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}