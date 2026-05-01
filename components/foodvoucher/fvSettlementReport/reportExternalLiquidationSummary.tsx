import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReportSettlementHeader } from './reportSettlementHeader';
import { ReportSettlementFooter } from './reportSettlementFooter';

interface ReportExternalLiquidationSummaryProps {
    liquidations: any[];
    userName: string;
    startDate?: string;
    endDate?: string;
}

export function ReportExternalLiquidationSummary({ liquidations, userName, startDate, endDate }: ReportExternalLiquidationSummaryProps) {
    const totalAmount = liquidations.reduce((sum, l) => sum + l.totalAmount, 0);

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
        pdf.text("SUMMARY OF FOOD VOUCHER LIQUIDATIONS", centerX, currentY, { align: "center" });

        if (startDate || endDate) {
            currentY += 6;
            pdf.setFontSize(9);
            pdf.setFont("helvetica", "italic");
            const period = `Period: ${startDate ? new Date(startDate).toLocaleDateString() : 'Start'} to ${endDate ? new Date(endDate).toLocaleDateString() : 'End'}`;
            pdf.text(period, centerX, currentY, { align: "center" });
        }

        currentY += 15;

        // Table
        const tableHeaders = [["#", "Liquidation No.", "Date Processed", "No. of ARs", "Total Amount"]];
        const tableRows = liquidations.map((l, idx) => [
            idx + 1,
            l.liquidationNo,
            new Date(l.createdAt).toLocaleDateString(),
            l.settlements?.length || 0,
            `P${l.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
        ]);

        autoTable(pdf, {
            head: tableHeaders,
            body: tableRows,
            startY: currentY,
            theme: 'grid',
            headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], halign: 'center' },
            styles: { fontSize: 8 },
            columnStyles: {
                0: { halign: 'center', cellWidth: 10 },
                1: { halign: 'center' },
                2: { halign: 'center' },
                3: { halign: 'center' },
                4: { halign: 'right' }
            },
            foot: [[
                { content: 'TOTAL LIQUIDATED AMOUNT:', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
                { content: `P${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, styles: { halign: 'right', fontStyle: 'bold', textColor: [200, 0, 0] } }
            ]]
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

        pdf.save(`Liquidation_Summary_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="w-full bg-white p-8 max-w-4xl mx-auto border shadow-sm my-4 print:shadow-none print:border-none print:m-0 print:p-0">
            <div className="flex justify-end mb-4 no-print">
                <button
                    onClick={downloadAsPDF}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-bold transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Export Summary to PDF
                </button>
            </div>
            <ReportSettlementHeader />
            <div className="text-center mb-8">
                <h2 className="text-xl font-black underline uppercase tracking-tight">Summary of Food Voucher Liquidations</h2>
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
                        <th className="border border-black p-2 text-center">Liquidation No.</th>
                        <th className="border border-black p-2 text-center">Date Liquidated</th>
                        <th className="border border-black p-2 text-center">No. of ARs</th>
                        <th className="border border-black p-2 text-right">Total Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {liquidations.map((l, idx) => (
                        <tr key={l.id} className="hover:bg-gray-50">
                            <td className="border border-black p-2 text-center font-mono">{idx + 1}</td>
                            <td className="border border-black p-2 text-center font-mono font-black">{l.liquidationNo}</td>
                            <td className="border border-black p-2 text-center">
                                {new Date(l.createdAt).toLocaleDateString()}
                            </td>
                            <td className="border border-black p-2 text-center">
                                {l.settlements?.length || 0}
                            </td>
                            <td className="border border-black p-2 text-right font-bold">
                                ₱{l.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                        </tr>
                    ))}
                    {liquidations.length === 0 && (
                        <tr>
                            <td colSpan={5} className="border border-black p-8 text-center text-slate-400 italic">
                                No liquidation records found for the selected period.
                            </td>
                        </tr>
                    )}
                </tbody>
                <tfoot>
                    <tr className="bg-slate-50 font-black text-sm">
                        <td colSpan={4} className="border border-black p-3 text-right uppercase">Total Liquidated Amount:</td>
                        <td className="border border-black p-3 text-right text-red-700">
                            ₱{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                    </tr>
                </tfoot>
            </table>

            <ReportSettlementFooter userName={userName} />
        </div>
    );
}
