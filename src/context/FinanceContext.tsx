import { useAuth } from "@/context/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  isSavingsCategory,
  TransactionType,
} from "@/lib/finance";
import { endOfMonth, format, startOfMonth } from "date-fns";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  allTransactions: Transaction[];
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
    date?: Date,
  ) => Promise<void>;

  deleteTransaction: (id: string) => Promise<void>;

  setBudget: (category: string, limit: number) => Promise<boolean>;
  removeBudget: (category: string) => Promise<boolean>;

  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savings: number;

  getSpentByCategory: (category: string) => number;

  customCategories: CustomCategory[];
  addCategory: (
    name: string,
    type: TransactionType,
    icon: string,
  ) => Promise<void>;
  updateCategory: (
    id: string,
    name: string,
    type: TransactionType,
    icon: string,
  ) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategories: (type: TransactionType) => string[];
}

const FinanceContext = createContext<FinanceContextType | null>(null);

const CATEGORY_ICON_SAVINGS_META = "::savings";
const SAVINGS_BUDGET_MONTH = "0001-01-01";

function isMissingBudgetsMonthColumn(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const msg = "message" in err ? (err as { message?: unknown }).message : "";
  const message = typeof msg === "string" ? msg.toLowerCase() : "";
  return (
    message.includes("month") &&
    (message.includes("does not exist") || message.includes("unknown column"))
  );
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [hasBudgetsMonthColumn] = useState(true);

  const budgetMonthKey = useMemo(
    () => format(startOfMonth(selectedMonth), "yyyy-MM-dd"),
    [selectedMonth],
  );

  const savingsCategoryNameSet = useMemo(
    () =>
      new Set(
        customCategories
          .filter((c) => c.type === "savings" || isSavingsCategory(c.name))
          .map((c) => c.name),
      ),
    [customCategories],
  );
  const isSavingsName = useCallback(
    (name: string) =>
      savingsCategoryNameSet.has(name) || isSavingsCategory(name),
    [savingsCategoryNameSet],
  );

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

  const fetchBudgets = useCallback(async () => {
    if (!user) return;

    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

    // If the schema doesn't have `month`, we'll keep budgets scoped by created_at.
    const { data, error } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to load budgets");
      return;
    }

    type BudgetRow = {
      category: string;
      limit: number;
      month?: string;
      created_at?: string;
    };

    const rawRows = (data || []) as unknown[];
    const budgetRows: BudgetRow[] = rawRows.map((r) => {
      const row = r as Record<string, unknown>;
      return {
        category: String(row.category),
        limit: Number(row.limit),
        month: typeof row.month === "string" ? row.month : undefined,
        created_at:
          typeof row.created_at === "string" ? row.created_at : undefined,
      };
    });

    const hasMonthColumn = budgetRows.some((r) => typeof r.month === "string");

    let visibleBudgets: BudgetRow[];

    if (hasMonthColumn) {
      const savingsGoals = budgetRows.filter(
        (r) => r.month === SAVINGS_BUDGET_MONTH,
      );
      const monthBudgets = budgetRows.filter((r) => r.month === budgetMonthKey);
      visibleBudgets = [...savingsGoals, ...monthBudgets];
    } else {
      // Treat budgets as monthly based on created_at; keep savings goals forever.
      visibleBudgets = budgetRows.filter((r) => {
        if (isSavingsName(r.category)) return true;
        if (!r.created_at) return false;
        const d = new Date(r.created_at);
        return d >= monthStart && d <= monthEnd;
      });

      // We keep all budgets in the database to avoid accidentally deleting savings goals.
      // Visibility is still controlled above by the created_at filter, so older budgets
      // won't show once the user flips months.
    }

    setBudgets(
      visibleBudgets.map((b) => ({
        category: b.category,
        limit: b.limit,
      })),
    );
  }, [budgetMonthKey, selectedMonth, user, isSavingsName]);

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
        type:
          typeof c.icon === "string" &&
          c.icon.endsWith(CATEGORY_ICON_SAVINGS_META)
            ? "savings"
            : (c.type as TransactionType),
        icon:
          typeof c.icon === "string" &&
          c.icon.endsWith(CATEGORY_ICON_SAVINGS_META)
            ? c.icon.slice(0, -CATEGORY_ICON_SAVINGS_META.length)
            : c.icon,
      })),
    );
  };

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTransactions(), fetchCategories()]);
      setLoading(false);
    };

    loadData();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchBudgets();
  }, [fetchBudgets, user]);

  /* ================= CATEGORY LOGIC ================= */

  const addCategory = useCallback(
    async (name: string, type: TransactionType, icon: string) => {
      if (!user) return;

      const typeToSave = type === "savings" ? "expense" : type;
      const iconToSave =
        type === "savings" && !icon.endsWith(CATEGORY_ICON_SAVINGS_META)
          ? `${icon}${CATEGORY_ICON_SAVINGS_META}`
          : icon;

      const { error } = await supabase
        .from("categories")
        .insert({ user_id: user.id, name, type: typeToSave, icon: iconToSave });

      if (error) {
        toast.error(`Failed to add category: ${error.message}`);
        return;
      }

      await fetchCategories();
    },
    [user],
  );

  const updateCategory = useCallback(
    async (id: string, name: string, type: TransactionType, icon: string) => {
      if (!user) return;

      const typeToSave = type === "savings" ? "expense" : type;
      const iconToSave =
        type === "savings" && !icon.endsWith(CATEGORY_ICON_SAVINGS_META)
          ? `${icon}${CATEGORY_ICON_SAVINGS_META}`
          : icon;

      const { error } = await supabase
        .from("categories")
        .update({ name, type: typeToSave, icon: iconToSave })
        .eq("id", id);

      if (error) {
        toast.error(`Failed to update category: ${error.message}`);
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
        type === "income"
          ? [...INCOME_CATEGORIES]
          : type === "expense"
            ? [...EXPENSE_CATEGORIES]
            : [];

      const custom = customCategories
        .filter((c) => c.type === type)
        .map((c) => c.name);

      const savings = customCategories
        .filter((c) => c.type === "savings" || isSavingsCategory(c.name))
        .map((c) => c.name);

      return Array.from(
        new Set([
          ...defaults,
          ...custom,
          ...(type === "expense" ? savings : []),
          ...(type === "savings" ? savings : []),
        ]),
      );
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
      date: Date = new Date(),
    ) => {
      if (!user) return;

      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        type,
        amount,
        category,
        note: note || null,
        created_at: date.toISOString(),
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
      if (!user) return false;

      const monthToSave = isSavingsName(category)
        ? SAVINGS_BUDGET_MONTH
        : budgetMonthKey;

      // If we already know the schema doesn't have `month`, use the legacy payload.
      const shouldUseLegacy = hasBudgetsMonthColumn === false;

      type BudgetInsertBase = Pick<
        Database["public"]["Tables"]["budgets"]["Insert"],
        "user_id" | "category" | "limit"
      >;

      type BudgetUpsertPayload = BudgetInsertBase & { month?: string };

      const payload: BudgetUpsertPayload = {
        user_id: user.id,
        category,
        limit,
        ...(shouldUseLegacy ? {} : { month: monthToSave }),
      };

      const onConflict = shouldUseLegacy
        ? "user_id,category"
        : "user_id,category,month";

      const { error } = await supabase
        .from("budgets")
        .upsert(payload, { onConflict: "user_id,category,month" });

      if (error) {
        if (isMissingBudgetsMonthColumn(error)) {
          const legacy = await supabase
            .from("budgets")
            .upsert(
              { user_id: user.id, category, limit },
              { onConflict: "user_id,category" },
            );
          if (legacy.error) {
            toast.error("Failed to set budget");
            return false;
          }
          await fetchBudgets();
          return true;
        }
        toast.error("Failed to set budget");
        return false;
      }

      await fetchBudgets();
      return true;
    },
    [budgetMonthKey, fetchBudgets, hasBudgetsMonthColumn, isSavingsName, user],
  );

  const removeBudget = useCallback(
    async (category: string) => {
      if (!user) return false;

      const monthToDelete = isSavingsName(category)
        ? SAVINGS_BUDGET_MONTH
        : budgetMonthKey;

      const shouldUseLegacy = hasBudgetsMonthColumn === false;

      const query = supabase
        .from("budgets")
        .delete()
        .eq("user_id", user.id)
        .eq("category", category);

      const request = shouldUseLegacy
        ? query
        : query.filter("month", "eq", monthToDelete);

      const { error } = await request;

      if (error) {
        if (isMissingBudgetsMonthColumn(error)) {
          const legacy = await supabase
            .from("budgets")
            .delete()
            .eq("user_id", user.id)
            .eq("category", category);
          if (legacy.error) {
            toast.error("Failed to remove budget");
            return false;
          }
          await fetchBudgets();
          return true;
        }
        toast.error("Failed to remove budget");
        return false;
      }

      await fetchBudgets();
      return true;
    },
    [budgetMonthKey, fetchBudgets, hasBudgetsMonthColumn, isSavingsName, user],
  );

  /* ================= MONTH FILTERING ================= */

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const transactions = allTransactions.filter(
    (t) => t.date >= monthStart && t.date <= monthEnd,
  );

  /* ================= TOTALS ================= */

  // Income & expense totals are calculated for the currently selected month so
  // they reset when the user switches months.
  const totalExpensesNonSavings = transactions
    .filter((t) => t.type === "expense" && !isSavingsName(t.category))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncomeAll = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const savingsDeposits = transactions
    .filter((t) => t.type === "income" && isSavingsName(t.category))
    .reduce((sum, t) => sum + t.amount, 0);

  const savingsOverdraw = transactions
    .filter((t) => t.type === "expense" && isSavingsName(t.category))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = totalIncomeAll - savingsDeposits;
  const totalExpenses = totalExpensesNonSavings + savingsOverdraw;

  // Balance & savings are computed across all transactions so they persist
  // across month changes.
  const allTimeSavingsCategories = Array.from(
    new Set(
      allTransactions
        .filter((t) => isSavingsName(t.category))
        .map((t) => t.category),
    ),
  );

  const savings = allTimeSavingsCategories.reduce((sum, category) => {
    const deposits = allTransactions
      .filter((t) => t.type === "income" && t.category === category)
      .reduce((s, t) => s + t.amount, 0);

    const withdrawals = allTransactions
      .filter((t) => t.type === "expense" && t.category === category)
      .reduce((s, t) => s + t.amount, 0);

    return sum + Math.max(deposits - withdrawals, 0);
  }, 0);

  const totalIncomeAllTime = allTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpensesAllTime = allTransactions
    .filter((t) => t.type === "expense" && !isSavingsName(t.category))
    .reduce((sum, t) => sum + t.amount, 0);
  // Balance should be the net remaining cash (income - expenses), separate from savings.
  const balance = totalIncomeAllTime - totalExpensesAllTime;

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
        allTransactions,
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
        savings,
        getSpentByCategory,

        customCategories,
        addCategory,
        updateCategory,
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
