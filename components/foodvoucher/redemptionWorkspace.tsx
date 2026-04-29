"use client"

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createRedemptionClaim, getVouchers } from "@/lib/actions/foodvoucher";
import { HandCoins, Search, Plus, Trash2, Ticket } from "lucide-react";

export default function RedemptionWorkspace({ vendors, userId }: { vendors: any[], userId: string }) {
    const [availableVouchers, setAvailableVouchers] = useState<any[]>([]);
    const [selectedVouchers, setSelectedVouchers] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [vendorSearchTerm, setVendorSearchTerm] = useState('');
    const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
    const vendorDropdownRef = React.useRef<HTMLDivElement>(null);
    
    const [form, setForm] = useState({
        vendorId: '',
        redemptionCode: '',
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        const fetchAvailable = async () => {
            setIsLoadingVouchers(true);
            try {
                const all = await getVouchers();
                // Only show vouchers that haven't been redeemed
                setAvailableVouchers(all.filter((v: any) => !v.vendorId));
            } catch (error) {
                toast.error("Failed to fetch available vouchers");
            } finally {
                setIsLoadingVouchers(false);
            }
        };
        fetchAvailable();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target as Node)) {
                setIsVendorDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleVoucher = (voucher: any) => {
        if (selectedVouchers.find(v => v.id === voucher.id)) {
            setSelectedVouchers(selectedVouchers.filter(v => v.id !== voucher.id));
        } else {
            setSelectedVouchers([...selectedVouchers, voucher]);
        }
    };

    const totalAmount = selectedVouchers.reduce((sum, v) => sum + v.amount, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.vendorId || selectedVouchers.length === 0) {
            return toast.error("Please select a vendor and at least one voucher");
        }
        if (!form.redemptionCode.trim()) {
            return toast.error("Please enter a redemption code");
        }

        setIsSubmitting(true);
        try {
            await createRedemptionClaim({
                ...form,
                date: new Date(form.date),
                totalAmount,
                userId,
                voucherIds: selectedVouchers.map(v => v.id)
            });
            toast.success("Redemption claim created successfully");
            
            // Reset
            setSelectedVouchers([]);
            setForm({
                ...form,
                vendorId: '',
                redemptionCode: '',
                date: new Date().toISOString().split('T')[0]
            });
            setVendorSearchTerm('');
            
            // Refresh available
            const all = await getVouchers();
            setAvailableVouchers(all.filter((v: any) => !v.vendorId));
        } catch (error: any) {
            toast.error(error.message || "Failed to process redemption");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredAvailable = availableVouchers.filter(v => 
        v.voucherCode.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selectedVouchers.find(sv => sv.id === v.id)
    );

    const filteredVendors = vendors.filter(v => 
        v.vendorName.toLowerCase().includes(vendorSearchTerm.toLowerCase()) || 
        v.market.toLowerCase().includes(vendorSearchTerm.toLowerCase())
    );

    const handleSelectVendor = (vendorId: string, vendorName: string) => {
        setForm({ ...form, vendorId });
        setVendorSearchTerm(vendorName);
        setIsVendorDropdownOpen(false);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Voucher Selection */}
            <div className="space-y-4">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Ticket className="w-5 h-5 text-blue-600" />
                            Select Vouchers
                        </h2>
                        <span className="text-xs font-medium text-slate-500">{availableVouchers.length} Available</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white p-3 border rounded-xl shadow-sm">
                        <Search className="w-4 h-4 text-slate-400" />
                        <Input 
                            placeholder="Search by code..." 
                            className="border-none shadow-none focus-visible:ring-0 text-sm h-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="border rounded-xl bg-white shadow-sm overflow-hidden h-[500px] flex flex-col">
                    <div className="p-4 border-b bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-500 flex justify-between">
                        <span>Issued Vouchers</span>
                        <span>Amount</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {isLoadingVouchers ? (
                            <div className="flex items-center justify-center h-full text-slate-400 text-sm">Loading inventory...</div>
                        ) : filteredAvailable.map((v) => (
                            <button
                                key={v.id}
                                onClick={() => toggleVoucher(v)}
                                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <Plus className="w-3 h-3" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 font-mono text-sm">{v.voucherCode}</div>
                                        <div className="text-[10px] text-slate-400 uppercase">{new Date(v.date).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div className="font-black text-slate-700">₱{v.amount.toLocaleString()}</div>
                            </button>
                        ))}
                        {!isLoadingVouchers && filteredAvailable.length === 0 && (
                            <div className="text-center py-12 text-slate-400 italic text-sm">No vouchers match your search or inventory is empty.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Claim Processing */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <HandCoins className="w-5 h-5 text-emerald-600" />
                    Create Redemption Claim
                </h2>
                
                <div className="border rounded-xl p-6 bg-white shadow-sm space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Redemption Code</Label>
                            <Input 
                                value={form.redemptionCode} 
                                onChange={(e) => setForm({...form, redemptionCode: e.target.value})}
                                placeholder="Enter Redemption Code"
                                className="bg-white font-mono text-emerald-700 font-bold border-emerald-200 focus-visible:ring-emerald-500" 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Processing Date</Label>
                            <Input 
                                type="date" 
                                value={form.date}
                                onChange={(e) => setForm({...form, date: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-2 relative" ref={vendorDropdownRef}>
                        <Label>Select Vendor</Label>
                        <div className="relative">
                            <Input
                                placeholder="Type to search vendor..."
                                value={vendorSearchTerm}
                                onChange={(e) => {
                                    setVendorSearchTerm(e.target.value);
                                    setIsVendorDropdownOpen(true);
                                    if (form.vendorId) setForm({ ...form, vendorId: '' });
                                }}
                                onFocus={() => setIsVendorDropdownOpen(true)}
                                className="w-full bg-white shadow-sm border-slate-200"
                            />
                            {isVendorDropdownOpen && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                    {filteredVendors.length > 0 ? (
                                        filteredVendors.map((vendor: any) => (
                                            <div
                                                key={vendor.id}
                                                className={`px-4 py-2 cursor-pointer hover:bg-emerald-50 border-b last:border-0 transition-colors ${form.vendorId === vendor.id ? 'bg-emerald-50' : ''}`}
                                                onClick={() => handleSelectVendor(vendor.id, vendor.vendorName)}
                                            >
                                                <div className="font-bold text-sm text-slate-900">{vendor.vendorName}</div>
                                                <div className="text-[10px] text-slate-500 uppercase font-medium tracking-wider">{vendor.market}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-4 py-4 text-sm text-slate-400 text-center italic">No vendors found matching "{vendorSearchTerm}"</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="flex justify-between">
                            <span>Vouchers in Claim</span>
                            <span className="text-blue-600 font-bold">{selectedVouchers.length} selected</span>
                        </Label>
                        <div className="border rounded-lg min-h-[150px] max-h-[250px] overflow-y-auto bg-slate-50/50 p-2 space-y-2">
                            {selectedVouchers.map(v => (
                                <div key={v.id} className="flex items-center justify-between p-2 bg-white border rounded-md shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="text-xs font-mono font-bold text-slate-900">{v.voucherCode}</div>
                                        <div className="text-[10px] text-slate-400">₱{v.amount}</div>
                                    </div>
                                    <button 
                                        onClick={() => toggleVoucher(v)}
                                        className="text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                            {selectedVouchers.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
                                    <Ticket className="w-6 h-6 opacity-20" />
                                    <span className="text-xs italic text-center px-4">Click vouchers from the list on the left to add them to this claim.</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-slate-500 font-medium">Claim Total Amount:</span>
                            <span className="text-3xl font-black text-slate-900">₱{totalAmount.toLocaleString()}</span>
                        </div>
                        <Button 
                            className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base font-bold shadow-lg"
                            disabled={isSubmitting || selectedVouchers.length === 0 || !form.vendorId}
                            onClick={handleSubmit}
                        >
                            {isSubmitting ? "Processing Claim..." : "Confirm Redemption Claim"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
