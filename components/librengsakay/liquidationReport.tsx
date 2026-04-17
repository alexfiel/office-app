"use client"

import React, { useState, useEffect } from 'react';
import { getLiquidationReport, updateLiquidation } from '@/lib/upload/librengsakay/liquidation';
import { Report } from './reports/report';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LiquidationReport({ routes, userName }: { routes: any[], userName: string }) {
    const { data: session } = useSession();
    const today = new Date().toISOString().split('T')[0];
    const [filters, setFilters] = useState({
        startDate: today,
        endDate: today,
        routeId: ''
    });
    const [reportData, setReportData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showPrintView, setShowPrintView] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    // Edit State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingLiquidation, setEditingLiquidation] = useState<any>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editForm, setEditForm] = useState({
        arnumber: '',
        driverName: '',
        vehiclePlateNumber: '',
        numberofPax: 0,
        fare: 0,
        amount: 0,
        departureDate: '',
        paymentDate: ''
    });

    const handleEditClick = (item: any) => {
        setEditingLiquidation(item);
        setEditForm({
            arnumber: item.arnumber,
            driverName: item.driverName,
            vehiclePlateNumber: item.vehiclePlateNumber,
            numberofPax: item.numberofPax,
            fare: item.fare,
            amount: item.amount,
            departureDate: new Date(item.departureDate).toISOString().split('T')[0],
            paymentDate: new Date(item.paymentDate).toISOString().split('T')[0]
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateSubmit = async () => {
        if (!editingLiquidation || !session?.user?.id) return;
        setIsUpdating(true);
        try {
            const role = (session.user as any).role || "USER";
            await updateLiquidation(editingLiquidation.id, editForm, session.user.id, role);
            toast.success("Liquidation updated successfully");
            setIsEditModalOpen(false);
            loadReport();
        } catch (error: any) {
            toast.error(error.message || "Failed to update liquidation");
        } finally {
            setIsUpdating(false);
        }
    };

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

    const downloadAsCSV = () => {
        if (reportData.length === 0) return;

        const headers = ["AR #", "Departure Date", "Payment Date", "Route", "Driver", "Plate Number", "Pax", "Fare", "Amount", "Prepared By", "Approved By"];
        const rows = reportData.map(item => [
            item.arnumber,
            new Date(item.departureDate).toLocaleDateString(),
            new Date(item.paymentDate).toLocaleDateString(),
            item.trip.route.routeName,
            item.driverName,
            item.vehiclePlateNumber,
            item.numberofPax,
            item.fare,
            item.amount,
            item.preparedby,
            item.approvedby
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Liquidation_Report_${filters.startDate}_to_${filters.endDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadAsPDF = async () => {
        const reportElement = document.getElementById('pdf-report-content');
        if (!reportElement) return;

        setIsGeneratingPdf(true);
        try {
            // Force a standard desktop width for the capture so it never gets squashed on small screens
            const targetWidth = Math.max(reportElement.scrollWidth, 1000);

            const imgData = await toPng(reportElement, {
                pixelRatio: 2,
                backgroundColor: '#ffffff',
                cacheBust: true,
                width: targetWidth,
                style: {
                    width: `${targetWidth}px`,
                    transform: 'none'
                }
            });

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const padding = 10; // 10mm margins
            const maxContentWidth = pdfWidth - (padding * 2);
            
            const img = new Image();
            img.src = imgData;
            await new Promise((resolve) => { img.onload = resolve; });

            // Calculate dimensions to fit exactly within margins
            const imgWidth = maxContentWidth;
            const imgHeight = (img.height * imgWidth) / img.width;
            
            // Center element exactly
            const xOffset = (pdfWidth - imgWidth) / 2;
            
            let heightLeft = imgHeight;
            let position = padding;

            // First page
            pdf.addImage(imgData, 'PNG', xOffset, position, imgWidth, imgHeight);
            heightLeft -= (pdfHeight - (padding * 2));

            // Support for incredibly long reports spanning multiple pages
            while (heightLeft > 0) {
                position = heightLeft - imgHeight + padding;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', xOffset, position, imgWidth, imgHeight);
                heightLeft -= (pdfHeight - (padding * 2));
            }
            
            const startDateStr = filters.startDate ? filters.startDate.split('T')[0] : 'start';
            const endDateStr = filters.endDate ? filters.endDate.split('T')[0] : 'end';
            pdf.save(`Liquidation_Report_${startDateStr}_to_${endDateStr}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please check console for details.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const totalPax = reportData.reduce((sum, item) => sum + item.numberofPax, 0);
    const totalAmount = reportData.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="space-y-6">
            {/* Report Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-5 bg-white border rounded-2xl shadow-sm items-end">
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
                    className="bg-blue-600 text-white rounded-xl py-2.5 font-bold text-sm hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    {isLoading ? "Generating..." : "Generate Report"}
                </button>
                <button 
                    onClick={downloadAsCSV}
                    disabled={isLoading || reportData.length === 0}
                    className="bg-emerald-600 text-white rounded-xl py-2.5 font-bold text-sm hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    CSV Export
                </button>
                <button 
                    onClick={() => setShowPrintView(true)}
                    disabled={isLoading || reportData.length === 0}
                    className="bg-slate-800 text-white rounded-xl py-2.5 font-bold text-sm hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Print Report
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
                                <th className="p-4 uppercase text-[10px] tracking-widest whitespace-nowrap text-center">Action</th>
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
                                        <td className="p-4 text-center">
                                            {(item.userId === session?.user?.id || (session?.user as any)?.role === "ADMIN") && (
                                                <button
                                                    onClick={() => handleEditClick(item)}
                                                    className="text-[10px] text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 font-bold px-3 py-1.5 rounded border border-blue-200 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                            )}
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
                                    <td colSpan={3} className="p-4 bg-slate-800/50"></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* Official Print Preview Overlay */}
            {showPrintView && (
                <div className="fixed inset-0 z-[100] bg-white overflow-y-auto print:static print:bg-transparent">
                    <div className="sticky top-0 right-0 p-4 flex justify-end gap-4 bg-slate-900/10 backdrop-blur-md print:hidden">
                        <button 
                            onClick={downloadAsPDF}
                            disabled={isGeneratingPdf}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:active:scale-100"
                        >
                            {isGeneratingPdf ? (
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            )}
                            {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}
                        </button>
                        <button 
                            onClick={() => setShowPrintView(false)}
                            className="bg-white text-slate-900 border border-slate-200 px-6 py-2 rounded-lg font-bold hover:bg-slate-50 transition-all active:scale-95"
                        >
                            Close Preview
                        </button>
                    </div>
                    <div className="min-h-screen py-8 bg-slate-100 flex items-start justify-center print:bg-white print:py-0">
                        {/* We give the report container a fixed minimum width so html-to-image never captures a squashed version */}
                        <div id="pdf-report-content" className="bg-white p-12 shadow-2xl w-[1000px] max-w-none print:shadow-none print:p-0 print:w-full">
                            <Report 
                                routeName={routes.find(r => r.id === filters.routeId)?.routeName || "Summarized Report"} 
                                data={reportData} 
                                userName={userName}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Liquidation Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Liquidation</DialogTitle>
                        <DialogDescription>
                            Update the liquidation details below.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>AR Number</Label>
                                <Input
                                    value={editForm.arnumber}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, arnumber: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Plate Number</Label>
                                <Input
                                    value={editForm.vehiclePlateNumber}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, vehiclePlateNumber: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Driver Name</Label>
                            <Input
                                value={editForm.driverName}
                                onChange={(e) => setEditForm(prev => ({ ...prev, driverName: e.target.value }))}
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Departure Date</Label>
                                <Input
                                    type="date"
                                    value={editForm.departureDate}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, departureDate: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Payment Date</Label>
                                <Input
                                    type="date"
                                    value={editForm.paymentDate}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 border p-3 rounded-lg bg-slate-50">
                            <div className="space-y-2">
                                <Label>Pax</Label>
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
                                        const fare = Number(e.target.value);
                                        setEditForm(prev => ({ 
                                            ...prev, 
                                            fare: fare,
                                            amount: prev.numberofPax * fare 
                                        }));
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Total (₱)</Label>
                                <Input
                                    type="number"
                                    value={editForm.amount || ""}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleUpdateSubmit}
                            disabled={isUpdating || !editForm.driverName || !editForm.arnumber}
                        >
                            {isUpdating ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
