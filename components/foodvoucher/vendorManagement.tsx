"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { addVendor } from "@/lib/actions/foodvoucher";
import { Store, Plus } from "lucide-react";

export default function VendorManagement({ vendors: initialVendors, userId }: { vendors: any[], userId: string }) {
    const [vendors, setVendors] = useState(initialVendors);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({
        vendorName: '',
        market: '',
        stallNo: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.vendorName || !form.market) return toast.error("Please fill in required fields");

        setIsSubmitting(true);
        try {
            const newVendor = await addVendor({ ...form, userId });
            setVendors([newVendor, ...vendors]);
            setForm({ vendorName: '', market: '', stallNo: '' });
            toast.success("Vendor added successfully");
        } catch (error) {
            toast.error("Failed to add vendor");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                <div className="border rounded-xl p-6 bg-white shadow-sm sticky top-24">
                    <div className="flex items-center gap-2 mb-4 text-emerald-600">
                        <Plus className="w-5 h-5" />
                        <h2 className="text-lg font-bold">Register New Vendor</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Vendor Name / Business Name</Label>
                            <Input 
                                placeholder="e.g. John's Fruit Stand" 
                                value={form.vendorName}
                                onChange={(e) => setForm({...form, vendorName: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Market Location</Label>
                            <Input 
                                placeholder="e.g. Tagbilaran Central Market" 
                                value={form.market}
                                onChange={(e) => setForm({...form, market: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Stall Number</Label>
                            <Input 
                                placeholder="e.g. A-12" 
                                value={form.stallNo}
                                onChange={(e) => setForm({...form, stallNo: e.target.value})}
                            />
                        </div>
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
                            {isSubmitting ? "Adding..." : "Add Vendor"}
                        </Button>
                    </form>
                </div>
            </div>

            <div className="md:col-span-2">
                <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
                    <div className="p-4 border-b bg-slate-50 flex items-center gap-2">
                        <Store className="w-4 h-4 text-slate-500" />
                        <span className="font-bold text-slate-700 uppercase tracking-wider text-xs">Partner Vendors List</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b bg-slate-50/50">
                                    <th className="p-4 font-bold text-slate-500 text-[10px] uppercase tracking-widest">Vendor Name</th>
                                    <th className="p-4 font-bold text-slate-500 text-[10px] uppercase tracking-widest">Market</th>
                                    <th className="p-4 font-bold text-slate-500 text-[10px] uppercase tracking-widest">Stall No.</th>
                                    <th className="p-4 font-bold text-slate-500 text-[10px] uppercase tracking-widest">Registered</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {vendors.map((vendor) => (
                                    <tr key={vendor.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 font-bold text-slate-900">{vendor.vendorName}</td>
                                        <td className="p-4 text-slate-600">{vendor.market}</td>
                                        <td className="p-4 text-slate-600 font-mono text-xs">{vendor.stallNo || 'N/A'}</td>
                                        <td className="p-4 text-slate-400 text-xs">{new Date(vendor.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                                {vendors.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-12 text-center text-slate-400 italic">No vendors registered yet.</td>
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
