import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinance } from "@/context/FinanceContext";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type TransactionType,
} from "@/lib/finance";
import { ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function AddTransactionForm() {
  const { addTransaction } = useFinance();
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!category) {
      toast.error("Select a category");
      return;
    }
    addTransaction(type, parsed, category, note || undefined);
    toast.success(`${type === "income" ? "Income" : "Expense"} added!`);
    setAmount("");
    setCategory("");
    setNote("");
  };

  return (
    <div className="rounded-lg border bg-card p-5 animate-fade-in">
      <h3 className="font-heading font-semibold text-lg mb-4">
        Add Transaction
      </h3>
      <div className="flex gap-2 mb-4">
        <Button
          type="button"
          variant={type === "expense" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setType("expense");
            setCategory("");
          }}
          className="flex-1 gap-1.5"
        >
          <ArrowUpRight className="h-4 w-4" /> Expense
        </Button>
        <Button
          type="button"
          variant={type === "income" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setType("income");
            setCategory("");
          }}
          className="flex-1 gap-1.5"
        >
          <ArrowDownLeft className="h-4 w-4" /> Income
        </Button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="amount">Amount ($)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="note">Note (optional)</Label>
          <Input
            id="note"
            placeholder="What was this for?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={100}
          />
        </div>
        <Button type="submit" className="w-full gap-1.5">
          <Plus className="h-4 w-4" /> Add{" "}
          {type === "income" ? "Income" : "Expense"}
        </Button>
      </form>
    </div>
  );
}
