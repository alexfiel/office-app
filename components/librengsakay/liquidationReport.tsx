"use client"

import React, { useState, useEffect } from 'react';
import { getLiquidationReport } from '@/lib/upload/librengsakay/liquidation';

export default function LiquidationReport({ routes }: { routes: any[] }) {
    const today = new Date().toISOString().split('T')[0];
    const [filters, setFilters] = useState({
        startDate: today,
        endDate: today,
        routeId: ''
    });
    const [reportData, setReportData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadReport = async () => {
        setIsLoading(true);
        try {
            const data = await getLiquidationReport(filters.startDate, filters.endDate, filters.routeId);
            setReportData(data);
        } catch (error) {
            console.error("Failed to load report:", error);
            alert("Error loading report data.");
        } finally {
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        loadReport();
    }, []);

    const totalPax = reportData.reduce((sum, item) => sum + item.numberofPax, 0);
    const totalAmount = reportData.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="space-y-6">
            {/* Report Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-white border rounded-2xl shadow-sm items-end">
                <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block tracking-wider">Start Date</label>
                    <input 
                        type="date" 
                        className="w-full border p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={filters.startDate}
                        onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                    />
                </div>
                <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block tracking-wider">End Date</label>
                    <input 
                        type="date" 
                        className="w-full border p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={filters.endDate}
                        onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                    />
                </div>
                <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block tracking-wider">Route</label>
                    <select 
                        className="w-full border p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={filters.routeId}
                        onChange={(e) => setFilters({...filters, routeId: e.target.value})}
                    >
                        <option value="">All Routes</option>
                        {routes.map(route => (
                            <option key={route.id} value={route.id}>{route.routeName}</option>
                        ))}
                    </select>
                </div>
                <button 
                    onClick={loadReport}
                    disabled={isLoading}
                    className="bg-blue-600 text-white rounded-xl py-2.5 font-bold text-sm hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                >
                    {isLoading ? "Generating..." : "Generate Report"}
                </button>
            </div>

            {/* Report Content */}
            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b">
                            <tr>
                                <th className="p-4 uppercase text-[10px] tracking-widest whitespace-nowrap">AR #</th>
                                <th className="p-4 uppercase text-[10px] tracking-widest whitespace-nowrap text-center">Departure</th>
                                <th className="p-4 uppercase text-[10px] tracking-widest whitespace-nowrap text-center">Paid Date</th>
                                <th className="p-4 uppercase text-[10px] tracking-widest whitespace-nowrap">Route</th>
                                <th className="p-4 uppercase text-[10px] tracking-widest whitespace-nowrap">Driver / Plate</th>
                                <th className="p-4 uppercase text-[10px] tracking-widest whitespace-nowrap text-right">Pax</th>
                                <th className="p-4 uppercase text-[10px] tracking-widest whitespace-nowrap text-right">Fare</th>
                                <th className="p-4 uppercase text-[10px] tracking-widest whitespace-nowrap text-right">Amount</th>
                                <th className="p-4 uppercase text-[10px] tracking-widest whitespace-nowrap">Prepared By</th>
                                <th className="p-4 uppercase text-[10px] tracking-widest whitespace-nowrap">Approved By</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {reportData.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="p-12 text-center text-slate-400 italic">No liquidation records found for the selected criteria.</td>
                                </tr>
                            ) : (
                                reportData.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 font-bold text-blue-700 font-mono text-xs">{item.arnumber}</td>
                                        <td className="p-4 text-center whitespace-nowrap text-slate-600">
                                            {new Date(item.departureDate).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-center whitespace-nowrap text-slate-600 font-medium">
                                            {new Date(item.paymentDate).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 font-medium text-slate-800">
                                            {item.trip.route.routeName}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-900">{item.driverName}</span>
                                                <span className="text-[10px] font-mono text-slate-400 capitalize">{item.vehiclePlateNumber}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right tabular-nums text-slate-800 font-medium">{item.numberofPax}</td>
                                        <td className="p-4 text-right tabular-nums text-slate-500">₱{item.fare.toLocaleString()}</td>
                                        <td className="p-4 text-right tabular-nums font-black text-slate-900">₱{item.amount.toLocaleString()}</td>
                                        <td className="p-4">
                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded uppercase">
                                                {item.preparedby}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 uppercase">
                                                {item.approvedby}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {reportData.length > 0 && (
                            <tfoot className="bg-slate-900 text-white font-bold border-t">
                                <tr>
                                    <td colSpan={5} className="p-4 text-right uppercase tracking-widest text-xs opacity-60">Report Totals</td>
                                    <td className="p-4 text-right tabular-nums text-lg border-x border-slate-800 tracking-tighter">{totalPax.toLocaleString()}</td>
                                    <td className="p-4 bg-slate-800/50"></td>
                                    <td className="p-4 text-right tabular-nums text-lg text-emerald-400 tracking-tighter">₱{totalAmount.toLocaleString()}</td>
                                    <td colSpan={2} className="p-4 bg-slate-800/50"></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}
