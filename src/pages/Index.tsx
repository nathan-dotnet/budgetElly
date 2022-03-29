import { AddTransactionForm } from "@/components/AddTransactionForm";
import { BalanceCards } from "@/components/BalanceCards";
import { BudgetTracker } from "@/components/BudgetTracker";
import { MonthlyCalendar } from "@/components/MonthlySummary";
import { TransactionList } from "@/components/TransactionList";
import { Button } from "@/components/ui/button";
import { FinanceProvider } from "@/context/FinanceContext";
import { useAuth } from "@/context/useAuth";
import { LogOut, Wallet } from "lucide-react";

const Index = () => {
  const { signOut, user } = useAuth();

  return (
    <FinanceProvider>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="container max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary p-2">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-xl font-bold flex-1">
              BudgetElly
            </h1>
            <span className="text-xs text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="container max-w-5xl mx-auto px-4 py-6 space-y-6">
          <BalanceCards />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-6">
              <AddTransactionForm />
              <MonthlyCalendar />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <BudgetTracker />
              <TransactionList />
            </div>
          </div>
        </main>
      </div>
    </FinanceProvider>
  );
};

export default Index;
