"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { deleteCollection, editCollection } from "@/lib/actions/collections";
import { getCollectionCategories } from "@/lib/actions/cashier";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CollectionTableActions({ collection }: { collection: any }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Edit state
  const [editDate, setEditDate] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategoryId, setNewCategoryId] = useState<string>("");

  useEffect(() => {
    if (isEditing) {
      setEditDate(new Date(collection.date).toISOString().split("T")[0]);
      setItems(collection.collectionItems.map((ci: any) => ({
        categoryId: ci.collectionCategoryId,
        categoryName: ci.collectionCategory?.name || ci.collectionCategoryId,
        amount: Number(ci.amount),
      })));
      fetchCategories();
    }
  }, [isEditing, collection]);

  const fetchCategories = async () => {
    const res = await getCollectionCategories();
    if (res.success) {
      setCategories(res.data || []);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete collection ${collection.controlNo}?`)) return;
    setIsDeleting(true);
    const res = await deleteCollection(collection.id);
    if (res.success) {
      toast.success("Collection deleted successfully.");
    } else {
      toast.error(res.error || "Failed to delete collection.");
    }
    setIsDeleting(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    const result = await editCollection(collection.id, {
      date: new Date(editDate),
      items: items.map(i => ({
        categoryId: i.categoryId,
        amount: Number(i.amount),
      })),
    });

    if (result.success) {
      toast.success("Collection updated successfully.");
      setIsEditing(false);
    } else {
      toast.error(result.error || "Failed to update collection.");
    }
    setIsUpdating(false);
  };

  const handleItemAmountChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index].amount = value;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleAddItem = () => {
    if (!newCategoryId) return;
    const existing = items.find(i => i.categoryId === newCategoryId);
    if (existing) {
      toast.error("Category already in the list.");
      return;
    }
    const cat = categories.find(c => c.id === newCategoryId);
    setItems([
      ...items,
      {
        categoryId: newCategoryId,
        categoryName: cat ? `${cat.name} (${cat.code})` : newCategoryId,
        amount: 0,
      }
    ]);
    setNewCategoryId("");
  };

  const computedTotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isDeleting}>
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Record
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600 focus:bg-red-50">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Record
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Collection {collection.controlNo}</DialogTitle>
            <DialogDescription>
              Admin override for collection records.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-date">Date</Label>
              <Input 
                id="edit-date" 
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Items Breakdown</Label>
              <div className="bg-muted/20 p-2 rounded-md space-y-2 max-h-60 overflow-y-auto">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="flex-1 text-sm font-medium truncate" title={item.categoryName}>
                      {item.categoryName}
                    </span>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      className="w-32 h-8"
                      value={item.amount}
                      onChange={(e) => handleItemAmountChange(index, e.target.value)}
                      required
                    />
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleRemoveItem(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="text-sm text-muted-foreground italic p-2">No items. Add one below.</p>
                )}
              </div>
            </div>

            <div className="flex items-end gap-2 bg-muted/10 p-2 rounded-md">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Add Category</Label>
                <Select value={newCategoryId} onValueChange={setNewCategoryId}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" size="sm" variant="secondary" onClick={handleAddItem}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <span className="font-semibold text-sm">Total Amount:</span>
              <span className="font-bold text-lg text-primary">
                ₱{computedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button type="submit" disabled={isUpdating || items.length === 0}>{isUpdating ? "Saving..." : "Save Overrides"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
