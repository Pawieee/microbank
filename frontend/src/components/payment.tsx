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

  export function Payment() {
    const [open, setOpen] = useState(false);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    // Current date (non-editable)
    const currentDate = new Date().toLocaleDateString();

    return (
      <div>
        {/* Button to trigger modal */}
        <div className="space-x-2">
          <Button variant="default" onClick={handleOpen}>
            Record Payment
          </Button>
        </div>

        {/* Dialog modal */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Enter the payment details here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Payment Amount Field */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="paymentAmount" className="text-right">
                  Payment Amount
                </Label>
                <Input
                  id="paymentAmount"
                  placeholder="Enter payment amount"
                  className="col-span-3"
                />
              </div>

              {/* Payment Type Field */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="paymentType" className="text-right">
                  Payment Type
                </Label>
                <Select>
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

              {/* Payment Date Field (Non-editable) */}
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
              <Button type="submit" onClick={handleClose}>
                Confirm{" "}
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
