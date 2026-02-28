import { useFinance } from "@/context/FinanceContext";
import { formatCurrency } from "@/lib/finance";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";

export function BalanceCards() {
  const { totalIncome, totalExpenses, balance } = useFinance();

  const cards = [
    {
      label: "Balance",
      value: balance,
      icon: Wallet,
      colorClass: "text-primary",
      bgClass: "bg-primary/10",
    },
    {
      label: "Income",
      value: totalIncome,
      icon: TrendingUp,
      colorClass: "text-success",
      bgClass: "bg-success/10",
    },
    {
      label: "Expenses",
      value: totalExpenses,
      icon: TrendingDown,
      colorClass: "text-destructive",
      bgClass: "bg-destructive/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border bg-card p-5 animate-fade-in"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`rounded-lg p-2 ${card.bgClass}`}>
              <card.icon className={`h-5 w-5 ${card.colorClass}`} />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {card.label}
            </span>
          </div>
          <p className={`text-2xl font-heading font-bold ${card.colorClass}`}>
            {formatCurrency(card.value)}
          </p>
        </div>
      ))}
    </div>
  );
}
