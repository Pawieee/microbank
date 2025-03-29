import * as React from "react";
import { format, getYear, getMonth } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DatePickerProps {
  startYear?: number;
  endYear?: number;
  selected?: Date;
  onSelect?: (date: Date) => void;
}

export function DatePicker({
  startYear = getYear(new Date()) - 100,
  endYear = getYear(new Date()) + 100,
  selected,
  onSelect,
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date>(selected || new Date());
  const [calendarMonth, setCalendarMonth] = React.useState(
    new Date(date.getFullYear(), date.getMonth())
  );

  React.useEffect(() => {
    if (selected) {
      setDate(selected);
      setCalendarMonth(new Date(selected.getFullYear(), selected.getMonth())); // Ensure sync when external date is set
    }
  }, [selected]);

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      setCalendarMonth(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth())
      ); // Update calendar view
      if (onSelect) onSelect(selectedDate);
    }
  };

  const handleYearChange = (year: number) => {
    const newDate = new Date(date);
    newDate.setFullYear(year);
    setDate(newDate);
    setCalendarMonth(new Date(year, newDate.getMonth())); // Update calendar month view
  };

  const handleMonthChange = (month: number) => {
    const newDate = new Date(date);
    newDate.setMonth(month);
    setDate(newDate);
    setCalendarMonth(new Date(newDate.getFullYear(), month)); // Update calendar month view
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-4">
        <div className="flex gap-2">
          {/* Month Selector */}
          <Select
            onValueChange={(value) => handleMonthChange(Number(value))}
            value={String(getMonth(date))}
          >
            <SelectTrigger
              className="w-full"
              role="combobox"
              aria-label="Select month"
            >
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }).map((_, index) => (
                <SelectItem key={index} value={String(index)}>
                  {format(new Date(2000, index, 1), "MMMM")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Year Selector */}
          <Select
            onValueChange={(value) => handleYearChange(Number(value))}
            value={String(getYear(date))}
          >
            <SelectTrigger
              className="w-full"
              role="combobox"
              aria-label="Select year"
            >
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className="h-[500px]">
              {Array.from({ length: endYear - startYear + 1 }).map(
                (_, index) => {
                  const year = startYear + index;
                  return (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  );
                }
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Calendar Component */}
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          month={calendarMonth} // Dynamically change based on selected year/month
          onMonthChange={setCalendarMonth} // Allow natural navigation
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
