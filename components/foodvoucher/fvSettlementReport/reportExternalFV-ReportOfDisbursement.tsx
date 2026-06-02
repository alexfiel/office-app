import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const reportExternalFVReportOfDisbursement = (report: any) => {
    if (!report) return;

    const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'letter'
    });

    const centerX = pdf.internal.pageSize.getWidth() / 2;
    let currentY = 15;

    // Header
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.text("LTO FORM 49", 15, currentY, { align: "left" });
    currentY += 5;
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
    pdf.text("REPORT OF DISBURSEMENT", centerX, currentY, { align: "center" });

    pdf.setLineWidth(0.5);
    pdf.line(centerX - 35, currentY + 1, centerX + 35, currentY + 1);

    currentY += 15;
    pdf.setFontSize(10);

    // Accountable Officer / Payee beside Control Number
    pdf.setFont("helvetica", "italic");
    pdf.text("Accountable Officer:", 15, currentY);
    pdf.setFont("helvetica", "bold");
    pdf.text(report.cashAdvanceVoucher?.payee || "N/A", 50, currentY);

    pdf.setFont("helvetica", "italic");
    pdf.text("Control No:", 145, currentY);
    pdf.setFont("helvetica", "bold");
    pdf.text(report.reportNumber, 168, currentY);

    currentY += 6;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text("Designation:", 15, currentY);

    currentY += 10;

    let pageTotal = 0;

    // Table Headers
    const tableHeaders = [["Liquidation No.", "Date", "No. of Vouchers", "Amount"]];

    // Aggregate by Liquidation No
    const liqMap = new Map();
    (report.details || []).forEach((d: any) => {
        const key = d.liquidationNo || "N/A";
        if (!liqMap.has(key)) {
            liqMap.set(key, {
                liquidationNo: d.liquidationNo,
                liquidationDate: d.liquidationDate,
                numberOfVouchers: 0,
                totalVoucherAmount: 0
            });
        }
        const item = liqMap.get(key);
        item.numberOfVouchers += (d.numberOfVouchers || 0);
        item.totalVoucherAmount += (d.totalVoucherAmount || d.amount || 0);
    });

    // Table Rows - Sorted by Liquidation No and Date
    const sortedDetails = Array.from(liqMap.values()).sort((a: any, b: any) => {
        const liqCompare = (a.liquidationNo || "").localeCompare(b.liquidationNo || "");
        if (liqCompare !== 0) return liqCompare;

        const dateA = a.liquidationDate ? new Date(a.liquidationDate).getTime() : 0;
        const dateB = b.liquidationDate ? new Date(b.liquidationDate).getTime() : 0;
        return dateA - dateB;
    });

    const tableRows = sortedDetails.map((d: any) => [
        d.liquidationNo || "N/A",
        d.liquidationDate ? new Date(d.liquidationDate).toLocaleDateString() : "N/A",
        d.numberOfVouchers,
        d.totalVoucherAmount
    ]);

    autoTable(pdf, {
        head: tableHeaders,
        body: tableRows,
        startY: currentY,
        theme: 'grid',
        headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], halign: 'center' },
        styles: { fontSize: 9 },
        columnStyles: {
            0: { halign: 'center', cellWidth: 50 },
            1: { halign: 'center', cellWidth: 40 },
            2: { halign: 'center', cellWidth: 40 },
            3: { halign: 'right', cellWidth: 50 }
        },
        foot: [[
            { content: 'PAGE SUBTOTAL:', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
            { content: '', styles: { halign: 'right', fontStyle: 'bold' } }
        ]],
        showFoot: 'everyPage',
        willDrawPage: (data) => {
            pageTotal = 0;
        },
        didDrawCell: (data) => {
            if (data.section === 'body' && data.column.index === 3) {
                pageTotal += Number(data.cell.raw);
            }
        },
        willDrawCell: (data) => {
            if (data.section === 'body' && data.column.index === 3) {
                const val = Number(data.cell.raw);
                data.cell.text = [`P${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`];
            }
            if (data.section === 'foot' && data.column.index === 3) {
                data.cell.text = [`P${pageTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`];
            }
        }
    });

    const lastTable = (pdf as any).lastAutoTable;

    autoTable(pdf, {
        body: [
            [
                { content: 'GRAND TOTAL:', styles: { halign: 'right', fontStyle: 'bold' } },
                { content: `P${report.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, styles: { halign: 'right', fontStyle: 'bold', textColor: [200, 0, 0] } }
            ]
        ],
        startY: lastTable.finalY,
        theme: 'grid',
        styles: { fontSize: 10 },
        columnStyles: {
            0: { cellWidth: 130 },
            1: { cellWidth: 50, halign: 'right' }
        }
    });

    const summaryY = (pdf as any).lastAutoTable.finalY + 8;

    autoTable(pdf, {
        body: [
            [
                { content: 'Amount of Cash Advance:', styles: { halign: 'left', fontStyle: 'normal' } },
                { content: `P${(report.cashAdvanceVoucher?.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, styles: { halign: 'right', fontStyle: 'bold' } }
            ],
            [
                { content: 'Total Amount Disbursed:', styles: { halign: 'left', fontStyle: 'normal' } },
                { content: `P${report.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, styles: { halign: 'right', fontStyle: 'bold' } }
            ],
            [
                { content: 'Return of Cash Advance per O.R. No. __________ dated: __________', styles: { halign: 'left', fontStyle: 'normal' } },
                { content: '____________________', styles: { halign: 'right' } }
            ],
            [
                { content: 'Remaining Cash Advance:', styles: { halign: 'right', fontStyle: 'bold' } },
                {
                    content: `P${((report.cashAdvanceVoucher?.amount || 0) - report.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                    styles: { halign: 'right', fontStyle: 'bold' }
                }
            ]
        ],
        startY: summaryY,
        theme: 'grid',
        styles: { fontSize: 10 },
        columnStyles: {
            0: { cellWidth: 130 },
            1: { cellWidth: 50, halign: 'right' }
        }
    });

    const finalY = (pdf as any).lastAutoTable.finalY + 15;

    // Footer Signatories
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "italic");
    pdf.text("Certified Correct:", 25, finalY);
    pdf.text("Received by:", 135, finalY);

    pdf.setFont("helvetica", "bold");
    pdf.text((report.cashAdvanceVoucher?.payee || "STAFF").toUpperCase(), 25, finalY + 12);
    pdf.text("", 135, finalY + 12);

    pdf.setLineWidth(0.2);
    pdf.line(20, finalY + 13, 85, finalY + 13);
    pdf.line(125, finalY + 13, 195, finalY + 13);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text("Accountable Officer / Staff", 52.5, finalY + 17, { align: "center" });
    pdf.text("Accounting Clerk / Staff", 160, finalY + 17, { align: "center" });

    pdf.save(`ROD_${report.reportNumber}_Disbursement.pdf`);
};
