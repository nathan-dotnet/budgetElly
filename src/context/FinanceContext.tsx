import { useAuth } from "@/context/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { TransactionType } from "@/lib/finance";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note?: string | null;
  date: Date;
}

export interface Budget {
  category: string;
  limit: number;
}

interface TransactionRow {
  id: string;
  type: string;
  amount: number;
  category: string;
  note: string | null;
  created_at: string;
}

interface BudgetRow {
  category: string;
  limit: number;
}

interface FinanceContextType {
  transactions: Transaction[];
  budgets: Budget[];
  loading: boolean;
  addTransaction: (
    type: TransactionType,
    amount: number,
    category: string,
    note?: string,
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  setBudget: (category: string, limit: number) => Promise<void>;
  removeBudget: (category: string) => Promise<void>;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  getSpentByCategory: (category: string) => number;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load transactions");
      return;
    }

    const rows = (data as TransactionRow[] | null) ?? [];

    setTransactions(
      rows.map((t) => ({
        id: t.id,
        type: t.type as TransactionType,
        amount: Number(t.amount),
        category: t.category,
        note: t.note,
        date: new Date(t.created_at),
      })),
    );
  }, []);

  const fetchBudgets = useCallback(async () => {
    const { data, error } = await supabase.from("budgets").select("*");

    if (error) {
      toast.error("Failed to load budgets");
      return;
    }

    const rows = (data as BudgetRow[] | null) ?? [];

    setBudgets(
      rows.map((b) => ({
        category: b.category,
        limit: Number(b.limit),
      })),
    );
  }, []);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTransactions(), fetchBudgets()]);
      setLoading(false);
    };

    loadData();
  }, [user, fetchTransactions, fetchBudgets]);

  const addTransaction = useCallback(
    async (
      type: TransactionType,
      amount: number,
      category: string,
      note?: string,
    ) => {
      if (!user) return;

      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        type,
        amount,
        category,
        note: note ?? null,
      });

      if (error) {
        toast.error("Failed to add transaction");
        return;
      }

      await fetchTransactions();
    },
    [user, fetchTransactions],
  );

  const deleteTransaction = useCallback(async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete transaction");
      return;
    }

    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setBudget = useCallback(
    async (category: string, limit: number) => {
      if (!user) return;

      const { error } = await supabase.from("budgets").upsert({
        user_id: user.id,
        category,
        limit,
      });

      if (error) {
        toast.error("Failed to set budget");
        return;
      }

      await fetchBudgets();
    },
    [user, fetchBudgets],
  );

  const removeBudget = useCallback(async (category: string) => {
    const { error } = await supabase
      .from("budgets")
      .delete()
      .eq("category", category);

    if (error) {
      toast.error("Failed to remove budget");
      return;
    }

    setBudgets((prev) => prev.filter((b) => b.category !== category));
  }, []);

  const getSpentByCategory = useCallback(
    (category: string) => {
      return transactions
        .filter((t) => t.type === "expense" && t.category === category)
        .reduce((sum, t) => sum + t.amount, 0);
    },
    [transactions],
  );

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        budgets,
        loading,
        addTransaction,
        deleteTransaction,
        setBudget,
        removeBudget,
        getSpentByCategory,
        totalIncome,
        totalExpenses,
        balance,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useFinance = () => {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
};
