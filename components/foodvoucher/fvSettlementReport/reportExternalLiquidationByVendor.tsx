import React, { useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReportSettlementHeader } from './reportSettlementHeader';
import { ReportSettlementFooter } from './reportSettlementFooter';

interface ReportExternalLiquidationByVendorProps {
    liquidations: any[];
    userName: string;
    startDate?: string;
    endDate?: string;
}

export function ReportExternalLiquidationByVendor({ liquidations, userName, startDate, endDate }: ReportExternalLiquidationByVendorProps) {
    const aggregatedData = useMemo(() => {
        const vendorAgg: Record<string, { vendorName: string, market: string, totalVouchers: number, totalAmount: number }> = {};

        liquidations.forEach(l => {
            if (l.settlements) {
                l.settlements.forEach((s: any) => {
                    const key = `${s.vendorName || 'Unknown'}-${s.market || ''}`;
                    if (!vendorAgg[key]) {
                        vendorAgg[key] = {
                            vendorName: s.vendorName || 'Unknown',
                            market: s.market || '',
                            totalVouchers: 0,
                            totalAmount: 0
                        };
                    }
                    vendorAgg[key].totalAmount += Number(s.totalAmount) || 0;
                    vendorAgg[key].totalVouchers += Number(s.totalTransactions) || 0;
                });
            }
        });

        // Convert to array and sort by Market, then by Vendor Name
        return Object.values(vendorAgg).sort((a, b) => {
            const marketA = a.market || "";
            const marketB = b.market || "";
            const marketCompare = marketA.localeCompare(marketB);
            
            if (marketCompare !== 0) {
                return marketCompare;
            }
            
            return a.vendorName.localeCompare(b.vendorName);
        });
    }, [liquidations]);

    const grandTotalAmount = aggregatedData.reduce((sum, item) => sum + item.totalAmount, 0);

    const downloadAsPDF = () => {
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'letter'
        });

        const centerX = pdf.internal.pageSize.getWidth() / 2;
        let currentY = 15;

        // Header
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text("Republic of the Philippines", centerX, currentY, { align: "center" });
        currentY += 5;
        pdf.text("CITY GOVERNMENT OF TAGBILARAN", centerX, currentY, { align: "center" });
        currentY += 4;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.text("Tagbilaran City, Bohol, Philippines", centerX, currentY, { align: "center" });

        currentY += 12;
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.text("LIQUIDATION SUMMARY BY VENDOR", centerX, currentY, { align: "center" });

        if (startDate || endDate) {
            currentY += 6;
            pdf.setFontSize(9);
            pdf.setFont("helvetica", "italic");
            const period = `Period: ${startDate ? new Date(startDate).toLocaleDateString() : 'Start'} to ${endDate ? new Date(endDate).toLocaleDateString() : 'End'}`;
            pdf.text(period, centerX, currentY, { align: "center" });
        }

        currentY += 15;

        let pageTotal = 0;

        // Table
        const tableHeaders = [["#", "Vendor Name", "Market", "No. of Vouchers", "Total Amount"]];
        const tableRows = aggregatedData.map((item, idx) => {
            return [
                idx + 1,
                item.vendorName,
                item.market || '-',
                item.totalVouchers,
                item.totalAmount // Keep as raw number for calculation
            ];
        });

        autoTable(pdf, {
            head: tableHeaders,
            body: tableRows,
            startY: currentY,
            theme: 'grid',
            headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], halign: 'center' },
            styles: { fontSize: 8 },
            columnStyles: {
                0: { halign: 'center', cellWidth: 10 },
                1: { halign: 'left' },
                2: { halign: 'left' },
                3: { halign: 'center' },
                4: { halign: 'right' }
            },
            foot: [[
                { content: 'PAGE SUBTOTAL:', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
                { content: '', styles: { halign: 'right', fontStyle: 'bold' } }
            ]],
            showFoot: 'everyPage',
            willDrawPage: (data) => {
                pageTotal = 0;
            },
            didDrawCell: (data) => {
                if (data.section === 'body' && data.column.index === 4) {
                    pageTotal += Number(data.cell.raw);
                }
            },
            willDrawCell: (data) => {
                if (data.section === 'body' && data.column.index === 4) {
                    const val = Number(data.cell.raw);
                    data.cell.text = [`P${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`];
                }
                if (data.section === 'foot' && data.column.index === 4) {
                    data.cell.text = [`P${pageTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`];
                }
            }
        });

        const lastTable = (pdf as any).lastAutoTable;
        const columns = lastTable.columns;
        const colWidth1 = columns[0].width + columns[1].width + columns[2].width + columns[3].width;
        const colWidth2 = columns[4].width;

        autoTable(pdf, {
            body: [
                [
                    { content: 'GRAND TOTAL AMOUNT:', styles: { halign: 'right', fontStyle: 'bold' } },
                    { content: `P${grandTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, styles: { halign: 'right', fontStyle: 'bold', textColor: [200, 0, 0] } }
                ]
            ],
            startY: lastTable.finalY,
            theme: 'grid',
            styles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: colWidth1 },
                1: { cellWidth: colWidth2, halign: 'right' }
            }
        });

        const finalY = (pdf as any).lastAutoTable.finalY + 20;

        // Footer
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "italic");
        pdf.text("Prepared by:", 25, finalY);
        pdf.text("Approved by:", 135, finalY);

        pdf.setFont("helvetica", "bold");
        pdf.text(userName.toUpperCase(), 25, finalY + 12);
        pdf.text("HUBERT M. INAS, CPA, BCLTE", 135, finalY + 12);

        pdf.setLineWidth(0.2);
        pdf.line(20, finalY + 13, 80, finalY + 13);
        pdf.line(125, finalY + 13, 195, finalY + 13);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.text("Authorized Personnel / Staff", 50, finalY + 17, { align: "center" });
        pdf.text("City Treasurer", 160, finalY + 17, { align: "center" });

        pdf.save(`Vendor_Liquidation_Summary_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="w-full bg-white p-8 max-w-4xl mx-auto border shadow-sm my-4 print:shadow-none print:border-none print:m-0 print:p-0">
            <div className="flex justify-end mb-4 no-print">
                <button
                    onClick={downloadAsPDF}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-bold transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Download Vendor Summary to PDF
                </button>
            </div>
            <ReportSettlementHeader />
            <div className="text-center mb-8">
                <h2 className="text-xl font-black underline uppercase tracking-tight">Liquidation Summary by Vendor</h2>
                {(startDate || endDate) && (
                    <p className="text-xs font-bold text-slate-500 mt-1 italic">
                        Period: {startDate ? new Date(startDate).toLocaleDateString() : 'Start'} to {endDate ? new Date(endDate).toLocaleDateString() : 'End'}
                    </p>
                )}
            </div>

            <table className="w-full border-collapse border border-black text-xs">
                <thead>
                    <tr className="bg-gray-100 uppercase font-bold">
                        <th className="border border-black p-2 text-center w-12">#</th>
                        <th className="border border-black p-2 text-left">Vendor Name</th>
                        <th className="border border-black p-2 text-left">Market</th>
                        <th className="border border-black p-2 text-center">No. of Vouchers</th>
                        <th className="border border-black p-2 text-right">Total Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {aggregatedData.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                            <td className="border border-black p-2 text-center font-mono">{idx + 1}</td>
                            <td className="border border-black p-2 text-left font-bold">{item.vendorName}</td>
                            <td className="border border-black p-2 text-left">{item.market || '-'}</td>
                            <td className="border border-black p-2 text-center">{item.totalVouchers}</td>
                            <td className="border border-black p-2 text-right font-bold">
                                ₱{item.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                        </tr>
                    ))}
                    {aggregatedData.length === 0 && (
                        <tr>
                            <td colSpan={5} className="border border-black p-8 text-center text-slate-400 italic">
                                No vendor records found for the selected period.
                            </td>
                        </tr>
                    )}
                </tbody>
                <tfoot>
                    <tr className="bg-slate-50 font-black text-sm">
                        <td colSpan={4} className="border border-black p-3 text-right uppercase">Grand Total Amount:</td>
                        <td className="border border-black p-3 text-right text-red-700">
                            ₱{grandTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                    </tr>
                </tfoot>
            </table>

            <ReportSettlementFooter userName={userName} />
        </div>
    );
}
