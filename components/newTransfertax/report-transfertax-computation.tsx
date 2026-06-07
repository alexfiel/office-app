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
    
    // Summing the master level totals to match requested footers
    // Alternatively, we could sum up the details. But the master holds the total amount due, surcharge, interest.
    // However, the prompt says "Over All Tax Due, Total Surcharge, Total Interest and Grand Total".
    // Let's sum from the details or the master? Master holds `t_TotalAmountDue`, `t_TotalSurcharge`, `t_TotalInterest`.
    // Wait, the prompt lists the columns: "taxbase, surcharge, interest, transfertaxdue". 
    // In `NewTransferTaxDetails`, these columns are present. We should use the details!
    
    tx.t_transfertaxdetails.forEach((dt: any, index: number) => {
      const basicTax = Number(dt.nt_transfertaxDue || 0);
      const surcharge = Number(dt.nt_surcharge || 0);
      const interest = Number(dt.nt_interest || 0);
      const totalDue = Number(dt.nt_totalTransferTaxDue || 0);

      overAllTaxDue += basicTax;
      totalSurcharge += surcharge;
      totalInterest += interest;
      grandTotal += totalDue;

      flattenedDetails.push({
        controlNo: index === 0 ? controlNo : "", // Group visually by showing control no only on first row
        transferee: dt.nt_transferee || "N/A",
        transferor: dt.nt_transferror || "N/A",
        taxdecno: dt.realProperty?.taxdecnumber || dt.nt_taxdecnumber || "N/A",
        lotno: dt.realProperty?.lotnumber || dt.nt_lotnumber || "N/A",
        area: dt.realProperty?.area || dt.nt_area || 0,
        marketValue: Number(dt.nt_marketvalue || 0),
        consideration: Number(dt.nt_considerationvalue || 0),
        transactionType: dt.nt_transactiontype || "N/A",
        taxbase: Number(dt.nt_taxbase || 0),
        surcharge: surcharge,
        interest: interest,
        transfertaxdue: totalDue,
      });
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

    const tableRows = flattenedDetails.map(d => [
      d.controlNo,
      d.transferor,
      d.transferee,
      d.taxdecno,
      d.lotno,
      d.area,
      d.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      d.consideration.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      d.transactionType,
      d.taxbase.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      d.surcharge.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      d.interest.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      d.transfertaxdue.toLocaleString(undefined, { minimumFractionDigits: 2 })
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
      },
      head: [[
        "Control No", "Transferor", "Transferee", "Tax Dec No", "Lot No", "Area (sqm)", 
        "Market Value", "Consideration", "Type", "Tax Base", "Surcharge", "Interest", "Tax Due"
      ]],
      body: tableRows,
      theme: 'grid',
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
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
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

        <div className="border p-4 bg-white rounded-md mt-4 overflow-x-auto">
          <div className="text-center mb-6">
            <h2 className="font-bold text-lg">REPORT OF TRANSFER TAX COMPUTATION</h2>
            <p className="text-sm text-gray-500">Document No: {data.documentNumber}</p>
          </div>

          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 uppercase">
                <th className="border border-gray-300 p-2 text-left">Control No</th>
                <th className="border border-gray-300 p-2 text-left">Transferor</th>
                <th className="border border-gray-300 p-2 text-left">Transferee</th>
                <th className="border border-gray-300 p-2 text-left">TD No</th>
                <th className="border border-gray-300 p-2 text-left">Lot No</th>
                <th className="border border-gray-300 p-2 text-center">Area</th>
                <th className="border border-gray-300 p-2 text-right">Market Value</th>
                <th className="border border-gray-300 p-2 text-right">Consideration</th>
                <th className="border border-gray-300 p-2 text-left">Type</th>
                <th className="border border-gray-300 p-2 text-right">Tax Base</th>
                <th className="border border-gray-300 p-2 text-right">Surcharge</th>
                <th className="border border-gray-300 p-2 text-right">Interest</th>
                <th className="border border-gray-300 p-2 text-right">Tax Due</th>
              </tr>
            </thead>
            <tbody>
              {flattenedDetails.map((d, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-2 font-semibold">{d.controlNo}</td>
                  <td className="border border-gray-300 p-2">{d.transferor}</td>
                  <td className="border border-gray-300 p-2">{d.transferee}</td>
                  <td className="border border-gray-300 p-2">{d.taxdecno}</td>
                  <td className="border border-gray-300 p-2">{d.lotno}</td>
                  <td className="border border-gray-300 p-2 text-center">{d.area}</td>
                  <td className="border border-gray-300 p-2 text-right">{d.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="border border-gray-300 p-2 text-right">{d.consideration.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="border border-gray-300 p-2">{d.transactionType}</td>
                  <td className="border border-gray-300 p-2 text-right">{d.taxbase.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="border border-gray-300 p-2 text-right text-red-600">{d.surcharge.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="border border-gray-300 p-2 text-right text-red-600">{d.interest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="border border-gray-300 p-2 text-right font-bold text-emerald-600">{d.transfertaxdue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={10} className="border border-gray-300 p-2"></td>
                <td colSpan={2} className="border border-gray-300 p-2 text-right font-bold">Over All Tax Due:</td>
                <td className="border border-gray-300 p-2 text-right font-bold">{overAllTaxDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td colSpan={10} className="border border-gray-300 p-2"></td>
                <td colSpan={2} className="border border-gray-300 p-2 text-right font-bold">Total Surcharge:</td>
                <td className="border border-gray-300 p-2 text-right font-bold">{totalSurcharge.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td colSpan={10} className="border border-gray-300 p-2"></td>
                <td colSpan={2} className="border border-gray-300 p-2 text-right font-bold">Total Interest:</td>
                <td className="border border-gray-300 p-2 text-right font-bold">{totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr className="bg-gray-100">
                <td colSpan={10} className="border border-gray-300 p-2"></td>
                <td colSpan={2} className="border border-gray-300 p-2 text-right font-bold text-gray-900">Grand Total:</td>
                <td className="border border-gray-300 p-2 text-right font-black text-emerald-600">{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
          <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700">
            <Printer className="mr-2 h-4 w-4" /> Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
