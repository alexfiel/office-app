"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { captureTransferTaxPayment } from "@/lib/actions/transfertax-actions";
import { Loader2, Receipt } from "lucide-react";

export function TransferTaxPaymentDialog({
    isOpen,
    onOpenChange,
    tax,
    onSuccess
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    tax: any;
    onSuccess: () => void;
}) {
    const [receiptNumber, setReceiptNumber] = useState("");
    const [amount, setAmount] = useState<string>("");
    const [paymentDate, setPaymentDate] = useState<string>("");
    const [modeOfPayment, setModeOfPayment] = useState<string>("Over the counter");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (tax && isOpen) {
            setAmount(tax.t_TotalAmountDue?.toString() || "");
            setReceiptNumber("");
            setPaymentDate(new Date().toISOString().split('T')[0]);
            setModeOfPayment("Over the counter");
        }
    }, [tax, isOpen]);

    const handleSubmit = async () => {
        if (!receiptNumber || !amount || !paymentDate || !modeOfPayment) {
            toast.error("Please fill in all payment details.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await captureTransferTaxPayment(
                tax.id,
                receiptNumber,
                parseFloat(amount),
                paymentDate,
                modeOfPayment
            );

            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(res.isRecomputed 
                    ? "Payment captured and tax was recomputed due to elapsed validity!" 
                    : "Payment captured successfully.");
                onOpenChange(false);
                onSuccess();
            }
        } catch (err) {
            toast.error("An error occurred capturing the payment.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-emerald-600" />
                        Capture Payment
                    </DialogTitle>
                    <DialogDescription>
                        Enter payment details for Control No. <span className="font-bold text-gray-900">{tax?.t_controlNumber}</span>. If the payment date exceeds the validity date, penalties will be recomputed automatically.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Receipt Number (OR No.)</Label>
                        <Input 
                            placeholder="Enter receipt or reference number" 
                            value={receiptNumber} 
                            onChange={(e) => setReceiptNumber(e.target.value)} 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Amount Paid (₱)</Label>
                        <Input 
                            type="number" 
                            step="0.01" 
                            value={amount} 
                            onChange={(e) => setAmount(e.target.value)} 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Date Paid</Label>
                        <Input 
                            type="date" 
                            value={paymentDate} 
                            onChange={(e) => setPaymentDate(e.target.value)} 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Mode of Payment</Label>
                        <Select value={modeOfPayment} onValueChange={setModeOfPayment}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select mode" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Over the counter">Over the counter</SelectItem>
                                <SelectItem value="Online">Online</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Confirm Payment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
