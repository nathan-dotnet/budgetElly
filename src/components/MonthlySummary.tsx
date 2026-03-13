import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinance } from "@/context/FinanceContext";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

const MONTH_OPTIONS = [
  { label: "January", value: 0 },
  { label: "February", value: 1 },
  { label: "March", value: 2 },
  { label: "April", value: 3 },
  { label: "May", value: 4 },
  { label: "June", value: 5 },
  { label: "July", value: 6 },
  { label: "August", value: 7 },
  { label: "September", value: 8 },
  { label: "October", value: 9 },
  { label: "November", value: 10 },
  { label: "December", value: 11 },
] as const;

function getMonthLabel(monthIndex: number) {
  return MONTH_OPTIONS.find((m) => m.value === monthIndex)?.label ?? "Month";
}

export function MonthlyCalendar() {
  const { transactions, selectedMonth, setSelectedMonth } = useFinance();

  const selectedYear = selectedMonth.getFullYear();
  const selectedMonthIndex = selectedMonth.getMonth(); // 0-indexed

  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(selectedYear);

  const pickerYearOptions = useMemo(
    () => Array.from({ length: 21 }, (_, i) => pickerYear - 10 + i),
    [pickerYear],
  );

  const setMonthYear = (year: number, monthIndex: number) => {
    setSelectedMonth(new Date(year, monthIndex, 1));
  };

  const handlePrevMonth = () => {
    setMonthYear(selectedYear, selectedMonthIndex - 1);
  };

  const handleNextMonth = () => {
    setMonthYear(selectedYear, selectedMonthIndex + 1);
  };

  const daysInMonth = new Date(selectedYear, selectedMonthIndex + 1, 0).getDate();

  // Map transactions to days with type info
  const transactionsByDay: Record<
    number,
    { hasIncome: boolean; hasExpense: boolean }
  > = {};

  for (let i = 1; i <= daysInMonth; i++) {
    transactionsByDay[i] = { hasIncome: false, hasExpense: false };
  }

  transactions.forEach((t) => {
    const date = new Date(t.date);
    if (
      date.getFullYear() === selectedYear &&
      date.getMonth() === selectedMonthIndex
    ) {
      const day = date.getDate();
      if (t.type === "income") transactionsByDay[day].hasIncome = true;
      if (t.type === "expense") transactionsByDay[day].hasExpense = true;
    }
  });

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="rounded-lg border bg-card p-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <h3 className="font-heading font-semibold text-lg">
          {getMonthLabel(selectedMonthIndex)} {selectedYear} Calendar
        </h3>

        <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label="Previous month"
            onClick={handlePrevMonth}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>

          <Popover
            open={monthPickerOpen}
            onOpenChange={(open) => {
              setMonthPickerOpen(open);
              if (open) setPickerYear(selectedYear);
            }}
          >
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 flex-1 sm:flex-none min-w-[160px] justify-between"
                aria-label="Pick month and year"
              >
                <span className="truncate">
                  {getMonthLabel(selectedMonthIndex)} {selectedYear}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-72 sm:w-80 p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Selected</span>
                <span className="font-medium text-primary">
                  {getMonthLabel(selectedMonthIndex)} {selectedYear}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 mb-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Previous year"
                  onClick={() => setPickerYear((y) => y - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>

                <Select
                  value={String(pickerYear)}
                  onValueChange={(v) => setPickerYear(Number(v))}
                >
                  <SelectTrigger
                    className={cn(
                      "h-8 w-[132px]",
                      pickerYear === selectedYear && "ring-1 ring-primary/40",
                    )}
                  >
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {pickerYearOptions.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Next year"
                  onClick={() => setPickerYear((y) => y + 1)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {MONTH_OPTIONS.map((m) => {
                  const isSelected =
                    pickerYear === selectedYear && m.value === selectedMonthIndex;
                  return (
                    <Button
                      key={m.value}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className="h-8"
                      onClick={() => {
                        setMonthYear(pickerYear, m.value);
                        setMonthPickerOpen(false);
                      }}
                    >
                      {m.label.slice(0, 3)}
                    </Button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-2 mt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const now = new Date();
                    setMonthYear(now.getFullYear(), now.getMonth());
                    setMonthPickerOpen(false);
                  }}
                >
                  This month
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label="Next month"
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => {
              const now = new Date();
              setMonthYear(now.getFullYear(), now.getMonth());
            }}
          >
            This month
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {/* Weekday headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="text-xs font-medium text-muted-foreground text-center"
          >
            {d}
          </div>
        ))}

        {/* Empty cells for first day offset */}
        {Array.from({
          length: new Date(selectedYear, selectedMonthIndex, 1).getDay(),
        }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Days */}
        {days.map((day) => {
          const { hasIncome, hasExpense } = transactionsByDay[day];
          let bgColor = "bg-gray-200 text-gray-500";

          if (hasIncome && hasExpense) bgColor = "bg-yellow-400 text-white";
          else if (hasIncome) bgColor = "bg-green-500 text-white";
          else if (hasExpense) bgColor = "bg-red-500 text-white";

          return (
            <div
              key={day}
              className={`h-10 w-10 flex items-center justify-center rounded-full text-sm font-medium ${bgColor}`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
