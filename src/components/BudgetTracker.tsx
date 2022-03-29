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
import { formatCurrency } from "@/lib/finance";
import { AlertTriangle, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function BudgetTracker() {
  const {
    budgets,
    setBudget,
    removeBudget,
    getSpentByCategory,
    getCategories,
  } = useFinance();
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(limit);
    if (!category || !parsed || parsed <= 0) {
      toast.error("Enter a valid category and limit");
      return;
    }
    setBudget(category, parsed);
    toast.success(`Budget set for ${category}`);
    setCategory("");
    setLimit("");
    setShowForm(false);
  };

  return (
    <div className="rounded-lg border bg-card animate-fade-in">
      <div className="p-5 border-b flex items-center justify-between">
        <h3 className="font-heading font-semibold text-lg">Budget Tracker</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="gap-1"
        >
          <Plus className="h-3.5 w-3.5" /> Set Budget
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="p-5 border-b space-y-3 bg-muted/30"
        >
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {getCategories("expense").map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Monthly Limit (₱)</Label>
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
            Save Budget
          </Button>
        </form>
      )}

      <div className="p-5 space-y-4">
        {budgets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No budgets set yet. Set limits per category to track spending.
          </p>
        ) : (
          budgets.map((b) => {
            const spent = getSpentByCategory(b.category);
            const pct = Math.min((spent / b.limit) * 100, 100);
            const isOver = spent >= b.limit;
            const isWarning = pct >= 80 && !isOver;

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
                      {formatCurrency(spent)} / {formatCurrency(b.limit)}
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
                  className={`h-2 ${isOver ? "[&>div]:bg-destructive" : isWarning ? "[&>div]:bg-warning" : "[&>div]:bg-success"}`}
                />
                {isOver && (
                  <p className="text-xs text-destructive font-medium">
                    Over budget by {formatCurrency(spent - b.limit)}!
                  </p>
                )}
                {isWarning && (
                  <p className="text-xs text-warning font-medium">
                    {formatCurrency(b.limit - spent)} remaining — approaching
                    limit
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
