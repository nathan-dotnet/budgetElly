import { Button } from "@/components/ui/button";
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
import { TransactionType } from "@/lib/finance";
import { ArrowDownLeft, ArrowUpRight, Plus, Settings, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
  "🐾",
  "🎨",
  "🔧",
  "💡",
  "🍕",
  "📦",
];

export function AddTransactionForm() {
  const {
    addTransaction,
    getCategories,
    customCategories,
    addCategory,
    deleteCategory,
  } = useFinance();
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<TransactionType>("expense");
  const [newCatIcon, setNewCatIcon] = useState("📌");
  const handleAddCategory = async () => {
    if (!newCatName.trim()) {
      toast.error("Enter a category name");
      return;
    }
    await addCategory(newCatName.trim(), newCatType, newCatIcon);
    toast.success("Category added!");
    setNewCatName("");
    setNewCatIcon("📌");
  };

  const categories = getCategories(type);

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
                    <div className="flex gap-2">
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
                    <Button
                      type="button"
                      onClick={handleAddCategory}
                      size="sm"
                      className="w-full gap-1.5"
                    >
                      <Plus className="h-4 w-4" /> Add Category
                    </Button>
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
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => {
                const custom = customCategories.find(
                  (cc) => cc.name === c && cc.type === type,
                );
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
          {type === "income" ? "Income" : "Expense"}
        </Button>
      </form>
    </div>
  );
}
