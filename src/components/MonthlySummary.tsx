import { useFinance } from "@/context/FinanceContext";

export function MonthlyCalendar() {
  const { transactions } = useFinance();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  const daysInMonth = new Date(year, month + 1, 0).getDate();

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
    if (date.getFullYear() === year && date.getMonth() === month) {
      const day = date.getDate();
      if (t.type === "income") transactionsByDay[day].hasIncome = true;
      if (t.type === "expense") transactionsByDay[day].hasExpense = true;
    }
  });

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="rounded-lg border bg-card p-5 animate-fade-in">
      <h3 className="font-heading font-semibold text-lg mb-4">
        {now.toLocaleString("default", { month: "long" })} Calendar
      </h3>

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
        {Array.from({ length: new Date(year, month, 1).getDay() }).map(
          (_, i) => (
            <div key={`empty-${i}`} />
          ),
        )}

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
