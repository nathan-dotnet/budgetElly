import { Button } from "@/components/ui/button";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency, getCategoryIcon } from "@/lib/finance";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";

export function TransactionList() {
  const { transactions, deleteTransaction } = useFinance();

  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center animate-fade-in">
        <p className="text-muted-foreground">
          No transactions yet. Add your first one!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card animate-fade-in">
      <div className="p-5 border-b">
        <h3 className="font-heading font-semibold text-lg">
          Recent Transactions
        </h3>
      </div>
      <div className="divide-y max-h-[400px] overflow-y-auto">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors group"
          >
            <span className="text-xl">{getCategoryIcon(tx.category)}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{tx.category}</p>
              <p className="text-xs text-muted-foreground truncate">
                {tx.note || format(tx.date, "MMM d, h:mm a")}
              </p>
            </div>
            <span
              className={`font-heading font-semibold text-sm ${
                tx.type === "income" ? "text-success" : "text-destructive"
              }`}
            >
              {tx.type === "income" ? "+" : "-"}
              {formatCurrency(tx.amount)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => deleteTransaction(tx.id)}
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
