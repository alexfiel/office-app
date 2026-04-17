"use client"

import React, { useState, useEffect } from 'react';
import { getTripLogs, updateTripLog } from '@/lib/upload/librengsakay/liquidation';
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function TripViewList() {
    const { data: session } = useSession();
    const isAdmin = (session?.user as any)?.role === "ADMIN";
    const [trips, setTrips] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRoute, setFilterRoute] = useState('');
    const [filterDate, setFilterDate] = useState('');

    // Edit state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTrip, setEditingTrip] = useState<any>(null);
    const [editForm, setEditForm] = useState({ driverName: '', numberofPax: 0, fare: 0, amount: 0 });
    const [isUpdating, setIsUpdating] = useState(false);

    const handleEditClick = (trip: any) => {
        setEditingTrip(trip);
        setEditForm({
            driverName: trip.driverName,
            numberofPax: trip.numberofPax,
            fare: trip.fare,
            amount: trip.amount
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateSubmit = async () => {
        if (!editingTrip) return;
        setIsUpdating(true);
        try {
            await updateTripLog(editingTrip.id, editForm);
            toast.success("Trip updated successfully");
            setIsEditModalOpen(false);
            loadTrips(); // Reload after update
        } catch (error: any) {
            toast.error(error.message || "Failed to update trip");
        } finally {
            setIsUpdating(false);
        }
    };

    const loadTrips = async () => {
        setIsLoading(true);
        try {
            const data = await getTripLogs();
            setTrips(data);
        } catch (error) {
            console.error("Failed to load trip logs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadTrips();
    }, []);

    const filteredTrips = trips.filter(trip => {
        const matchesSearch = trip.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              trip.vehiclePlateNumber.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRoute = filterRoute ? trip.route?.routeName === filterRoute : true;
        
        // Correctly handle the date parsing (trip.departureDate could be a Date object instead of a string)
        const tripDateStr = new Date(trip.departureDate).toLocaleDateString('en-CA'); // Outputs 'YYYY-MM-DD'
        const matchesDate = filterDate ? tripDateStr === filterDate : true;
        
        return matchesSearch && matchesRoute && matchesDate;
    });

    const uniqueRoutes = Array.from(new Set(trips.map(t => t.route?.routeName).filter(Boolean)));

    // Calculate Stats
    const totalTrips = trips.length;
    const totalRevenue = trips.reduce((sum, trip) => sum + (trip.amount || 0), 0);
    const liquidatedCount = trips.filter(t => t.liquidations.length > 0).length;
    const progressPercent = totalTrips > 0 ? (liquidatedCount / totalTrips) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* STATS RIBBON */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-2xl shadow-sm text-white">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Trips Logged</p>
                    <div className="flex justify-between items-end mt-1">
                        <p className="text-3xl font-black">{totalTrips.toLocaleString()}</p>
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-2xl shadow-sm text-white">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Potential Disbursement (PHP)</p>
                    <div className="flex justify-between items-end mt-1">
                        <p className="text-3xl font-black italic">₱{totalRevenue.toLocaleString()}</p>
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Liquidation Progress</p>
                            <p className="text-3xl font-black text-slate-800 mt-1">{progressPercent.toFixed(1)}%</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                        <div
                            className="bg-blue-500 h-full transition-all duration-1000 ease-out"
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center bg-white p-4 border rounded-2xl shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Search Driver or Plate Number..."
                        className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center gap-3">
                    <select
                        className="px-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={filterRoute}
                        onChange={(e) => setFilterRoute(e.target.value)}
                    >
                        <option value="">All Routes</option>
                        {uniqueRoutes.map((route: any) => (
                            <option key={route} value={route}>{route}</option>
                        ))}
                    </select>

                    <input
                        type="date"
                        className="px-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    />
                </div>
                <button
                    onClick={loadTrips}
                    className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                >
                    <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>

            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b">
                        <tr>
                            <th className="p-4 uppercase text-[10px] tracking-widest">Date</th>
                            <th className="p-4 uppercase text-[10px] tracking-widest">Route</th>
                            <th className="p-4 uppercase text-[10px] tracking-widest">Driver / Vehicle</th>
                            <th className="p-4 uppercase text-[10px] tracking-widest text-right">Amount</th>
                            <th className="p-4 uppercase text-[10px] tracking-widest text-center">Status</th>
                            <th className="p-4 uppercase text-[10px] tracking-widest">Reference (AR)</th>
                            {isAdmin && <th className="p-4 uppercase text-[10px] tracking-widest text-center">Action</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading && filteredTrips.length === 0 ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={6} className="p-4 bg-slate-50/50 h-12"></td>
                                </tr>
                            ))
                        ) : filteredTrips.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-12 text-center text-slate-400 italic">No trips found.</td>
                            </tr>
                        ) : (
                            filteredTrips.map((trip) => {
                                const isLiquidated = trip.liquidations.length > 0;
                                const arNumber = isLiquidated ? trip.liquidations[0].arnumber : null;

                                return (
                                    <tr key={trip.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 text-slate-600 text-xs whitespace-nowrap">
                                            {new Date(trip.departureDate).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 font-medium text-slate-800">
                                            {trip.route.routeName}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-900">{trip.driverName}</span>
                                                <span className="text-[10px] font-mono text-slate-400">{trip.vehiclePlateNumber}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right font-black text-slate-900">
                                            ₱{trip.amount.toLocaleString()} <br/>
                                            <span className="text-[9px] font-normal text-slate-400">Pax: {trip.numberofPax} | Fare: ₱{trip.fare}</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            {isLiquidated ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-tighter shadow-sm border border-emerald-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                                                    Done
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-tighter shadow-sm border border-amber-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span>
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {arNumber ? (
                                                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                                                    {arNumber}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-slate-300 italic">No record</span>
                                            )}
                                        </td>
                                        {isAdmin && (
                                            <td className="p-4 text-center">
                                                {!isLiquidated && (
                                                    <button
                                                        onClick={() => handleEditClick(trip)}
                                                        className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Trip Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Trip Logs</DialogTitle>
                        <DialogDescription>
                            Update the selected trip's details. Liquidated trips cannot be modified.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Driver Name</Label>
                            <Input
                                value={editForm.driverName}
                                onChange={(e) => setEditForm(prev => ({ ...prev, driverName: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Number of Pax</Label>
                            <Input
                                type="number"
                                value={editForm.numberofPax || ""}
                                onChange={(e) => {
                                    const pax = Number(e.target.value);
                                    setEditForm(prev => ({ 
                                        ...prev, 
                                        numberofPax: pax,
                                        amount: pax * prev.fare 
                                    }));
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Fare (₱)</Label>
                            <Input
                                type="number"
                                value={editForm.fare || ""}
                                onChange={(e) => {
                                    const newFare = Number(e.target.value);
                                    setEditForm(prev => ({ 
                                        ...prev, 
                                        fare: newFare,
                                        amount: prev.numberofPax * newFare 
                                    }));
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Total Amount (₱)</Label>
                            <Input
                                type="number"
                                value={editForm.amount || ""}
                                onChange={(e) => setEditForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleUpdateSubmit}
                            disabled={isUpdating || !editForm.driverName}
                        >
                            {isUpdating ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
