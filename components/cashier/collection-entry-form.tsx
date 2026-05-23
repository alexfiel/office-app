"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { getCollectionCategories } from "@/lib/actions/cashier";
import { createCollection } from "@/lib/actions/collections";

const collectionSchema = z.object({
  date: z.string().nonempty("Date is required"),
  items: z.array(z.object({
    categoryId: z.string(),
    categoryName: z.string(),
    amount: z.coerce.number().positive("Amount must be a positive number").max(1000000000, "Amount exceeds maximum allowed value (1 Billion)"),
  })).min(1, "At least one category must be selected"),
});

type CollectionFormValues = z.infer<typeof collectionSchema>;

export function CollectionEntryForm({ onSuccess }: { onSuccess?: () => void }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionSchema) as any,
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      items: [],
    },
  });

  const { fields, replace } = useFieldArray({
    control,
    name: "items",
  });

  const formValues = watch();

  useEffect(() => {
    async function loadCategories() {
      const res = await getCollectionCategories();
      if (res.success) {
        setCategories(res.data || []);
      }
    }
    loadCategories();
  }, []);

  const handleCategoryToggle = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedCategoryIds([...selectedCategoryIds, id]);
    } else {
      setSelectedCategoryIds(selectedCategoryIds.filter((catId) => catId !== id));
    }
  };

  const handleNextStep = () => {
    if (selectedCategoryIds.length === 0) {
      toast.error("Please select at least one category.");
      return;
    }

    // Populate the field array with the selected categories
    const newItems = selectedCategoryIds.map((id) => {
      const existingItem = formValues.items?.find((item) => item.categoryId === id);
      const cat = categories.find((c) => c.id === id);
      return {
        categoryId: id,
        categoryName: cat ? `${cat.name} (${cat.code})` : id,
        amount: existingItem ? existingItem.amount : 0,
      };
    });
    
    replace(newItems);
    setStep(2);
  };

  const onSubmitReview = () => {
    setIsConfirming(true);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);

    const result = await createCollection({
      date: new Date(formValues.date),
      items: formValues.items.map(item => ({
        categoryId: item.categoryId,
        amount: Number(item.amount),
      })),
    });

    if (result.success) {
      toast.success(`Collection recorded: ${result.data?.controlNo}`);
      reset({
        date: new Date().toISOString().split("T")[0],
        items: [],
      });
      setSelectedCategoryIds([]);
      setStep(1);
      setIsConfirming(false);
      if (onSuccess) onSuccess();
    } else {
      toast.error(result.error || "Failed to record collection.");
    }
    setIsSubmitting(false);
  };

  const computedTotal = formValues.items?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Record Collection</CardTitle>
        <CardDescription>
          {step === 1 ? "Step 1: Select applicable collection categories." : "Step 2: Enter amounts for each selected category."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>

            <div className="space-y-3">
              <Label>Collection Categories</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border p-4 rounded-md max-h-80 overflow-y-auto bg-muted/20">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`cat-${cat.id}`} 
                      checked={selectedCategoryIds.includes(cat.id)}
                      onCheckedChange={(checked) => handleCategoryToggle(cat.id, checked as boolean)}
                    />
                    <Label htmlFor={`cat-${cat.id}`} className="font-normal cursor-pointer">
                      {cat.name} ({cat.code})
                    </Label>
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-full">No categories available. Please add them in Settings.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button type="button" onClick={handleNextStep}>Next: Enter Amounts</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit(onSubmitReview)} className="space-y-6">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 border p-4 rounded-md bg-muted/10">
                  <div className="flex-1 font-medium">
                    {field.categoryName}
                  </div>
                  <div className="w-full sm:w-1/3">
                    <Label className="sr-only" htmlFor={`items.${index}.amount`}>Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">₱</span>
                      <Input
                        id={`items.${index}.amount`}
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-8"
                        {...register(`items.${index}.amount`)}
                      />
                    </div>
                    {errors.items?.[index]?.amount && (
                      <p className="text-xs text-destructive mt-1">{errors.items[index]?.amount?.message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
              <div className="text-lg font-semibold text-primary">
                Total Amount: ₱{computedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button type="submit">Review & Submit</Button>
              </div>
            </div>
          </form>
        )}
      </CardContent>

      <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Collection Entry</DialogTitle>
            <DialogDescription>
              Please verify the breakdown below before saving.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-2 text-sm border-b pb-2">
              <span className="text-muted-foreground font-semibold">Date:</span>
              <span className="text-right">{format(new Date(formValues.date || new Date()), "PPP")}</span>
            </div>
            
            <div className="space-y-2">
              <span className="text-muted-foreground font-semibold text-sm">Breakdown:</span>
              {formValues.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="truncate pr-4">{item.categoryName}</span>
                  <span className="font-medium whitespace-nowrap">
                    ₱{Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-muted-foreground font-semibold text-sm">Total Amount:</span>
              <span className="font-bold text-lg text-primary">
                ₱{computedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirming(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleFinalSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Confirm & Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
