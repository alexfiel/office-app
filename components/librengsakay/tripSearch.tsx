"use client"

import React, { useState } from 'react';
import { searchTrips } from '@/lib/upload/librengsakay/liquidation';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function TripSearch({ routes, userName }: { routes: any[], userName: string }) {
    const [filters, setFilters] = useState({
        driverName: '',
        plateNumber: '',
        routeId: '',
        status: 'ALL' as 'ALL' | 'PENDING' | 'LIQUIDATED',
        tripDate: '',
        paymentDate: '',
        arNumber: ''
    });
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const handleSearch = async () => {
        setIsLoading(true);
        try {
            const data = await searchTrips(filters);
            setResults(data);
        } catch (error) {
            console.error("Search error:", error);
            alert("Error searching trips.");
        } finally {
            setIsLoading(false);
        }
    };



    const downloadAsPDF = async () => {
        if (results.length === 0) {
            alert("No results to print.");
            return;
        }
        
        setIsGeneratingPdf(true);
        try {
            const FOLIO_WIDTH = 215.9;
            const FOLIO_HEIGHT = 330.2;
            const M = 6.35; 
            
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: [FOLIO_WIDTH, FOLIO_HEIGHT]
            });

            // 1. Draw Header
            const centerX = FOLIO_WIDTH / 2;
            let currentY = M + 15;
            
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(0);
            pdf.setFontSize(14);
            pdf.text("Republic of the Philippines", centerX, currentY, { align: "center" });
            
            currentY += 6;
            pdf.text("CITY GOVERNMENT OF TAGBILARAN", centerX, currentY, { align: "center" });
            
            currentY += 6;
            pdf.setFontSize(10);
            pdf.text("Tagbilaran City, Bohol, Philippines", centerX, currentY, { align: "center" });
            
            currentY += 12;
            pdf.setFontSize(16);
            pdf.setFont("helvetica", "bold");
            pdf.text("LIBRENG SAKAY PROGRAM", centerX, currentY, { align: "center" });
            
            currentY += 8;
            pdf.setFontSize(11);
            
            let dateRangeText = "SEARCH RESULTS";
            if (filters.tripDate) {
                dateRangeText = `TRIP DATE: ${new Date(filters.tripDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
            } else if (filters.paymentDate) {
                dateRangeText = `PAYMENT DATE: ${new Date(filters.paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
            }
            
            pdf.text(dateRangeText.toUpperCase(), centerX, currentY, { align: "center" });
            
            currentY += 15; 
            const hHeight = currentY;

            // Pre-calculate Total and Count per AR (only for liquidated)
            // For non-liquidated, we treat them as individual items or just don't group them.
            const arTotals: Record<string, { total: number, count: number, items: any[] }> = {};
            results.forEach(trip => {
                const liq = trip.liquidations && trip.liquidations.length > 0 ? trip.liquidations[0] : null;
                const k = liq?.arnumber ? liq.arnumber : `trip-${trip.id}`;
                if (!arTotals[k]) {
                    arTotals[k] = { total: 0, count: 0, items: [] };
                }
                arTotals[k].total += trip.amount;
                arTotals[k].count += 1;
                arTotals[k].items.push({ ...trip, liquidation: liq });
            });
            
            const sortedData = Object.values(arTotals).flatMap(group => group.items);
            const seenArs = new Set<string>();

            // 2. Prepare Table Data
            const headers = [["#", "AR #", "Operation Date", "Payment Date", "Route", "Driver", "Plate Number", "Pax", "Fare", "Amount", "Total"]];
            const rows = sortedData.map((item, index) => {
                const liq = item.liquidation;
                const k = liq?.arnumber ? liq.arnumber : `trip-${item.id}`;
                const row: any[] = [
                    index + 1,
                    liq?.arnumber || "-",
                    item.departureDate ? new Date(item.departureDate).toLocaleDateString() : "-",
                    liq?.paymentDate ? new Date(liq.paymentDate).toLocaleDateString() : "-",
                    item.route?.routeName || "Unknown Route",
                    item.driverName || "-",
                    item.vehiclePlateNumber || "-",
                    item.numberofPax || 0,
                    item.fare || 0,
                    item.amount || 0
                ];

                if (!seenArs.has(k)) {
                    seenArs.add(k);
                    const arInfo = arTotals[k];
                    row.push({
                        content: arInfo.total,
                        rowSpan: arInfo.count,
                        styles: { valign: 'middle', halign: 'right' }
                    });
                }
                
                return row;
            });

            // 3. Generate Table
            autoTable(pdf, {
                head: headers,
                body: rows,
                startY: hHeight + 5,
                margin: { top: 15, right: M, bottom: 30, left: M },
                theme: 'grid',
                styles: { fontSize: 7, cellPadding: 1 },
                didParseCell: (data) => {
                    if (data.section === 'body' && (data.column.index === 8 || data.column.index === 9 || data.column.index === 10)) {
                        let rawStr = typeof data.cell.raw === 'object' && data.cell.raw !== null && 'content' in data.cell.raw ? String((data.cell.raw as any).content).replace(/,/g, '') : String(data.cell.raw).replace(/,/g, '');
                        if (rawStr && rawStr !== "") {
                            data.cell.text = [`P${(parseFloat(rawStr) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`];
                        } else {
                            data.cell.text = [""];
                        }
                    }
                },
            });

            // 4. Draw Grand Total Below Table
            let finalY = (pdf as any).lastAutoTable.finalY + 10;
            const grandTotalValue = results.reduce((sum, item) => sum + item.amount, 0);
            const totalPaxValue = results.reduce((sum, item) => sum + (Number(item.numberofPax) || 0), 0);
            
            const liquidatedTotal = results
                .filter(trip => trip.liquidations && trip.liquidations.length > 0)
                .reduce((sum, trip) => sum + trip.amount, 0);
            const pendingTotal = results
                .filter(trip => !trip.liquidations || trip.liquidations.length === 0)
                .reduce((sum, trip) => sum + trip.amount, 0);

            pdf.setFontSize(9);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(0);
            
            pdf.text(`TOTAL TRANSACTIONS: ${results.length}`, M + 5, finalY);
            pdf.text(`TOTAL PAX: ${totalPaxValue}`, M + 5, finalY + 5);

            pdf.setFontSize(8);
            pdf.setFont("helvetica", "normal");
            pdf.text(`LIQUIDATED AMOUNT: P${liquidatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, FOLIO_WIDTH - M - 5, finalY, { align: 'right' });
            pdf.text(`PENDING AMOUNT: P${pendingTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, FOLIO_WIDTH - M - 5, finalY + 5, { align: 'right' });

            pdf.setFontSize(10);
            pdf.setFont("helvetica", "bold");
            pdf.text(`GRAND TOTAL: P${grandTotalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, FOLIO_WIDTH - M - 5, finalY + 12, { align: 'right' });

            finalY += 25; 
            const footerHeight = 35; 
            if (finalY + footerHeight > FOLIO_HEIGHT - M) {
                pdf.addPage([FOLIO_WIDTH, FOLIO_HEIGHT], 'p');
                finalY = 20;
            }

            pdf.setFontSize(8);
            pdf.setFont("helvetica", "italic");
            pdf.setTextColor(100);
            const leftX = M + 15;
            const rightX = FOLIO_WIDTH / 2 + 15;

            pdf.text("Prepared by:", leftX, finalY);
            pdf.text("Approved by:", rightX, finalY);

            finalY += 12; 

            pdf.setFontSize(9);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(0);

            const preparedByName = userName.toUpperCase();
            pdf.text(preparedByName, leftX + 25, finalY, { align: "center" });

            const approvedByName = "HUBERT M. INAS, CPA, BCLTE";
            pdf.text(approvedByName, rightX + 25, finalY, { align: "center" });

            pdf.setLineWidth(0.3);
            pdf.setDrawColor(0);
            pdf.line(leftX, finalY + 2, leftX + 50, finalY + 2);
            pdf.line(rightX - 5, finalY + 2, rightX + 55, finalY + 2);

            finalY += 6; 

            pdf.setFontSize(8);
            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(100);
            pdf.text("Authorized Personnel / Staff", leftX + 25, finalY, { align: "center" });
            pdf.text("City Treasurer", rightX + 25, finalY, { align: "center" });

            pdf.save(`Search_Results_Liquidation.pdf`);
        } catch (error: any) {
            console.error("PDF Export Error:", error);
            alert(`Error generating PDF.`);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Search Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 p-5 bg-white border rounded-2xl shadow-sm items-end">
                <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block tracking-wider">Driver Name</label>
                    <input
                        type="text"
                        placeholder="Search driver..."
                        className="w-full border p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={filters.driverName}
                        onChange={(e) => setFilters({ ...filters, driverName: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block tracking-wider">Plate Number</label>
                    <input
                        type="text"
                        placeholder="Search plate..."
                        className="w-full border p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={filters.plateNumber}
                        onChange={(e) => setFilters({ ...filters, plateNumber: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block tracking-wider">Route</label>
                    <select
                        className="w-full border p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={filters.routeId}
                        onChange={(e) => setFilters({ ...filters, routeId: e.target.value })}
                    >
                        <option value="">All Routes</option>
                        {routes.map(route => (
                            <option key={route.id} value={route.id}>{route.routeName}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block tracking-wider">Status</label>
                    <select
                        className="w-full border p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                    >
                        <option value="ALL">All</option>
                        <option value="PENDING">Pending</option>
                        <option value="LIQUIDATED">Liquidated</option>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block tracking-wider">Trip Date</label>
                    <input
                        type="date"
                        className="w-full border p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={filters.tripDate}
                        onChange={(e) => setFilters({ ...filters, tripDate: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block tracking-wider">Payment Date</label>
                    <input
                        type="date"
                        className="w-full border p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={filters.paymentDate}
                        onChange={(e) => setFilters({ ...filters, paymentDate: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block tracking-wider">AR Number</label>
                    <input
                        type="text"
                        placeholder="Search AR..."
                        className="w-full border p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={filters.arNumber}
                        onChange={(e) => setFilters({ ...filters, arNumber: e.target.value })}
                    />
                </div>
                <div className="md:col-span-4 lg:col-span-7 flex justify-end gap-3">
                    <button
                        onClick={handleSearch}
                        disabled={isLoading}
                        className="bg-blue-600 text-white rounded-xl py-2.5 px-6 font-bold text-sm hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? "Searching..." : "Search Trips"}
                    </button>
                    {results.length > 0 && (
                        <button
                            onClick={downloadAsPDF}
                            disabled={isGeneratingPdf}
                            className="bg-slate-800 text-white rounded-xl py-2.5 px-6 font-bold text-sm hover:bg-slate-900 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            {isGeneratingPdf ? "Generating..." : "Print Results"}
                        </button>
                    )}
                </div>
            </div>

            {/* Results Table */}
            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b">
                            <tr>
                                <th className="p-4 uppercase text-[10px] tracking-widest whitespace-nowrap">Departure</th>
                                <th className="p-4 uppercase text-[10px] tracking-widest whitespace-nowrap">Driver</th>
                                <th className="p-4 uppercase text-[10px] tracking-widest whitespace-nowrap">Plate No</th>
                                <th className="p-4 uppercase text-[10px] tracking-widest whitespace-nowrap">Route</th>
                                <th className="p-4 uppercase text-[10px] tracking-widest whitespace-nowrap text-right">Amount</th>
                                <th className="p-4 uppercase text-[10px] tracking-widest whitespace-nowrap text-center">Status</th>
                                <th className="p-4 uppercase text-[10px] tracking-widest whitespace-nowrap text-center">Payment Date</th>
                                <th className="p-4 uppercase text-[10px] tracking-widest whitespace-nowrap text-center">AR Number</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {results.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-slate-400 italic">No trips found matching criteria.</td>
                                </tr>
                            ) : (
                                results.map((trip) => {
                                    const isLiquidated = trip.liquidations && trip.liquidations.length > 0;
                                    return (
                                        <tr 
                                            key={trip.id} 
                                            className={`transition-colors ${isLiquidated ? 'hover:bg-blue-50' : 'hover:bg-slate-50'}`}
                                        >
                                            <td className="p-4 text-slate-600 whitespace-nowrap">{new Date(trip.departureDate).toLocaleDateString()}</td>
                                            <td className="p-4 font-semibold text-slate-900">{trip.driverName}</td>
                                            <td className="p-4 font-mono text-xs text-slate-500">{trip.vehiclePlateNumber}</td>
                                            <td className="p-4 font-medium text-slate-800">{trip.route?.routeName}</td>
                                            <td className="p-4 text-right tabular-nums font-bold text-slate-900">₱{trip.amount.toLocaleString()}</td>
                                            <td className="p-4 text-center">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${isLiquidated ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' : 'text-amber-600 bg-amber-50 border border-amber-100'}`}>
                                                    {isLiquidated ? 'Liquidated' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center text-slate-600 whitespace-nowrap">
                                                {isLiquidated && trip.liquidations[0].paymentDate ? new Date(trip.liquidations[0].paymentDate).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="p-4 text-center font-mono text-xs text-slate-500">
                                                {isLiquidated ? trip.liquidations[0].arnumber : '-'}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>


        </div>
    );
}
