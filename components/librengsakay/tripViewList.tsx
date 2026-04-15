"use client"

import React, { useState, useEffect } from 'react';
import { getTripLogs } from '@/lib/upload/librengsakay/liquidation';

export default function TripViewList() {
    const [trips, setTrips] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredTrips = trips.filter(trip => 
        trip.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.vehiclePlateNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
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
                                            ₱{trip.amount.toLocaleString()}
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
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
