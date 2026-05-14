"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createCashAdvanceVoucher, updateCashAdvanceStatus, updateCashAdvanceVoucher, deleteCashAdvanceVoucher } from "@/lib/actions/foodvoucher";
import { Plus, WalletCards, Search, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CashAdvanceWorkspace({ cashAdvances: initialCashAdvances, userId, isAdmin }: { cashAdvances: any[], userId: string, isAdmin?: boolean }) {
    const [cashAdvances, setCashAdvances] = useState(initialCashAdvances);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        referenceNumber: '',
        amount: '',
        payee: '',
        particulars: ''
    });

    const filteredCashAdvances = cashAdvances.filter(ca => 
        ca.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
        ca.payee.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleEdit = (ca: any) => {
        setEditingId(ca.id);
        setForm({
            referenceNumber: ca.referenceNumber,
            amount: ca.amount.toString(),
            payee: ca.payee,
            particulars: ca.particulars || ''
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this cash advance?")) return;
        try {
            await deleteCashAdvanceVoucher(id);
            setCashAdvances(cashAdvances.filter(ca => ca.id !== id));
            toast.success("Cash Advance Voucher deleted");
        } catch (error: any) {
            toast.error("Failed to delete Cash Advance Voucher");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.referenceNumber || !form.amount || !form.payee) {
            return toast.error("Please fill in required fields");
        }

        const amountNum = parseFloat(form.amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            return toast.error("Amount must be a positive number");
        }

        setIsSubmitting(true);
        try {
            if (editingId) {
                const updatedCA = await updateCashAdvanceVoucher(editingId, {
                    referenceNumber: form.referenceNumber,
                    amount: amountNum,
                    payee: form.payee,
                    particulars: form.particulars,
                });
                setCashAdvances(cashAdvances.map(ca => ca.id === editingId ? updatedCA : ca));
                setEditingId(null);
                setForm({ referenceNumber: '', amount: '', payee: '', particulars: '' });
                toast.success("Cash Advance Voucher updated successfully");
            } else {
                const newCA = await createCashAdvanceVoucher({ 
                    referenceNumber: form.referenceNumber,
                    amount: amountNum,
                    payee: form.payee,
                    particulars: form.particulars,
                    userId 
                });
                setCashAdvances([newCA, ...cashAdvances]);
                setForm({ referenceNumber: '', amount: '', payee: '', particulars: '' });
                toast.success("Cash Advance Voucher created successfully");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to process Cash Advance");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await updateCashAdvanceStatus(id, newStatus);
            setCashAdvances(cashAdvances.map(ca => ca.id === id ? { ...ca, status: newStatus } : ca));
            toast.success(`Status updated to ${newStatus}`);
        } catch (error: any) {
            toast.error("Failed to update status");
        }
    };

    const formatCurrency = (amount: any) => {
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(amount));
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Create Form */}
            <div className="md:col-span-1">
                <div className="border rounded-xl p-6 bg-white shadow-sm sticky top-24">
                    <div className="flex items-center gap-2 mb-4 text-indigo-600">
                        <Plus className="w-5 h-5" />
                        <h2 className="text-lg font-bold">{editingId ? "Update Cash Advance" : "Issue Cash Advance"}</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Reference Number</Label>
                            <Input 
                                placeholder="e.g. CA-2026-001" 
                                value={form.referenceNumber}
                                onChange={(e) => setForm({...form, referenceNumber: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Accountable Officer (Payee)</Label>
                            <Input 
                                placeholder="e.g. Jane Doe" 
                                value={form.payee}
                                onChange={(e) => setForm({...form, payee: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Amount</Label>
                            <Input 
                                type="number"
                                step="0.01"
                                placeholder="0.00" 
                                value={form.amount}
                                onChange={(e) => setForm({...form, amount: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Particulars (Optional)</Label>
                            <textarea 
                                className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Purpose of cash advance..." 
                                value={form.particulars}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({...form, particulars: e.target.value})}
                                rows={3}
                            />
                        </div>
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isSubmitting}>
                            {isSubmitting ? (editingId ? "Updating..." : "Creating...") : (editingId ? "Update Cash Advance" : "Create Cash Advance")}
                        </Button>
                        {editingId && (
                            <Button type="button" variant="outline" className="w-full" onClick={() => { setEditingId(null); setForm({ referenceNumber: '', amount: '', payee: '', particulars: '' }); }}>
                                Cancel Edit
                            </Button>
                        )}
                    </form>
                </div>
            </div>

            {/* List Table */}
            <div className="md:col-span-2">
                <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
                    <div className="p-4 border-b bg-slate-50 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <WalletCards className="w-4 h-4 text-slate-500" />
                            <span className="font-bold text-slate-700 uppercase tracking-wider text-xs">Cash Advance Ledger</span>
                        </div>
                        <div className="relative max-w-sm w-full">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                            <Input 
                                type="search"
                                placeholder="Search by Reference No. or Payee..."
                                className="pl-9 h-9 text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b bg-slate-50/50">
                                    <th className="p-4 font-bold text-slate-500 text-[10px] uppercase tracking-widest">Reference No.</th>
                                    <th className="p-4 font-bold text-slate-500 text-[10px] uppercase tracking-widest">Payee</th>
                                    <th className="p-4 font-bold text-slate-500 text-[10px] uppercase tracking-widest text-right">Amount</th>
                                    <th className="p-4 font-bold text-slate-500 text-[10px] uppercase tracking-widest text-right">Balance</th>
                                    <th className="p-4 font-bold text-slate-500 text-[10px] uppercase tracking-widest text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredCashAdvances.map((ca) => (
                                    <tr key={ca.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 font-bold text-slate-900">{ca.referenceNumber}</td>
                                        <td className="p-4 text-slate-600">{ca.payee}</td>
                                        <td className="p-4 text-right text-slate-600">{formatCurrency(ca.amount)}</td>
                                        <td className="p-4 text-right font-bold text-indigo-600">{formatCurrency(ca.balance)}</td>
                                        <td className="p-4 text-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className={`h-6 text-xs px-2 rounded-full font-medium ${
                                                            ca.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' :
                                                            ca.status === 'LIQUIDATED' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' :
                                                            'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                                        }`}
                                                    >
                                                        {ca.status}
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleStatusChange(ca.id, 'ACTIVE')}>
                                                        Mark as Active
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(ca.id, 'LIQUIDATED')}>
                                                        Mark as Liquidated
                                                    </DropdownMenuItem>
                                                    {isAdmin && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => handleEdit(ca)}>
                                                                <Pencil className="w-4 h-4 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700" onClick={() => handleDelete(ca.id)}>
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                                {filteredCashAdvances.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-slate-400 italic">No cash advances found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
