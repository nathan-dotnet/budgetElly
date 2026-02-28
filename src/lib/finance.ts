export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note?: string;
  date: Date;
}

export interface Budget {
  category: string;
  limit: number;
}

export const EXPENSE_CATEGORIES = [
  "Groceries",
  "Entertainment",
  "Bills",
  "Transport",
  "Dining",
  "Shopping",
  "Health",
  "Education",
  "Other",
] as const;

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Investment",
  "Gift",
  "Other",
] as const;

export function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    Groceries: "🛒",
    Entertainment: "🎬",
    Bills: "📄",
    Transport: "🚗",
    Dining: "🍽️",
    Shopping: "🛍️",
    Health: "💊",
    Education: "📚",
    Salary: "💼",
    Freelance: "💻",
    Investment: "📈",
    Gift: "🎁",
    Other: "📌",
  };
  return icons[category] || "📌";
}
