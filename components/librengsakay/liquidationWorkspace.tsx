"use client"

import React, { useState } from 'react';
import { getPendingTrips, saveLiquidations, checkArNumberExists } from '@/lib/upload/librengsakay/liquidation';

export default function LiquidationWorkspace({ routes, userId, userName }: any){
    const [filter, setFilter] = useState({ routeId: '', startDate: '', endDate: '' });
    const [trips, setTrips] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkLoading, setIsBulkLoading] = useState(false);
    const [editingTrips, setEditingTrips] = useState<any[] | null>(null);

    const loadTrips = async () => {
        if (filter.routeId && filter.startDate && filter.endDate) {
            const data = await getPendingTrips(filter.routeId, filter.startDate, filter.endDate);
            setTrips(data);
            setSelectedIds([]); // Reset selection on new search
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(trips.map(t => t.id));
        } else {
            setSelectedIds([]);
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const commonData = {
            arnumber: formData.get('arnumber') as string,
            approvedby: formData.get('approvedBy') as string,
            paymentDate: formData.get('paymentDate') as string,
            preparedby: userName || (formData.get('preparedBy') as string),
        };

        const payloads = (editingTrips || []).map(trip => ({
            ...trip,
            tripId: trip.id,
            ...commonData,
        }));

        setIsBulkLoading(true);
        try {
            const exists = await checkArNumberExists(commonData.arnumber);
            if (exists) {
                alert(`AR Number ${commonData.arnumber} already exists. Please use a different AR Number.`);
                setIsBulkLoading(false);
                return;
            }

            await saveLiquidations(payloads, userId);
            setEditingTrips(null);
            setSelectedIds([]);
            loadTrips();
            alert(`Successfully liquidated ${payloads.length} trips.`);
        } catch (error) {
            console.error("Bulk liquidation error:", error);
            alert("Error during bulk liquidation.");
        } finally {
            setIsBulkLoading(false);
        }
    };

    const openBulkModal = () => {
        const selectedTrips = trips.filter(t => selectedIds.includes(t.id));
        setEditingTrips(selectedTrips);
    };

    const updatePax = (tripId: string, newPax: number) => {
        if (!editingTrips) return;
        setEditingTrips(prev => prev?.map(trip => {
            if (trip.id === tripId) {
                return {
                    ...trip,
                    numberofPax: newPax,
                    amount: newPax * trip.fare
                };
            }
            return trip;
        }) || null);
    };

    const totalPax = editingTrips?.reduce((sum, t) => sum + t.numberofPax, 0) || 0;
    const totalAmount = editingTrips?.reduce((sum, t) => sum + t.amount, 0) || 0;

    return (
        <div className="space-y-6">
            {/* 1. Filters */}
            <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-xl border items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block tracking-wider">Target Route</label>
                    <select
                        className="w-full border p-2.5 rounded-lg text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => setFilter({ ...filter, routeId: e.target.value })}
                        value={filter.routeId}
                    >
                        <option value="">-- Select Route --</option>
                        {routes.map((r: any) => <option key={r.id} value={r.id}>{r.routeName}</option>)}
                    </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block tracking-wider">Trip Date Begin</label>
                    <input
                        type="date"
                        className="w-full border p-2.5 rounded-lg text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                        value={filter.startDate}
                    />
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block tracking-wider">Trip Date End</label>
                    <input
                        type="date"
                        className="w-full border p-2.5 rounded-lg text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                        value={filter.endDate}
                    />
                </div>
                <button
                    onClick={loadTrips}
                    className="h-[42px] bg-slate-800 text-white px-8 rounded-lg text-sm font-bold hover:bg-slate-900 transition-all disabled:opacity-50"
                    disabled={!filter.routeId || !filter.startDate || !filter.endDate}
                >
                    Search Trips
                </button>
            </div>

            {/* 2. Bulk Action Toolbar */}
            {selectedIds.length > 0 && (
                <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-100 rounded-xl animate-in fade-in slide-in-from-top-4">
                    <span className="text-sm font-semibold text-blue-700">
                        {selectedIds.length} Trip{selectedIds.length > 1 ? 's' : ''} Selected
                    </span>
                    <button
                        onClick={openBulkModal}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md active:scale-95 transition-all"
                    >
                        Liquidate Batch
                    </button>
                </div>
            )}

            {/* 3. Pending Trips Table */}
            <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-bold border-b">
                        <tr>
                            <th className="p-4 w-10">
                                <input 
                                    type="checkbox" 
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    onChange={handleSelectAll}
                                    checked={trips.length > 0 && selectedIds.length === trips.length}
                                />
                            </th>
                            <th className="p-4 uppercase text-[11px] tracking-wider">Driver</th>
                            <th className="p-4 uppercase text-[11px] tracking-wider">Trip Date</th>
                            <th className="p-4 uppercase text-[11px] tracking-wider">Plate Number</th>
                            <th className="p-4 uppercase text-[11px] tracking-wider text-right">Pax</th>
                            <th className="p-4 uppercase text-[11px] tracking-wider text-right">Estimated Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {trips.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-12 text-center text-gray-400">
                                    <p className="font-medium">No pending trips found.</p>
                                    <p className="text-xs">Select a route and date above to see trips awaiting liquidation.</p>
                                </td>
                            </tr>
                        )}
                        {trips.map((trip) => (
                            <tr key={trip.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(trip.id) ? 'bg-blue-50/30' : ''}`}>
                                <td className="p-4 text-center">
                                    <input 
                                        type="checkbox" 
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        checked={selectedIds.includes(trip.id)}
                                        onChange={() => toggleSelect(trip.id)}
                                    />
                                </td>
                                <td className="p-4 font-medium text-gray-900">{trip.driverName}</td>
                                <td className="p-4 text-gray-600 whitespace-nowrap">{new Date(trip.departureDate).toLocaleDateString()}</td>
                                <td className="p-4 font-mono text-gray-500 text-xs">{trip.vehiclePlateNumber}</td>
                                <td className="p-4 text-right text-gray-600">{trip.numberofPax}</td>
                                <td className="p-4 font-bold text-right text-gray-800">₱{trip.amount.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 4. Liquidation Modal */}
            {editingTrips && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
                    <form onSubmit={handleBulkSave} className="bg-white rounded-2xl p-8 w-full max-w-xl shadow-2xl space-y-6 animate-in zoom-in-95">
                        <div className="border-b pb-4">
                            <h2 className="text-2xl font-black text-gray-900">Batch Liquidation</h2>
                            <p className="text-sm text-gray-500">Processing {editingTrips.length} selected trip logs</p>
                        </div>

                        <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div>
                                <label className="text-[10px] font-bold uppercase text-slate-400 block tracking-widest">Aggregate Pax</label>
                                <p className="text-xl font-bold text-slate-800">{totalPax.toLocaleString()}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-slate-400 block tracking-widest">Total Amount</label>
                                <p className="text-xl font-bold text-blue-600">₱{totalAmount.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Editable Trip List */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase text-gray-400 block tracking-widest px-1">Adjust Trip Details</label>
                            <div className="max-h-52 overflow-y-auto space-y-2.5 pr-2 custom-scrollbar">
                                {editingTrips.map((trip) => (
                                    <div key={trip.id} className="flex items-center justify-between gap-4 p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-gray-900 truncate">{trip.driverName}</p>
                                            <p className="text-[10px] text-gray-500 font-mono tracking-tight">{trip.vehiclePlateNumber}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-20">
                                                <label className="text-[8px] uppercase font-black text-gray-400 block mb-1">Pax</label>
                                                <input 
                                                    type="number"
                                                    min="0"
                                                    value={trip.numberofPax}
                                                    onChange={(e) => updatePax(trip.id, parseInt(e.target.value) || 0)}
                                                    className="w-full border bg-gray-50 rounded-lg py-1 px-2 text-sm font-bold text-center focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all"
                                                />
                                            </div>
                                            <div className="text-right min-w-[70px]">
                                                <label className="text-[8px] uppercase font-black text-gray-400 block mb-1">Amount</label>
                                                <p className="text-sm font-bold text-blue-600">₱{trip.amount.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700">AR Number</label>
                                <input name="arnumber" placeholder="AR-2026-XXXX" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700">Date Paid (on AR)</label>
                                <input name="paymentDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" required />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-700">Approved By</label>
                            <input name="approvedBy" placeholder="Officer Name" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" required />
                        </div>

                        {!userName && (
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700">Prepared By</label>
                                <input name="preparedBy" placeholder="Your Full Name" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" required />
                            </div>
                        )}

                        <div className="flex gap-4 pt-6">
                            <button 
                                type="button" 
                                onClick={() => setEditingTrips(null)} 
                                className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all"
                                disabled={isBulkLoading}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-[0.98] transition-all disabled:opacity-50"
                                disabled={isBulkLoading}
                            >
                                {isBulkLoading ? "Processing..." : "Confirm & Liquidate"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
