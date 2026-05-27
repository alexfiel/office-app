"use client";

import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Printer } from 'lucide-react';

import QRCode from 'react-qr-code';
import { toPng } from 'html-to-image';

const loadBase64Image = async (url: string) => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
};

interface ReportDailyCollectionProps {
  report: any;
  userName: string;
}

export function ReportDailyCollection({ report, userName }: ReportDailyCollectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const collections = report.collections || [];

  // Calculate Aggregations
  // Structure: Group -> Fund -> Category -> Amount
  const regularTotals: Record<string, Record<string, Record<string, number>>> = {};
  const onlineTotals: Record<string, Record<string, Record<string, number>>> = {};

  const fundTotals: Record<string, number> = {};
  let grandTotal = 0;

  collections.forEach((col: any) => {
    col.collectionItems?.forEach((item: any) => {
      const catName = item.collectionCategory?.name || 'Unknown Category';
      const catCode = item.collectionCategory?.code || '';
      const groupName = item.collectionCategory?.collectionGroup?.name || 'Ungrouped';
      const fundTypeName = item.collectionCategory?.fundType?.name || 'Uncategorized Fund';
      const amount = Number(item.amount);

      const isOnline = catName.toUpperCase().includes('ONLINE') || catCode.toUpperCase().includes('ONLINE') || groupName.toUpperCase().includes('ONLINE');

      const targetTotals = isOnline ? onlineTotals : regularTotals;

      // Breakdown
      if (!targetTotals[groupName]) targetTotals[groupName] = {};
      if (!targetTotals[groupName][fundTypeName]) targetTotals[groupName][fundTypeName] = {};
      if (!targetTotals[groupName][fundTypeName][catName]) targetTotals[groupName][fundTypeName][catName] = 0;

      targetTotals[groupName][fundTypeName][catName] += amount;

      // Recapitulation
      if (!fundTotals[fundTypeName]) fundTotals[fundTypeName] = 0;
      fundTotals[fundTypeName] += amount;

      grandTotal += amount;
    });
  });

  const buildBreakdownRows = (totalsDict: typeof regularTotals, sectionTitle: string) => {
    const rows: any[][] = [];
    const sortedGroups = Object.keys(totalsDict).sort((a, b) => {
      if (a === 'Ungrouped') return 1;
      if (b === 'Ungrouped') return -1;
      return a.localeCompare(b);
    });

    if (sortedGroups.length === 0) return rows;

    rows.push([{ content: sectionTitle, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [200, 200, 200], halign: 'center' } }]);

    sortedGroups.forEach(group => {
      rows.push([{ content: group.toUpperCase(), colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }]);

      let groupTotal = 0;

      const sortedFunds = Object.keys(totalsDict[group]).sort((a, b) => a.localeCompare(b));
      sortedFunds.forEach(fund => {
        rows.push([{ content: `  Fund: ${fund}`, colSpan: 2, styles: { fontStyle: 'italic', textColor: [80, 80, 80] } }]);

        let fundSum = 0;
        const sortedCats = Object.keys(totalsDict[group][fund]).sort((a, b) => a.localeCompare(b));
        sortedCats.forEach(cat => {
          const amt = totalsDict[group][fund][cat];
          rows.push([`    ${cat}`, amt]);
          fundSum += amt;
          groupTotal += amt;
        });

        rows.push([
          { content: `    Sub-Total (${fund}):`, styles: { fontStyle: 'italic', halign: 'right', fontSize: 8 } },
          { content: fundSum, styles: { fontStyle: 'italic', fontSize: 8 } }
        ]);
      });

      rows.push([
        { content: `Sub-Total (${group}):`, styles: { fontStyle: 'bold', halign: 'right' } },
        { content: groupTotal, styles: { fontStyle: 'bold' } }
      ]);
    });
    return rows;
  };

  const renderUITableRows = (totalsDict: typeof regularTotals) => {
    const rows: React.ReactNode[] = [];
    const sortedGroups = Object.keys(totalsDict).sort((a, b) => {
      if (a === 'Ungrouped') return 1;
      if (b === 'Ungrouped') return -1;
      return a.localeCompare(b);
    });

    sortedGroups.forEach(group => {
      rows.push(
        <tr key={`header-${group}`} className="bg-gray-100 font-bold uppercase">
          <td colSpan={2} className="border border-black p-2 text-left">{group}</td>
        </tr>
      );

      let groupSum = 0;

      const sortedFunds = Object.keys(totalsDict[group]).sort((a, b) => a.localeCompare(b));
      sortedFunds.forEach(fund => {
        rows.push(
          <tr key={`fund-${group}-${fund}`} className="bg-white italic text-slate-600">
            <td colSpan={2} className="border border-black p-2 pl-6 text-left text-xs">Fund: {fund}</td>
          </tr>
        );

        let fundSum = 0;
        const sortedCats = Object.keys(totalsDict[group][fund]).sort((a, b) => a.localeCompare(b));
        sortedCats.forEach(cat => {
          const amt = totalsDict[group][fund][cat];
          rows.push(
            <tr key={`cat-${group}-${fund}-${cat}`} className="hover:bg-gray-50">
              <td className="border border-black p-2 pl-10 text-left text-sm">{cat}</td>
              <td className="border border-black p-2 text-right text-sm">
                ₱{amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          );
          fundSum += amt;
          groupSum += amt;
        });

        rows.push(
          <tr key={`subtotal-fund-${group}-${fund}`} className="italic text-slate-600 bg-gray-50">
            <td className="border border-black p-2 pr-4 text-right text-xs">Sub-Total ({fund}):</td>
            <td className="border border-black p-2 text-right text-xs font-semibold">
              ₱{fundSum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
          </tr>
        );
      });

      rows.push(
        <tr key={`subtotal-${group}`} className="font-bold">
          <td className="border border-black p-2 text-right">Sub-Total ({group}):</td>
          <td className="border border-black p-2 text-right">
            ₱{groupSum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
        </tr>
      );
    });

    return rows;
  };

  const downloadAsPDF = async () => {
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'letter'
    });

    const centerX = pdf.internal.pageSize.getWidth() / 2;
    let currentY = 15;

    try {
      const leftLogoData = await loadBase64Image('/Tagbilaran-City-Seal-Logo-rev.png');
      const rightLogoData = await loadBase64Image('/cto_logo.png');
      pdf.addImage(leftLogoData, 'PNG', 20, 10, 25, 25);
      pdf.addImage(rightLogoData, 'PNG', pdf.internal.pageSize.getWidth() - 45, 10, 25, 25);
    } catch (error) {
      console.error('Failed to load logos for PDF', error);
    }

    // Header
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("Republic of the Philippines", centerX, currentY, { align: "center" });
    currentY += 5;
    pdf.setFontSize(12);
    pdf.text("CITY GOVERNMENT OF TAGBILARAN", centerX, currentY, { align: "center" });
    currentY += 5;
    pdf.setFontSize(13);
    pdf.text("CITY TREASURER'S OFFICE", centerX, currentY, { align: "center" });
    currentY += 5;
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(9);
    pdf.text("Tagbilaran City, Bohol, Philippines", centerX, currentY, { align: "center" });

    currentY += 12;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("DAILY CONSOLIDATED COLLECTIONS REPORT", centerX, currentY, { align: "center" });

    currentY += 8;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Control No: `, 14, currentY);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${report.controlNo}`, 35, currentY);

    currentY += 5;
    pdf.setFont("helvetica", "normal");
    pdf.text(`Date Consolidated: `, 14, currentY);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${new Date(report.date).toLocaleString()}`, 45, currentY);

    currentY += 10;

    // 1. Render Breakdown of Collections
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("COLLECTIONS BREAKDOWN", 14, currentY);
    currentY += 4;

    const breakdownRows: any[][] = [
      ...buildBreakdownRows(regularTotals, "REGULAR COLLECTIONS"),
      ...buildBreakdownRows(onlineTotals, "ONLINE COLLECTIONS")
    ];

    autoTable(pdf, {
      head: [["Collection Category", "Amount"]],
      body: breakdownRows,
      startY: currentY,
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'right', cellWidth: 50 }
      },
      willDrawCell: (data) => {
        if (data.column.index === 1 && typeof data.cell.raw === 'number') {
          data.cell.text = [`P${data.cell.raw.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`];
        }
      }
    });

    currentY = (pdf as any).lastAutoTable.finalY + 4;

    // Subtotal Breakdown
    autoTable(pdf, {
      body: [
        [
          { content: `Total Collections:`, styles: { halign: 'right', fontStyle: 'bold' } },
          { content: `P${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, styles: { halign: 'right', fontStyle: 'bold', textColor: [0, 100, 0] } }
        ]
      ],
      startY: currentY,
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: (pdf as any).lastAutoTable.columns[0].width },
        1: { cellWidth: (pdf as any).lastAutoTable.columns[1].width, halign: 'right' }
      }
    });

    currentY = (pdf as any).lastAutoTable.finalY + 10;

    // Page break check for recapitulation
    if (currentY > pdf.internal.pageSize.getHeight() - 80) {
      pdf.addPage();
      currentY = 20;
    }

    // 2. Render Recapitulation
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("RECAPITULATION", 14, currentY);
    currentY += 4;

    const recapRows: any[][] = [];

    Object.entries(fundTotals).forEach(([fund, amount]) => {
      recapRows.push([fund, amount]);
    });

    autoTable(pdf, {
      head: [["Fund Type", "Amount"]],
      body: recapRows,
      startY: currentY,
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'right', cellWidth: 50 }
      },
      willDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 1 && typeof data.cell.raw === 'number') {
          data.cell.text = [`P${data.cell.raw.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`];
        }
      }
    });

    currentY = (pdf as any).lastAutoTable.finalY;

    // Grand Total
    autoTable(pdf, {
      body: [
        [
          { content: `GRAND TOTAL:`, styles: { halign: 'right', fontStyle: 'bold', fontSize: 11 } },
          { content: `P${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, styles: { halign: 'right', fontStyle: 'bold', fontSize: 11, textColor: [200, 0, 0] } }
        ]
      ],
      startY: currentY,
      theme: 'plain',
      styles: { fontSize: 11 },
      columnStyles: {
        0: { cellWidth: (pdf as any).lastAutoTable.columns[0].width },
        1: { cellWidth: (pdf as any).lastAutoTable.columns[1].width, halign: 'right' }
      }
    });

    let finalY = (pdf as any).lastAutoTable.finalY + 30;

    // Page break check for signatures & QR
    if (finalY > pdf.internal.pageSize.getHeight() - 60) {
      pdf.addPage();
      finalY = 30;
    }

    // QR Code rendering
    if (qrRef.current) {
      try {
        const dataUrl = await toPng(qrRef.current);
        // Place QR code on the bottom left
        pdf.addImage(dataUrl, 'PNG', 14, finalY, 30, 30);
      } catch (err) {
        console.error("Failed to generate QR code image", err);
      }
    }

    // Footer Signatures
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "italic");
    pdf.text("Prepared by:", 60, finalY);
    pdf.text("Approved by:", 135, finalY);

    pdf.setFont("helvetica", "bold");
    pdf.text(userName.toUpperCase(), 60, finalY + 12);
    pdf.text("HUBERT M. INAS, CPA, BCLTE", 135, finalY + 12);

    pdf.setLineWidth(0.2);
    pdf.line(55, finalY + 13, 115, finalY + 13);
    pdf.line(125, finalY + 13, 195, finalY + 13);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text("Authorized Personnel / Staff", 85, finalY + 17, { align: "center" });
    pdf.text("City Treasurer", 160, finalY + 17, { align: "center" });

    pdf.save(`Daily_Consolidated_Report_${report.controlNo}.pdf`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] xl:max-w-6xl max-h-[95vh] overflow-y-auto resize overflow-auto">
        <DialogHeader className="no-print flex-row items-center justify-between">
          <div>
            <DialogTitle>Daily Consolidated Report Preview</DialogTitle>
            <DialogDescription>
              Review the daily consolidated report before downloading the PDF.
            </DialogDescription>
          </div>
          <Button onClick={downloadAsPDF} className="gap-2">
            <Printer className="h-4 w-4" />
            Download PDF
          </Button>
        </DialogHeader>

        {/* Hidden QR Code for image generation */}
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
          <div ref={qrRef} style={{ background: 'white', padding: '4px' }}>
            <QRCode value={report.controlNo} size={100} />
          </div>
        </div>

        {/* Print Preview Container */}
        <div className="w-full bg-white p-8 max-w-5xl mx-auto border shadow-sm my-4 text-black">
          <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-200">
            <div className="w-24">
              <img src="/Tagbilaran-City-Seal-Logo-rev.png" alt="City Seal" className="w-20 h-20 object-contain mx-auto" />
            </div>
            <div className="text-center flex-1 space-y-1">
              <h4 className="font-bold text-lg">Republic of the Philippines</h4>
              <h4 className="font-black text-md">CITY GOVERNMENT OF TAGBILARAN</h4>
              <h4 className="font-black text-lg">CITY TREASURER'S OFFICE</h4>
              <p className="text-sm italic">Tagbilaran City, Bohol, Philippines</p>
            </div>
            <div className="w-24">
              <img src="/cto_logo.png" alt="CTO Logo" className="w-20 h-20 object-contain mx-auto" />
            </div>
          </div>
          <div className="text-center mb-8">
            <h2 className="text-xl font-black underline uppercase tracking-tight">Daily Consolidated Collections Report</h2>
          </div>

          <div className="flex justify-between items-start mb-8 text-sm">
            <div>
              <p><span className="font-bold">Control No:</span> <span className="font-mono text-primary text-base">{report.controlNo}</span></p>
              <p><span className="font-bold">Date Consolidated:</span> {new Date(report.date).toLocaleString()}</p>
            </div>
            <div>
              {/* Visible QR Code in preview */}
              <div className="border p-1 bg-white">
                <QRCode value={report.controlNo} size={64} />
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Breakdown */}
            <div>
              <h3 className="text-lg font-black tracking-tight mb-4 uppercase">Collections Breakdown</h3>
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr className="bg-gray-50 uppercase font-bold">
                    <th className="border border-black p-2 text-left">Collection Category</th>
                    <th className="border border-black p-2 text-right w-48">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Regular Collections */}
                  {Object.keys(regularTotals).length > 0 && (
                    <tr className="bg-slate-200 font-bold uppercase text-center border-b border-black">
                      <td colSpan={2} className="p-2 border border-black">REGULAR COLLECTIONS</td>
                    </tr>
                  )}
                  {renderUITableRows(regularTotals)}

                  {/* Online Collections */}
                  {Object.keys(onlineTotals).length > 0 && (
                    <tr className="bg-slate-200 font-bold uppercase text-center border-b border-black mt-2">
                      <td colSpan={2} className="p-2 border border-black">ONLINE COLLECTIONS</td>
                    </tr>
                  )}
                  {renderUITableRows(onlineTotals)}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold border-t-2 border-black">
                    <td className="p-2 text-right uppercase border border-black">Total Collections:</td>
                    <td className="p-2 text-right text-green-700 border border-black">
                      ₱{grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Recapitulation */}
            <div className="mt-12 pt-8">
              <h3 className="text-lg font-black tracking-tight mb-4 uppercase">Recapitulation</h3>
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr className="bg-gray-50 uppercase font-bold">
                    <th className="border border-black p-2 text-left">Fund Type</th>
                    <th className="border border-black p-2 text-right w-48">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(fundTotals).map(([fund, amount]) => (
                    <tr key={fund} className="hover:bg-gray-50">
                      <td className="border border-black p-2 text-left">{fund}</td>
                      <td className="border border-black p-2 text-right">
                        ₱{amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="p-2 text-right font-black text-lg uppercase border border-black">Grand Total:</td>
                    <td className="p-2 text-right font-black text-xl text-red-700 border border-black">
                      ₱{grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

          </div>

          <div className="mt-16 flex justify-between px-8 text-sm">
            <div className="text-center">
              <p className="italic text-slate-500 text-left mb-6">Prepared by:</p>
              <p className="font-bold border-b border-black px-4">{userName.toUpperCase()}</p>
              <p className="text-xs mt-1">Authorized Personnel / Staff</p>
            </div>
            <div className="text-center">
              <p className="italic text-slate-500 text-left mb-6">Approved by:</p>
              <p className="font-bold border-b border-black px-4">HUBERT M. INAS, CPA, BCLTE</p>
              <p className="text-xs mt-1">City Treasurer</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
