import { useFinance } from "@/context/FinanceContext";
import { EXPENSE_CATEGORIES, formatCurrency } from "@/lib/finance";

export function MonthlySummary() {
  const {
    totalIncome,
    totalExpenses,
    balance,
    // budgets,
    getSpentByCategory,
    transactions,
  } = useFinance();

  const topCategories = EXPENSE_CATEGORIES.map((c) => ({
    category: c,
    spent: getSpentByCategory(c),
  }))
    .filter((c) => c.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  const savingsRate =
    totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(0) : "0";

  return (
    <div className="rounded-lg border bg-card p-5 animate-fade-in">
      <h3 className="font-heading font-semibold text-lg mb-4">
        Monthly Summary
      </h3>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Income</span>
          <span className="font-medium text-success">
            {formatCurrency(totalIncome)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Expenses</span>
          <span className="font-medium text-destructive">
            {formatCurrency(totalExpenses)}
          </span>
        </div>
        <div className="border-t pt-3 flex justify-between text-sm">
          <span className="text-muted-foreground">Net Balance</span>
          <span
            className={`font-heading font-bold ${balance >= 0 ? "text-success" : "text-destructive"}`}
          >
            {formatCurrency(balance)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Savings Rate</span>
          <span className="font-medium">{savingsRate}%</span>
        </div>

        {topCategories.length > 0 && (
          <>
            <div className="border-t pt-3">
              <p className="text-sm font-medium mb-2">
                Top Spending Categories
              </p>
              {topCategories.slice(0, 5).map((c) => (
                <div
                  key={c.category}
                  className="flex justify-between text-sm py-1"
                >
                  <span className="text-muted-foreground">{c.category}</span>
                  <span className="font-medium">{formatCurrency(c.spent)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {transactions.length > 0 && totalExpenses > totalIncome && (
          <div className="border-t pt-3">
            <p className="text-sm font-medium text-destructive mb-1">
              ⚠️ Spending Alert
            </p>
            <p className="text-xs text-muted-foreground">
              You're spending more than you earn. Consider reducing spending in{" "}
              {topCategories[0]?.category || "non-essential categories"}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
