import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency, isSavingsCategory } from "@/lib/finance";
import { AlertTriangle, PiggyBank, Plus, Wallet, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function BudgetTracker() {
  const {
    allTransactions,
    budgets,
    setBudget,
    removeBudget,
    getSpentByCategory,
    getCategories,
    customCategories,
  } = useFinance();

  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<"budget" | "savings">("budget");

  const savingsCategoryNameSet = new Set<string>([
    ...getCategories("savings"),
    ...customCategories
      .filter((c) => c.type === "savings" || isSavingsCategory(c.name))
      .map((c) => c.name),
  ]);
  const isSavingsName = (name: string) =>
    savingsCategoryNameSet.has(name) || isSavingsCategory(name);

  const selectableCategories =
    mode === "savings"
      ? getCategories("savings")
      : getCategories("expense").filter((c) => !isSavingsName(c));

  const visibleBudgets = budgets.filter((b) =>
    mode === "savings" ? isSavingsName(b.category) : !isSavingsName(b.category),
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(limit);
    if (!category || !parsed || parsed <= 0) {
      toast.error("Enter a valid category and limit");
      return;
    }

    const success = await setBudget(category, parsed);
    if (!success) {
      toast.error("Failed to save budget");
      return;
    }

    toast.success(
      `${mode === "savings" ? "Goal" : "Budget"} set for ${category}`,
    );
    setCategory("");
    setLimit("");
    setShowForm(false);
  };

  const getSavedByCategory = (cat: string) => {
    const deposits = allTransactions
      .filter((t) => t.type === "income" && t.category === cat)
      .reduce((sum, t) => sum + t.amount, 0);

    const withdrawals = allTransactions
      .filter((t) => t.type === "expense" && t.category === cat)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      saved: Math.max(deposits - withdrawals, 0),
      overdraw: Math.max(withdrawals - deposits, 0),
    };
  };

  return (
    <div className="rounded-lg border bg-card animate-fade-in">
      <div className="p-5 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-heading font-semibold text-lg">
              {mode === "savings" ? "Savings Tracker" : "Budget Tracker"}
            </h3>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="gap-1"
          >
            <Plus className="h-3.5 w-3.5" />{" "}
            {mode === "savings" ? "Set Goal" : "Set Budget"}
          </Button>
          <div className="flex items-center gap-1 rounded-md border bg-muted/30 p-1">
            <Button
              type="button"
              size="icon"
              variant={mode === "budget" ? "default" : "ghost"}
              className="h-7 w-7"
              aria-label="Budget mode"
              title="Budget"
              onClick={() => {
                setMode("budget");
                setShowForm(false);
                setCategory("");
              }}
            >
              <Wallet className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant={mode === "savings" ? "default" : "ghost"}
              className="h-7 w-7"
              aria-label="Savings mode"
              title="Savings"
              onClick={() => {
                setMode("savings");
                setShowForm(false);
                setCategory("");
              }}
            >
              <PiggyBank className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="p-5 border-b space-y-3 bg-muted/30"
        >
          <div>
            <Label>{mode === "savings" ? "Savings Account" : "Category"}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    mode === "savings"
                      ? "Select savings account"
                      : "Select category"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {selectableCategories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>
              {mode === "savings" ? "Goal Amount (PHP)" : "Monthly Limit (PHP)"}
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
          </div>
          <Button type="submit" size="sm">
            Save {mode === "savings" ? "Goal" : "Budget"}
          </Button>
        </form>
      )}

      <div className="p-5 space-y-4">
        {visibleBudgets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {mode === "savings"
              ? "No savings goals set yet. Set a goal per account to track progress."
              : "No budgets set yet. Set limits per category to track spending."}
          </p>
        ) : (
          visibleBudgets.map((b) => {
            const spent =
              mode === "budget" ? getSpentByCategory(b.category) : 0;
            const { saved, overdraw } =
              mode === "savings"
                ? getSavedByCategory(b.category)
                : { saved: 0, overdraw: 0 };

            const used = mode === "savings" ? saved : spent;
            const pct = Math.min((used / b.limit) * 100, 100);
            const isOver = mode === "budget" ? used >= b.limit : false;
            const isWarning = mode === "budget" ? pct >= 80 && !isOver : false;
            const remaining = Math.max(b.limit - used, 0);

            return (
              <div key={b.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{b.category}</span>
                  <div className="flex items-center gap-2">
                    {(isOver || isWarning) && (
                      <AlertTriangle
                        className={`h-3.5 w-3.5 ${isOver ? "text-destructive" : "text-warning"}`}
                      />
                    )}
                    <span className="text-muted-foreground">
                      {formatCurrency(remaining)} /{" "}
                      {formatCurrency(b.limit)}{" "}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeBudget(b.category)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Progress
                  value={pct}
                  className={`h-2 ${
                    mode === "savings"
                      ? "[&>div]:bg-success"
                      : isOver
                        ? "[&>div]:bg-destructive"
                        : isWarning
                          ? "[&>div]:bg-warning"
                          : "[&>div]:bg-success"
                  }`}
                />
                {mode === "budget" && isOver && (
                  <p className="text-xs text-destructive font-medium">
                    Over budget by {formatCurrency(spent - b.limit)}!
                  </p>
                )}
                {mode === "budget" && isWarning && (
                  <p className="text-xs text-warning font-medium">
                    {formatCurrency(b.limit - spent)} remaining — approaching
                    limit
                  </p>
                )}
                {mode === "savings" && overdraw > 0 && (
                  <p className="text-xs text-destructive font-medium">
                    Overdrawn by {formatCurrency(overdraw)}
                  </p>
                )}
                {mode === "savings" && overdraw === 0 && saved >= b.limit && (
                  <p className="text-xs text-success font-medium">
                    Goal reached! You&apos;re over by{" "}
                    {formatCurrency(saved - b.limit)}.
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
