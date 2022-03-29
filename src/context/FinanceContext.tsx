import { useAuth } from "@/context/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  TransactionType,
} from "@/lib/finance";
import { endOfMonth, startOfMonth } from "date-fns";
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

export interface CustomCategory {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
}

interface FinanceContextType {
  transactions: Transaction[];
  budgets: Budget[];
  loading: boolean;

  selectedMonth: Date;
  setSelectedMonth: (d: Date) => void;

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

  customCategories: CustomCategory[];
  addCategory: (
    name: string,
    type: TransactionType,
    icon: string,
  ) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategories: (type: TransactionType) => string[];
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  /* ================= FETCH DATA ================= */

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load transactions");
      return;
    }

    setAllTransactions(
      (data || []).map((t) => ({
        id: t.id,
        type: t.type as TransactionType,
        amount: Number(t.amount),
        category: t.category,
        note: t.note,
        date: new Date(t.created_at),
      })),
    );
  };

  const fetchBudgets = async () => {
    const { data, error } = await supabase.from("budgets").select("*");

    if (error) {
      toast.error("Failed to load budgets");
      return;
    }

    setBudgets(
      (data || []).map((b) => ({
        category: b.category,
        limit: Number(b.limit),
      })),
    );
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to load categories");
      return;
    }

    setCustomCategories(
      (data || []).map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type as TransactionType,
        icon: c.icon,
      })),
    );
  };

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchTransactions(),
        fetchBudgets(),
        fetchCategories(),
      ]);
      setLoading(false);
    };

    loadData();
  }, [user]);

  /* ================= CATEGORY LOGIC ================= */

  const addCategory = useCallback(
    async (name: string, type: TransactionType, icon: string) => {
      if (!user) return;

      const { error } = await supabase
        .from("categories")
        .insert({ user_id: user.id, name, type, icon });

      if (error) {
        toast.error("Failed to add category");
        return;
      }

      await fetchCategories();
    },
    [user],
  );

  const deleteCategory = useCallback(async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete category");
      return;
    }

    setCustomCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const getCategories = useCallback(
    (type: TransactionType): string[] => {
      const defaults =
        type === "income" ? [...INCOME_CATEGORIES] : [...EXPENSE_CATEGORIES];

      const custom = customCategories
        .filter((c) => c.type === type)
        .map((c) => c.name);

      return [...defaults, ...custom];
    },
    [customCategories],
  );

  /* ================= TRANSACTIONS ================= */

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
        note: note || null,
      });

      if (error) {
        toast.error("Failed to add transaction");
        return;
      }

      await fetchTransactions();
    },
    [user],
  );

  const deleteTransaction = useCallback(async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete transaction");
      return;
    }

    setAllTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* ================= BUDGETS ================= */

  const setBudget = useCallback(
    async (category: string, limit: number) => {
      if (!user) return;

      const { error } = await supabase
        .from("budgets")
        .upsert(
          { user_id: user.id, category, limit },
          { onConflict: "user_id,category" },
        );

      if (error) {
        toast.error("Failed to set budget");
        return;
      }

      await fetchBudgets();
    },
    [user],
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

  /* ================= MONTH FILTERING ================= */

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const transactions = allTransactions.filter(
    (t) => t.date >= monthStart && t.date <= monthEnd,
  );

  /* ================= TOTALS ================= */

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const getSpentByCategory = useCallback(
    (category: string) =>
      transactions
        .filter((t) => t.type === "expense" && t.category === category)
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions],
  );

  /* ================= PROVIDER ================= */

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        budgets,
        loading,

        selectedMonth,
        setSelectedMonth,

        addTransaction,
        deleteTransaction,

        setBudget,
        removeBudget,

        totalIncome,
        totalExpenses,
        balance,
        getSpentByCategory,

        customCategories,
        addCategory,
        deleteCategory,
        getCategories,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}
// eslint-disable-next-line react-refresh/only-export-components
export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) {
    throw new Error("useFinance must be used within FinanceProvider");
  }
  return ctx;
}
