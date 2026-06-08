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
import { calculateTaxPenalties } from '@/lib/tax-utils';

const loadBase64Image = async (url: string) => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
};

interface ReportTransferTaxComputationProps {
  data: any; // Contains document and newTransferTaxes
  userName: string;
}

export function ReportTransferTaxComputation({ data, userName }: ReportTransferTaxComputationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const transactions = data.newTransferTaxes || [];

  let overAllTaxDue = 0;
  let totalSurcharge = 0;
  let totalInterest = 0;
  let grandTotal = 0;

  // Flatten the details for the UI table
  const flattenedDetails: any[] = [];

  transactions.forEach((tx: any) => {
    const controlNo = tx.t_controlNumber;

    // Group details by sub-computation (transaction type, transferor, transferee)
    const grouped: Record<string, any[]> = {};
    tx.t_transfertaxdetails.forEach((dt: any) => {
      const key = `${dt.nt_transactiontype}-${dt.nt_transferror}-${dt.nt_transferee}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(dt);
    });

    let isFirstInTx = true;

    Object.values(grouped).forEach((groupDetails) => {
      let groupMarketValue = 0;
      let groupConsideration = Math.max(...groupDetails.map((dt: any) => Number(dt.nt_considerationvalue || 0)));
      let groupTaxBase = 0;
      let groupSurcharge = 0;
      let groupInterest = 0;
      let groupTaxDue = 0;

      groupDetails.forEach((dt: any, index: number) => {
        const mv = Number(dt.nt_marketvalue || 0);
        const cons = Number(dt.nt_considerationvalue || 0);

        const surcharge = Number(dt.nt_surcharge || 0);
        const interest = Number(dt.nt_interest || 0);

        groupMarketValue += mv;
        // No longer summing raw detail penalties since they are grouped
        // groupSurcharge += surcharge;
        // groupInterest += interest;

        flattenedDetails.push({
          isSummary: false,
          controlNo: isFirstInTx && index === 0 ? controlNo : "", // Group visually
          transferee: dt.nt_transferee || "N/A",
          transferor: dt.nt_transferror || "N/A",
          taxdecno: dt.realProperty?.taxdecnumber || dt.nt_taxdecnumber || "N/A",
          lotno: dt.realProperty?.lotnumber || dt.nt_lotnumber || "N/A",
          area: dt.realProperty?.area || dt.nt_area || 0,
          marketValue: mv,
          consideration: cons,
          transactionType: dt.nt_transactiontype || "N/A",
          taxbase: null,
          basicTaxDue: null,
          surcharge: null,
          interest: null,
          transfertaxdue: null,
          originalTx: tx // store for header rendering if needed
        });
      });

      groupTaxBase = Math.max(groupMarketValue, groupConsideration);
      const groupBasicTax = Math.max(groupTaxBase * 0.0075, 500);

      // Recompute penalties precisely for the grouped tax due
      const penalties = calculateTaxPenalties(groupBasicTax, data.notarialDate, new Date(tx.t_DateCompute));
      groupSurcharge = penalties.surcharge;
      groupInterest = penalties.interest;
      groupTaxDue = penalties.totalAmountDue;

      overAllTaxDue += groupBasicTax;
      totalSurcharge += groupSurcharge;
      totalInterest += groupInterest;
      grandTotal += groupTaxDue;

      // Add Group Summary Row
      flattenedDetails.push({
        isSummary: true,
        controlNo: "",
        transferee: "",
        transferor: "",
        taxdecno: "",
        lotno: "",
        area: "",
        marketValue: groupMarketValue,
        consideration: groupConsideration,
        transactionType: "TOTAL:",
        taxbase: groupTaxBase,
        basicTaxDue: groupBasicTax,
        surcharge: groupSurcharge,
        interest: groupInterest,
        transfertaxdue: groupTaxDue,
        originalTx: tx
      });

      isFirstInTx = false;
    });
  });

  const handlePrint = async () => {
    const doc = new jsPDF('landscape');

    let qrImage = '';
    if (qrRef.current) {
      try {
        qrImage = await toPng(qrRef.current, { cacheBust: true });
      } catch (err) {
        console.error("Failed to generate QR code image", err);
      }
    }

    try {
      const logoUrl = '/cto_logo.png';
      const logoBase64 = await loadBase64Image(logoUrl);
      doc.addImage(logoBase64, 'PNG', 14, 10, 20, 20);
    } catch (error) {
      console.error('Logo loading failed', error);
    }

    if (qrImage && qrImage.startsWith('data:image/png')) {
      doc.addImage(qrImage, 'PNG', 260, 10, 20, 20);
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("OFFICE OF THE CITY TREASURER", 148, 16, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("CITY OF TAGBILARAN", 148, 22, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("REPORT OF TRANSFER TAX COMPUTATION", 148, 30, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Notarial Document: ${data.documentName} - No: ${data.documentNumber}`, 14, 42);
    doc.text(`Type: ${data.documentType}`, 14, 47);
    doc.text(`Notarized By: ${data.notarizedBy}`, 14, 52);
    doc.text(`Notarial Date: ${new Date(data.notarialDate).toLocaleDateString()}`, 14, 57);

    if (transactions.length > 0) {
      doc.text(`Days Elapsed: ${transactions[0].t_daysElapsed}`, 200, 42);
      const valDate = new Date(transactions[0].t_validity);
      const valStr = valDate.getFullYear() >= 2099 ? "MAXIMUM INTEREST REACHED" : valDate.toLocaleDateString('en-US').toUpperCase();
      doc.text(`Validity Date: ${valStr}`, 200, 47);
    }

    const tableRows = flattenedDetails.map(d => [
      d.controlNo,
      d.transferor,
      d.transferee,
      d.taxdecno,
      d.lotno,
      d.isSummary ? "" : d.area,
      d.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      d.consideration.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      d.transactionType,
      d.taxbase !== null ? d.taxbase.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "",
      d.basicTaxDue !== null ? d.basicTaxDue.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "",
      d.surcharge !== null ? d.surcharge.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "",
      d.interest !== null ? d.interest.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "",
      d.transfertaxdue !== null ? d.transfertaxdue.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ""
    ]);

    autoTable(doc, {
      startY: 65,
      headStyles: { fillColor: [41, 128, 185], fontSize: 7, halign: 'center' },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        6: { halign: 'right' },
        7: { halign: 'right' },
        9: { halign: 'right' },
        10: { halign: 'right' },
        11: { halign: 'right' },
        12: { halign: 'right' },
        13: { halign: 'right' },
      },
      head: [[
        "Control No", "Transferor", "Transferee", "Tax Dec No", "Lot No", "Area (sqm)",
        "Market Value", "Consideration", "Type", "Tax Base", "Tax Due", "Surcharge", "Interest", "Amount Due"
      ]],
      body: tableRows,
      theme: 'grid',
      didParseCell: function (data: any) {
        // If row is a summary row (where Type == "TOTAL:")
        if (data.section === 'body' && data.row.raw[8] === "TOTAL:") {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 248, 255]; // Light blue background
        }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 65;

    // Build Footer Table
    autoTable(doc, {
      startY: finalY + 5,
      theme: 'plain',
      bodyStyles: { fontSize: 9, fontStyle: 'bold' },
      columnStyles: {
        0: { halign: 'right', cellWidth: 240 },
        1: { halign: 'right' }
      },
      body: [
        ["Over All Tax Due:", overAllTaxDue.toLocaleString(undefined, { minimumFractionDigits: 2 })],
        ["Total Surcharge:", totalSurcharge.toLocaleString(undefined, { minimumFractionDigits: 2 })],
        ["Total Interest:", totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })],
        ["Grand Total:", grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })],
      ],
    });

    const signatureY = ((doc as any).lastAutoTable?.finalY || finalY) + 25;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Prepared by:", 20, signatureY);

    doc.setFont("helvetica", "bold");
    doc.text(userName.toUpperCase(), 20, signatureY + 10);

    doc.setFont("helvetica", "normal");
    doc.line(20, signatureY + 11, 80, signatureY + 11);
    doc.text("Name and Signature", 20, signatureY + 15);

    doc.save(`Report_TransferTax_${data.documentNumber}.pdf`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 font-bold shadow-sm">
          <Printer className="mr-2 h-4 w-4" /> Generate Report
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[95vw] md:max-w-[98vw] min-w-[300px] h-[85vh] max-h-[95vh] min-h-[300px] flex flex-col overflow-hidden resize p-2 sm:p-4 border border-gray-300 shadow-2xl">
        <DialogHeader>
          <DialogTitle>Transfer Tax Computation Report</DialogTitle>
          <DialogDescription>
            Preview of the computation report for Notarial Document: {data.documentNumber}
          </DialogDescription>
        </DialogHeader>

        {/* Hidden QR Code for capture (must not be display: none) */}
        <div className="absolute -left-[9999px] top-0">
          <div ref={qrRef} className="bg-white p-2 inline-block">
            <QRCode
              value={`Report Generated by: ${userName}\nDocument: ${data.documentNumber}\nGrand Total: Php ${grandTotal.toLocaleString()}`}
              size={128}
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto border p-4 bg-white rounded-md mt-2 shadow-sm">
          <div className="text-center mb-6">
            <h2 className="font-bold text-lg">REPORT OF TRANSFER TAX COMPUTATION</h2>
            <p className="text-sm text-gray-500">Document No: {data.documentNumber}</p>
            {transactions.length > 0 && (
              <div className="flex justify-center space-x-6 text-sm text-gray-600 mt-2">
                <p><span className="font-semibold">Days Elapsed:</span> {transactions[0].t_daysElapsed}</p>
                <p><span className="font-semibold">Validity Date:</span> {new Date(transactions[0].t_validity).getFullYear() >= 2099 ? "MAXIMUM INTEREST REACHED" : new Date(transactions[0].t_validity).toLocaleDateString('en-US').toUpperCase()}</p>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4 mb-4">
            <div className='font-bold text-md'>
              <div className="flex items-center space-x-2">
                Transferor(s): {Array.from(new Set(flattenedDetails.filter(d => !d.isSummary).map(d => d.transferor))).join(" / ")}
              </div>
              <div className="flex items-center space-x-2">
                Transferee(s): {Array.from(new Set(flattenedDetails.filter(d => !d.isSummary).map(d => d.transferee))).join(" / ")}
              </div>
            </div>
          </div>

          <table className="w-full text-[11px] sm:text-xs border-collapse tracking-tight">
            <thead>
              <tr className="bg-gray-100 uppercase text-[10px] sm:text-[11px]">
                <th className="border border-gray-300 px-1 py-1.5 text-left">Control No</th>
                <th className="border border-gray-300 px-1 py-1.5 text-left">Transferor</th>
                <th className="border border-gray-300 px-1 py-1.5 text-left">Transferee</th>
                <th className="border border-gray-300 px-1 py-1.5 text-left">TD No</th>
                <th className="border border-gray-300 px-1 py-1.5 text-left">Lot No</th>
                <th className="border border-gray-300 px-1 py-1.5 text-center">Area</th>
                <th className="border border-gray-300 px-1 py-1.5 text-right">Market Value</th>
                <th className="border border-gray-300 px-1 py-1.5 text-right">Consideration</th>
                <th className="border border-gray-300 px-1 py-1.5 text-left">Type</th>
                <th className="border border-gray-300 px-1 py-1.5 text-right">Tax Base</th>
                <th className="border border-gray-300 px-1 py-1.5 text-right">Tax Due</th>
                <th className="border border-gray-300 px-1 py-1.5 text-right">Surcharge</th>
                <th className="border border-gray-300 px-1 py-1.5 text-right">Interest</th>
                <th className="border border-gray-300 px-1 py-1.5 text-right">Amount Due</th>
              </tr>
            </thead>
            <tbody>
              {flattenedDetails.map((d, i) => (
                <tr key={i} className={d.isSummary ? "bg-blue-50 font-bold border-t border-b-2 border-blue-200" : "hover:bg-gray-50"}>
                  <td className="border border-gray-300 px-1 py-1.5 font-semibold">{d.controlNo}</td>
                  <td className="border border-gray-300 px-1 py-1.5">{d.transferor}</td>
                  <td className="border border-gray-300 px-1 py-1.5">{d.transferee}</td>
                  <td className="border border-gray-300 px-1 py-1.5">{d.taxdecno}</td>
                  <td className="border border-gray-300 px-1 py-1.5">{d.lotno}</td>
                  <td className="border border-gray-300 px-1 py-1.5 text-center">{d.isSummary ? "" : d.area}</td>
                  <td className="border border-gray-300 px-1 py-1.5 text-right">{d.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="border border-gray-300 px-1 py-1.5 text-right">{d.consideration.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="border border-gray-300 px-1 py-1.5 font-bold">{d.transactionType}</td>
                  <td className="border border-gray-300 px-1 py-1.5 text-right">{d.taxbase !== null ? d.taxbase.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ""}</td>
                  <td className="border border-gray-300 px-1 py-1.5 text-right font-semibold text-blue-600">{d.basicTaxDue !== null ? d.basicTaxDue.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ""}</td>
                  <td className="border border-gray-300 px-1 py-1.5 text-right text-red-600">{d.surcharge !== null ? d.surcharge.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ""}</td>
                  <td className="border border-gray-300 px-1 py-1.5 text-right text-red-600">{d.interest !== null ? d.interest.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ""}</td>
                  <td className="border border-gray-300 px-1 py-1.5 text-right font-bold text-emerald-600">{d.transfertaxdue !== null ? d.transfertaxdue.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ""}</td>
                </tr>
              ))}
            </tbody>
            <br />
            <tfoot>
              <tr>
                <td colSpan={11} className="border border-gray-300 px-1 py-1.5"></td>
                <td colSpan={2} className="border border-gray-300 px-1 py-1.5 text-right font-bold">Over All Tax Due:</td>
                <td className="border border-gray-300 px-1 py-1.5 text-right font-bold">{overAllTaxDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td colSpan={11} className="border border-gray-300 px-1 py-1.5"></td>
                <td colSpan={2} className="border border-gray-300 px-1 py-1.5 text-right font-bold">Total Surcharge:</td>
                <td className="border border-gray-300 px-1 py-1.5 text-right font-bold">{totalSurcharge.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td colSpan={11} className="border border-gray-300 px-1 py-1.5"></td>
                <td colSpan={2} className="border border-gray-300 px-1 py-1.5 text-right font-bold">Total Interest:</td>
                <td className="border border-gray-300 px-1 py-1.5 text-right font-bold">{totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr className="bg-gray-100">
                <td colSpan={11} className="border border-gray-300 px-1 py-1.5"></td>
                <td colSpan={2} className="border border-gray-300 px-1 py-1.5 text-right font-bold text-gray-900">Grand Total:</td>
                <td className="border border-gray-300 px-1 py-1.5 text-right font-black text-emerald-600">{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-2 shrink-0 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
          <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700">
            <Printer className="mr-2 h-4 w-4" /> Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
