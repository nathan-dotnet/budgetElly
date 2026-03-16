import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { isSavingsCategory, TransactionType } from "@/lib/finance";
import { format } from "date-fns";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarIcon,
  Edit3,
  PiggyBank,
  Plus,
  Settings,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

const ICON_OPTIONS = [
  "📌",
  "🏠",
  "🎮",
  "🚌",
  "☕",
  "🎵",
  "📱",
  "🏋️",
  "✈️",
  "🔧",
  "💡",
  "🍕",
  "📦",
  "💙",
  "🛵",
  "♌",
  "♊",
];

export function AddTransactionForm() {
  const {
    addTransaction,
    getCategories,
    customCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useFinance();
  const [type, setType] = useState<TransactionType>("expense");
  const [isSavings, setIsSavings] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<TransactionType>("expense");
  const [newCatIcon, setNewCatIcon] = useState("📌");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );

  const resetCategoryForm = () => {
    setNewCatName("");
    setNewCatIcon("📌");
    setNewCatType("expense");
    setEditingCategoryId(null);
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) {
      toast.error("Enter a category name");
      return;
    }

    if (editingCategoryId) {
      await updateCategory(
        editingCategoryId,
        newCatName.trim(),
        newCatType,
        newCatIcon,
      );
      toast.success("Category updated!");
      resetCategoryForm();
      return;
    }

    await addCategory(newCatName.trim(), newCatType, newCatIcon);
    toast.success("Category added!");
    resetCategoryForm();
  };

  const categories = isSavings ? getCategories("savings") : getCategories(type);
  const savingsNames = isSavings ? new Set(categories) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    if (!date) {
      toast.error("Select a date");
      return;
    }

    const parsedDate = date;
    if (Number.isNaN(parsedDate.getTime())) {
      toast.error("Enter a valid date");
      return;
    }

    const effectiveCategory = category;
    if (!effectiveCategory) {
      toast.error("Select a category");
      return;
    }
    if (isSavings) {
      if (!savingsNames || savingsNames.size === 0) {
        toast.error("Add a savings category first (Manage Categories)");
        return;
      }
      if (!savingsNames.has(effectiveCategory)) {
        toast.error("Select a savings category");
        return;
      }
    }
    addTransaction(
      type,
      parsed,
      effectiveCategory,
      note || undefined,
      parsedDate,
    );
    toast.success(
      `${isSavings ? "Savings" : type === "income" ? "Income" : "Expense"} added!`,
    );
    setAmount("");
    setCategory("");
    setNote("");
    setDate(new Date());
  };

  return (
    <div className="rounded-lg border bg-card p-7 animate-fade-in">
      <h3 className="font-heading font-semibold text-lg mb-4">
        Add Transaction
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
        <Button
          type="button"
          variant={type === "expense" && !isSavings ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setType("expense");
            setIsSavings(false);
            setCategory("");
          }}
          className="flex-1 gap-1.5"
        >
          <ArrowUpRight className="h-4 w-4" /> Expense
        </Button>
        <Button
          type="button"
          variant={type === "income" && !isSavings ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setType("income");
            setIsSavings(false);
            setCategory("");
          }}
          className="flex-1 gap-1.5"
        >
          <ArrowDownLeft className="h-4 w-4" /> Income
        </Button>
        <Button
          type="button"
          variant={isSavings ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setType("income");
            setIsSavings(true);
            setCategory("");
          }}
          className="flex-1 gap-1.5"
        >
          <PiggyBank className="h-4 w-4" /> Savings
        </Button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="amount">Amount (₱)</Label>
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
          <Label>Date</Label>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between text-left font-normal"
              >
                <span className="truncate">
                  {date ? format(date, "PPP") : "Pick a date"}
                </span>
                <CalendarIcon className="h-4 w-4 text-foreground" />
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={setDate} />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label htmlFor="category">Category</Label>
            <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <Settings className="h-3 w-3" /> Manage
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Manage Categories</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        type="button"
                        variant={
                          newCatType === "expense" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setNewCatType("expense")}
                        className="flex-1"
                      >
                        Expense
                      </Button>
                      <Button
                        type="button"
                        variant={
                          newCatType === "income" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setNewCatType("income")}
                        className="flex-1"
                      >
                        Income
                      </Button>
                      <Button
                        type="button"
                        variant={
                          newCatType === "savings" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setNewCatType("savings")}
                        className="flex-1"
                      >
                        Savings
                      </Button>
                    </div>
                    <div>
                      <Label>Name</Label>
                      <Input
                        placeholder="Category name"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        maxLength={30}
                      />
                    </div>
                    <div>
                      <Label>Icon</Label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {ICON_OPTIONS.map((i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setNewCatIcon(i)}
                            className={`text-lg w-8 h-8 rounded-md flex items-center justify-center transition-colors ${newCatIcon === i ? "bg-primary/20 ring-2 ring-primary" : "bg-muted hover:bg-accent"}`}
                          >
                            {i}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={handleAddCategory}
                        size="sm"
                        className="flex-1 gap-1.5"
                      >
                        <Plus className="h-4 w-4" />
                        {editingCategoryId ? "Save changes" : "Add Category"}
                      </Button>
                      {editingCategoryId && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={resetCategoryForm}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                  {customCategories.length > 0 && (
                    <div className="border-t pt-3 space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Your Custom Categories
                      </p>
                      {customCategories.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between text-sm py-1.5 px-2 rounded-md bg-muted/50"
                        >
                          <span>
                            {c.icon} {c.name}{" "}
                            <span className="text-xs text-muted-foreground">
                              ({c.type})
                            </span>
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                setEditingCategoryId(c.id);
                                setNewCatName(c.name);
                                setNewCatType(c.type);
                                setNewCatIcon(c.icon);
                              }}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => deleteCategory(c.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isSavings ? "Select savings account" : "Select category"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => {
                const custom = customCategories.find((cc) => {
                  if (cc.name !== c) return false;
                  if (isSavings) {
                    return cc.type === "savings" || isSavingsCategory(cc.name);
                  }
                  return cc.type === type;
                });
                return (
                  <div key={c} className="relative flex items-center">
                    <SelectItem value={c} className="flex-1 pr-8">
                      {c}
                    </SelectItem>
                    {custom && (
                      <button
                        type="button"
                        className="absolute right-2 p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors z-10"
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          deleteCategory(custom.id);
                          if (category === c) setCategory("");
                          toast.success("Category deleted");
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
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
          {isSavings ? "Savings" : type === "income" ? "Income" : "Expense"}
        </Button>
      </form>
    </div>
  );
}
