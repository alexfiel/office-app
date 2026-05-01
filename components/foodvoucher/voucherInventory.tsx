"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { addVoucher, bulkAddVouchers } from "@/lib/actions/foodvoucher";
import { Ticket, Plus, Search, Upload } from "lucide-react";
import Papa from "papaparse";
import { useRouter } from "next/navigation";

export default function VoucherInventory({ vouchers: initialVouchers, userId }: { vouchers: any[], userId: string }) {
    const [vouchers, setVouchers] = useState(initialVouchers);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [form, setForm] = useState({
        voucherCode: '',
        amount: '',
        date: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.voucherCode || !form.amount) return toast.error("Please fill in required fields");

        setIsSubmitting(true);
        try {
            const newVoucher = await addVoucher({ 
                ...form, 
                amount: parseFloat(form.amount), 
                date: new Date(form.date),
                userId 
            });
            setVouchers([newVoucher, ...vouchers]);
            setForm({ ...form, voucherCode: '', amount: '' });
            toast.success("Voucher added to inventory");
        } catch (error) {
            toast.error("Failed to add voucher");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsSubmitting(true);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const validData = results.data
                        .filter((row: any) => row.voucherCode && row.amount && row.date)
                        .map((row: any) => ({
                            voucherCode: row.voucherCode,
                            amount: parseFloat(row.amount),
                            date: new Date(row.date),
                            userId
                        }))
                        .filter((row: any) => !isNaN(row.amount) && !isNaN(row.date.getTime()));
                    
                    if (validData.length === 0) {
                        toast.error("No valid voucher data found in CSV. Ensure 'voucherCode', 'amount', and 'date' columns exist.");
                        return;
                    }

                    const count = await bulkAddVouchers(validData);
                    toast.success(`Successfully added ${count} vouchers`);
                    router.refresh();
                    if (fileInputRef.current) fileInputRef.current.value = "";
                } catch (error) {
                    toast.error("Failed to upload vouchers");
                } finally {
                    setIsSubmitting(false);
                }
            },
            error: (error) => {
                toast.error("Error parsing CSV file");
                setIsSubmitting(false);
            }
        });
    };

    const filteredVouchers = vouchers.filter(v => 
        v.voucherCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                <div className="border rounded-xl p-6 bg-white shadow-sm sticky top-24">
                    <div className="flex items-center gap-2 mb-4 text-blue-600">
                        <Plus className="w-5 h-5" />
                        <h2 className="text-lg font-bold">New Voucher Entry</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Voucher Code</Label>
                            <Input 
                                placeholder="e.g. FV-2024-0001" 
                                value={form.voucherCode}
                                onChange={(e) => setForm({...form, voucherCode: e.target.value})}
                                className="font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Amount (₱)</Label>
                            <Input 
                                type="number" 
                                placeholder="0.00" 
                                value={form.amount}
                                onChange={(e) => setForm({...form, amount: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Date Issued</Label>
                            <Input 
                                type="date" 
                                value={form.date}
                                onChange={(e) => setForm({...form, date: e.target.value})}
                            />
                        </div>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                            {isSubmitting ? "Processing..." : "Add to Inventory"}
                        </Button>
                    </form>

                    <div className="mt-6 border-t pt-6">
                        <div className="flex items-center gap-2 mb-4 text-blue-600">
                            <Upload className="w-5 h-5" />
                            <h2 className="text-sm font-bold uppercase tracking-wider">Bulk Upload CSV</h2>
                        </div>
                        <input 
                            type="file" 
                            accept=".csv" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                        />
                        <Button 
                            variant="outline" 
                            className="w-full" 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Uploading..." : "Upload CSV File"}
                        </Button>
                        <p className="text-[10px] text-slate-400 mt-2 text-center">Required columns: voucherCode, amount, date.</p>
                    </div>
                </div>
            </div>

            <div className="md:col-span-2 space-y-4">
                <div className="flex items-center gap-4 bg-white p-4 border rounded-xl shadow-sm">
                    <Search className="w-5 h-5 text-slate-400" />
                    <Input 
                        placeholder="Search voucher code..." 
                        className="border-none shadow-none focus-visible:ring-0"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
                    <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Ticket className="w-4 h-4 text-slate-500" />
                            <span className="font-bold text-slate-700 uppercase tracking-wider text-xs">Voucher Inventory</span>
                        </div>
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {filteredVouchers.length} Total
                        </span>
                    </div>
                    <div className="overflow-x-auto max-h-[600px]">
                        <table className="w-full text-left text-sm">
                            <thead className="sticky top-0 z-10">
                                <tr className="border-b bg-slate-50">
                                    <th className="p-4 font-bold text-slate-500 text-[10px] uppercase tracking-widest">Code</th>
                                    <th className="p-4 font-bold text-slate-500 text-[10px] uppercase tracking-widest text-right">Amount</th>
                                    <th className="p-4 font-bold text-slate-500 text-[10px] uppercase tracking-widest text-center">Issued Date</th>
                                    <th className="p-4 font-bold text-slate-500 text-[10px] uppercase tracking-widest text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredVouchers.map((v) => (
                                    <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 font-bold text-slate-900 font-mono">{v.voucherCode}</td>
                                        <td className="p-4 text-right font-black text-slate-800">₱{v.amount.toLocaleString()}</td>
                                        <td className="p-4 text-center text-slate-600" suppressHydrationWarning>{new Date(v.date).toLocaleDateString()}</td>
                                        <td className="p-4 text-right">
                                            {v.vendorId ? (
                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 uppercase">Redeemed</span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 uppercase">Issued</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filteredVouchers.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-12 text-center text-slate-400 italic">No vouchers found.</td>
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
