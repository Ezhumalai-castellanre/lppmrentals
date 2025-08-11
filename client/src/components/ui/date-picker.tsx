import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean | ((date: Date) => boolean);
}

export function DatePicker({
  value,
  onChange,
  placeholder = "MM/DD/YYYY",
  className,
  disabled
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  // Ensure value is a valid Date object
  const validValue = value instanceof Date && !isNaN(value.getTime()) ? value : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="date-picker-input">
          <Input
            value={validValue ? format(validValue, "MM/dd/yyyy") : ""}
            placeholder={placeholder}
            className={cn(
              "input",
              className
            )}
            disabled={typeof disabled === "boolean" ? disabled : false}
            readOnly
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="calendar-button"
            onClick={() => setOpen(true)}
            disabled={typeof disabled === "boolean" ? disabled : false}
            aria-label="Choose date"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={validValue}
          onSelect={(date) => {
            onChange?.(date);
            setOpen(false);
          }}
          disabled={
            typeof disabled === "function" 
              ? disabled 
              : (date) => date > new Date() || date < new Date("1900-01-01")
          }
          initialFocus
          captionLayout="dropdown-buttons"
          fromYear={1900}
          toYear={new Date().getFullYear() + 10}
        />
      </PopoverContent>
    </Popover>
  );
}