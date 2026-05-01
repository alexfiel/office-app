import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReportSettlementHeader } from './reportSettlementHeader';
import { ReportSettlementFooter } from './reportSettlementFooter';

interface ReportExternalLiquidationProps {
    liquidation: any;
    userName: string;
}

export function ReportExternalLiquidation({ liquidation, userName }: ReportExternalLiquidationProps) {
    if (!liquidation) return null;

    const downloadAsPDF = () => {
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'letter' // 8.5 x 11 inches
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
        pdf.text("FOOD VOUCHER LIQUIDATION", centerX, currentY, { align: "center" });

        pdf.setLineWidth(0.5);
        pdf.line(centerX - 40, currentY + 1, centerX + 40, currentY + 1);

        currentY += 15;
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "italic");
        pdf.text(`Liquidation No: `, 15, currentY);
        pdf.setFont("helvetica", "bold");
        pdf.text(liquidation.liquidationNo, 40, currentY);

        pdf.setFont("helvetica", "italic");
        pdf.text(`Date: `, 150, currentY);
        pdf.setFont("helvetica", "bold");
        pdf.text(new Date(liquidation.createdAt).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }), 162, currentY);

        currentY += 10;

        // Table
        const tableHeaders = [["#", "AR Number", "Batch No.", "Vendor Name", "Amount"]];
        const tableRows = liquidation.settlements.map((s: any, idx: number) => [
            idx + 1,
            s.arNo,
            s.batchNo,
            s.vendorName,
            `P${s.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
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
                4: { halign: 'right' }
            },
            foot: [[
                { content: 'GRAND TOTAL:', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
                { content: `P${liquidation.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, styles: { halign: 'right', fontStyle: 'bold', textColor: [200, 0, 0] } }
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

        pdf.save(`Liquidation_${liquidation.liquidationNo}.pdf`);
    };

    return (
        <div className="w-full bg-white p-8 max-w-4xl mx-auto border shadow-sm my-4 print:shadow-none print:border-none print:m-0 print:p-0">
            <div className="flex justify-end mb-4 no-print">
                <button
                    onClick={downloadAsPDF}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-bold transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Export to PDF
                </button>
            </div>
            <ReportSettlementHeader />
            <div className="text-center mb-8">
                <h2 className="text-xl font-black underline uppercase">External Food Voucher Liquidation</h2>
            </div>

            <div className="mb-4 flex justify-between text-sm italic">
                <p>Liquidation No: <span className="font-bold not-italic underline font-mono">{liquidation.liquidationNo}</span></p>
                <p>Date: <span className="font-bold not-italic">{new Date(liquidation.createdAt).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</span></p>
            </div>

            <table className="w-full border-collapse border border-black text-xs">
                <thead>
                    <tr className="bg-gray-100 uppercase font-bold">
                        <th className="border border-black p-2 text-center w-12">#</th>
                        <th className="border border-black p-2 text-center">AR Number</th>
                        <th className="border border-black p-2 text-center">Batch No.</th>
                        <th className="border border-black p-2 text-left">Vendor Name</th>
                        <th className="border border-black p-2 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {liquidation.settlements?.map((s: any, idx: number) => (
                        <tr key={s.id} className="hover:bg-gray-50">
                            <td className="border border-black p-2 text-center font-mono">{idx + 1}</td>
                            <td className="border border-black p-2 text-center font-mono font-bold">{s.arNo}</td>
                            <td className="border border-black p-2 text-center font-mono">{s.batchNo}</td>
                            <td className="border border-black p-2 font-medium">{s.vendorName}</td>
                            <td className="border border-black p-2 text-right font-bold">₱{s.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="bg-slate-50 font-black text-sm">
                        <td colSpan={4} className="border border-black p-3 text-right uppercase">Grand Total:</td>
                        <td className="border border-black p-3 text-right text-red-700">
                            ₱{liquidation.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                    </tr>
                </tfoot>
            </table>

            <ReportSettlementFooter userName={userName || liquidation.user?.name} />
        </div>
    );
}
