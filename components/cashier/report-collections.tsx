"use client";

import React, { useState } from 'react';
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
import { ReportSettlementHeader } from '@/components/foodvoucher/fvSettlementReport/reportSettlementHeader';

interface ReportCollectionsProps {
  collections: any[];
  userName: string;
  reportPeriod?: string;
}

export function ReportCollections({ collections, userName, reportPeriod }: ReportCollectionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reportType, setReportType] = useState<"detailed" | "summary">("detailed");

  const isNotSingleDate = reportPeriod && !reportPeriod.startsWith("Date:");

  // Recapitulation processing
  const regularFunds: Record<string, number> = {};
  const onlineCategories: Record<string, number> = {};
  const categorySums: Record<string, number> = {};
  let totalRegular = 0;
  let totalOnline = 0;
  let grandTotal = 0;

  collections.forEach(col => {
    col.collectionItems?.forEach((item: any) => {
      const catName = item.collectionCategory?.name || 'Unknown Category';
      const catCode = item.collectionCategory?.code || '';
      const fundTypeName = item.collectionCategory?.fundType?.name || 'Uncategorized Fund';
      const amount = Number(item.amount);

      const isOnline = catName.toUpperCase().includes('ONLINE') || catCode.toUpperCase().includes('ONLINE');

      if (!categorySums[catName]) categorySums[catName] = 0;
      categorySums[catName] += amount;

      if (isOnline) {
        if (!onlineCategories[catName]) onlineCategories[catName] = 0;
        onlineCategories[catName] += amount;
        totalOnline += amount;
      } else {
        if (!regularFunds[fundTypeName]) regularFunds[fundTypeName] = 0;
        regularFunds[fundTypeName] += amount;
        totalRegular += amount;
      }

      grandTotal += amount;
    });
  });

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
    pdf.text("CASHIER COLLECTIONS REPORT", centerX, currentY, { align: "center" });

    if (reportPeriod) {
      currentY += 6;
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "italic");
      pdf.text(reportPeriod, centerX, currentY, { align: "center" });
    }

    currentY += 10;

    if (reportType === 'detailed') {
      // Render Receipts Sequentially
      collections.forEach((col, index) => {
        // Receipt Header
        currentY += 4;
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        const dateStr = new Date(col.date).toLocaleDateString();
        pdf.text(`Date: ${dateStr}   |   Control No: ${col.controlNo}`, 14, currentY);
        currentY += 3;

        const itemsRows = (col.collectionItems || []).map((item: any, idx: number) => [
          idx + 1,
          item.collectionCategory?.name || 'Unknown',
          Number(item.amount)
        ]);

        autoTable(pdf, {
          head: [["#", "Category", "Amount"]],
          body: itemsRows,
          startY: currentY,
          theme: 'grid',
          headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], halign: 'center' },
          styles: { fontSize: 8, cellPadding: 1 },
          columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { halign: 'left' },
            2: { halign: 'right', cellWidth: 40 }
          },
          willDrawCell: (data) => {
            if (data.section === 'body' && data.column.index === 2) {
              const val = Number(data.cell.raw);
              data.cell.text = [`P${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`];
            }
          }
        });

        const lastTable = (pdf as any).lastAutoTable;
        currentY = lastTable.finalY + 2;

        // Receipt Subtotal
        autoTable(pdf, {
          body: [
            [
              { content: `Total:`, styles: { halign: 'right', fontStyle: 'bold' } },
              { content: `P${Number(col.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, styles: { halign: 'right', fontStyle: 'bold' } }
            ]
          ],
          startY: currentY,
          theme: 'plain',
          styles: { fontSize: 8, cellPadding: 1 },
          columnStyles: {
            0: { cellWidth: lastTable.columns[0].width + lastTable.columns[1].width },
            1: { cellWidth: lastTable.columns[2].width, halign: 'right' }
          }
        });

        currentY = (pdf as any).lastAutoTable.finalY + 4;
      });
    } else {
      // Render Category Sums Summary
      currentY += 10;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text("SUMMARY BY CATEGORY", 14, currentY);
      currentY += 4;
      
      const summaryRows = Object.entries(categorySums).map(([cat, amount]) => [
        cat,
        amount
      ]);
      
      autoTable(pdf, {
        head: [["Category", "Total Amount"]],
        body: summaryRows,
        startY: currentY,
        theme: 'grid',
        headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255] },
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { halign: 'left' },
          1: { halign: 'right', cellWidth: 50 }
        },
        willDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 1) {
            const val = Number(data.cell.raw);
            data.cell.text = [`P${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`];
          }
        }
      });
      currentY = (pdf as any).lastAutoTable.finalY + 4;
    }

    // Check if we need a new page for recapitulation
    if (currentY > pdf.internal.pageSize.getHeight() - 80) {
      pdf.addPage();
      currentY = 20;
    }

    // --- RECAPITULATION SECTION ---
    currentY += 10;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("RECAPITULATION", 14, currentY);
    currentY += 4;

    const recapRows: any[][] = [];

    // Regular Funds
    Object.entries(regularFunds).forEach(([fund, amount]) => {
      recapRows.push([fund, amount]);
    });
    
    // Subtotal Regular
    if (Object.keys(regularFunds).length > 0) {
      recapRows.push([
        { content: "Sub-Total (Regular):", styles: { fontStyle: 'bold', halign: 'right' } }, 
        { content: totalRegular, styles: { fontStyle: 'bold' } }
      ]);
    }

    // Online Categories
    if (Object.keys(onlineCategories).length > 0) {
      recapRows.push([{ content: "Online Collections", colSpan: 2, styles: { fontStyle: 'italic', fillColor: [240, 240, 240] } }]);
      Object.entries(onlineCategories).forEach(([cat, amount]) => {
        recapRows.push([`  ${cat}`, amount]);
      });
      recapRows.push([
        { content: "Sub-Total (Online):", styles: { fontStyle: 'bold', halign: 'right' } }, 
        { content: totalOnline, styles: { fontStyle: 'bold' } }
      ]);
    }

    autoTable(pdf, {
      body: recapRows,
      startY: currentY,
      theme: 'grid',
      styles: { fontSize: 9 },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'right', cellWidth: 50 }
      },
      willDrawCell: (data) => {
        // Formatting numbers
        if (data.column.index === 1 && typeof data.cell.raw === 'number') {
          data.cell.text = [`P${data.cell.raw.toLocaleString(undefined, { minimumFractionDigits: 2 })}`];
        }
      }
    });

    currentY = (pdf as any).lastAutoTable.finalY;

    // Grand Total
    autoTable(pdf, {
      body: [
        [
          { content: `GRAND TOTAL:`, styles: { halign: 'right', fontStyle: 'bold', fontSize: 11 } },
          { content: `P${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, styles: { halign: 'right', fontStyle: 'bold', fontSize: 11, textColor: [200, 0, 0] } }
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
    
    // Page break check for signatures
    if (finalY > pdf.internal.pageSize.getHeight() - 40) {
      pdf.addPage();
      finalY = 30;
    }

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

    pdf.save(`Collections_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Printer className="h-4 w-4" />
          Print Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="no-print flex-row items-center justify-between">
          <div>
            <DialogTitle>Collections Report Preview</DialogTitle>
            <DialogDescription>
              Review the detailed collections and recapitulation before downloading.
            </DialogDescription>
            {isNotSingleDate && (
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant={reportType === 'detailed' ? 'default' : 'outline'} onClick={() => setReportType('detailed')}>Detailed List</Button>
                <Button size="sm" variant={reportType === 'summary' ? 'default' : 'outline'} onClick={() => setReportType('summary')}>Summary Only</Button>
              </div>
            )}
          </div>
          <Button onClick={downloadAsPDF} className="gap-2">
            <Printer className="h-4 w-4" />
            Download PDF
          </Button>
        </DialogHeader>

        {/* Print Preview Container */}
        <div className="w-full bg-white p-8 max-w-3xl mx-auto border shadow-sm my-4 text-black">
          <ReportSettlementHeader />
          <div className="text-center mb-8">
            <h2 className="text-xl font-black underline uppercase tracking-tight">Cashier Collections Report</h2>
            {reportPeriod ? (
              <p className="text-xs font-bold text-slate-500 mt-1 italic">
                {reportPeriod}
              </p>
            ) : (
              <p className="text-xs font-bold text-slate-500 mt-1 italic">
                Showing latest 50 entries
              </p>
            )}
          </div>

          {collections.length === 0 ? (
            <p className="text-center text-slate-500 italic py-8">No collections found for this report.</p>
          ) : (
            <div className="space-y-8">
              {/* Receipts List or Summary */}
              {reportType === 'detailed' ? (
                <div className="space-y-6">
                  {collections.map((col, cIdx) => (
                    <div key={cIdx} className="text-sm">
                      <div className="bg-slate-100 p-2 border-b border-black font-bold flex gap-8">
                        <span>Date: {new Date(col.date).toLocaleDateString()}</span>
                        <span>Control No: <span className="font-mono text-primary">{col.controlNo}</span></span>
                      </div>
                      <table className="w-full border-collapse border border-black text-xs">
                        <thead>
                          <tr className="bg-gray-50 uppercase font-bold">
                            <th className="border border-black p-1 text-center w-8">#</th>
                            <th className="border border-black p-1 text-left">Category</th>
                            <th className="border border-black p-1 text-right w-32">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(col.collectionItems || []).map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="border border-black p-1 text-center">{idx + 1}</td>
                              <td className="border border-black p-1 text-left">{item.collectionCategory?.name || 'Unknown'}</td>
                              <td className="border border-black p-1 text-right">
                                ₱{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-50 font-bold">
                            <td colSpan={2} className="border border-black p-1 text-right uppercase">Total:</td>
                            <td className="border border-black p-1 text-right">
                              ₱{Number(col.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <h3 className="text-lg font-black tracking-tight mb-4 uppercase">Summary by Category</h3>
                  <table className="w-full border-collapse border border-black text-sm">
                    <thead>
                      <tr className="bg-gray-50 uppercase font-bold">
                        <th className="border border-black p-2 text-left">Category</th>
                        <th className="border border-black p-2 text-right w-48">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(categorySums).map(([cat, amount]) => (
                        <tr key={cat} className="hover:bg-gray-50">
                          <td className="border border-black p-2 text-left">{cat}</td>
                          <td className="border border-black p-2 text-right font-medium text-blue-700">
                            ₱{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Recapitulation */}
              <div className="mt-12 pt-8 border-t-2 border-dashed border-black">
                <h3 className="text-lg font-black tracking-tight mb-4 uppercase">Recapitulation</h3>
                <div className="w-full max-w-md">
                  <table className="w-full text-sm border-collapse">
                    <tbody>
                      {/* Regular Funds */}
                      {Object.entries(regularFunds).map(([fund, amount]) => (
                        <tr key={fund}>
                          <td className="py-1 border-b">{fund}</td>
                          <td className="py-1 border-b text-right font-medium">
                            ₱{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                      {Object.keys(regularFunds).length > 0 && (
                        <tr>
                          <td className="py-2 text-right font-bold italic">Sub-Total (Regular):</td>
                          <td className="py-2 text-right font-bold">
                            ₱{totalRegular.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )}

                      {/* Online Categories */}
                      {Object.keys(onlineCategories).length > 0 && (
                        <>
                          <tr>
                            <td colSpan={2} className="py-2 pt-4 font-bold text-slate-500 italic uppercase text-xs">Online Collections</td>
                          </tr>
                          {Object.entries(onlineCategories).map(([cat, amount]) => (
                            <tr key={cat}>
                              <td className="py-1 border-b pl-4">{cat}</td>
                              <td className="py-1 border-b text-right font-medium text-blue-700">
                                ₱{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                          <tr>
                            <td className="py-2 text-right font-bold italic">Sub-Total (Online):</td>
                            <td className="py-2 text-right font-bold text-blue-700">
                              ₱{totalOnline.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td className="py-4 text-right font-black text-lg uppercase border-t-2 border-black">Grand Total:</td>
                        <td className="py-4 text-right font-black text-xl text-red-700 border-t-2 border-black">
                          ₱{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

            </div>
          )}

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
