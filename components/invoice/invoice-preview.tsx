import { Download } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import QRCode from "react-qr-code";

import { jsPDF } from "jspdf"
import * as htmlToImage from "html-to-image"
import { useRef } from "react"

export default function InvoicePreview({ data, onBack }: { data?: any, onBack?: () => void }) {
    const invoiceRef = useRef<HTMLDivElement>(null)

    const handleDownloadPdf = async () => {
        if (!invoiceRef.current) return;
        try {
            const dataUrl = await htmlToImage.toPng(invoiceRef.current, { pixelRatio: 2 });
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: [219, 279]
            });
            const pdfWidth = pdf.internal.pageSize.getWidth();

            const img = new Image();
            img.src = dataUrl;
            await new Promise((resolve) => {
                img.onload = () => resolve(img);
            });
            const margin = 12.7; // 0.5 inches in mm
            const pageHeight = pdf.internal.pageSize.getHeight();
            
            const printableWidthMM = pdfWidth - (2 * margin);
            const printableHeightMM = pageHeight - (2 * margin);
            
            const scale = img.width / printableWidthMM;
            const pixelHeightPerPage = printableHeightMM * scale;

            let remainingHeight = img.height;
            let currentY = 0;
            let isFirstPage = true;

            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0);

            while (remainingHeight > 0) {
                if (!isFirstPage) pdf.addPage();
                
                const sliceHeight = Math.min(pixelHeightPerPage, remainingHeight);
                const sliceCanvas = document.createElement("canvas");
                sliceCanvas.width = canvas.width;
                sliceCanvas.height = sliceHeight;
                const sliceCtx = sliceCanvas.getContext("2d");
                
                sliceCtx?.drawImage(
                    canvas, 
                    0, currentY, canvas.width, sliceHeight, 
                    0, 0, sliceCanvas.width, sliceHeight
                );
                
                const sliceDataUrl = sliceCanvas.toDataURL("image/png");
                const sliceHeightMM = sliceHeight / scale;
                
                pdf.addImage(sliceDataUrl, 'PNG', margin, margin, printableWidthMM, sliceHeightMM);
                
                remainingHeight -= sliceHeight;
                currentY += sliceHeight;
                isFirstPage = false;
            }

            pdf.save(`invoice-${data?.transactionId || 'preview'}.pdf`);
        } catch (error) {
            console.error('Error generating PDF', error);
        }
    };

    const invoice = data || {
        transferee: "JUAN DELA CRUZ",
        transferor: "JUAN DELA CRUZ",
        computationDate: new Date().toLocaleDateString(),
        validityDate: new Date().toLocaleDateString(),
        transactionId: "TRANSFERTAX-00293",
        qrValue: "ID: TRANSFERTAX-00293\nTransferee: JUAN DELA CRUZ\nAmount Due: P 123,456.23\nValidity Date: 12/25/2026",
        properties: [
            { tdNo: "01-0002B-0212", lotNo: "1-B-C-1", marketValue: 785952.23 }
        ],
        totalMarketValue: 785952.23,
        documentInfo: {
            type: "Deed of Absolute Sale",
            docNo: "123456789",
            pageNo: "123456789",
            bookNo: "123456789",
            notarizedBy: "ATTY. JUAN DE LA CRUZ",
        },
        transactionInfo: {
            type: "DEED OF ABSOLUTE SALE",
            consideration: 100000.00,
            daysFromNotarial: 100,
            validityDate: "12/25/2026",
        },
        computation: {
            taxBase: 123456.23,
            taxRate: 0.75,
            basicTaxDue: 123456.23,
            surcharge: 123456.23,
            interest: 123456.23,
            totalAmountDue: 123456.23,
        },
        preparedBy: "USER",
        preparedByRole: "ROLE",
    };


    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">RPT TRANSFER TAX COMPUTATION SHEET</h1>
                    <div className="space-x-2" >
                        <Button variant="outline" onClick={onBack}>
                            Back to Form
                        </Button>
                        <Button onClick={handleDownloadPdf}>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                        </Button>
                    </div>
                </div>

                <Card>

                    <CardContent className="p-8" ref={invoiceRef}>
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <p className="text-gray-600">Republic of the Philippines</p>
                                <p className="text-gray-600">Province of Bohol</p>
                                <p className="text-gray-600">City of Tagbilaran</p>
                                <br />
                                <h2 className="text-2xl font-bold">CITY TREASURER'S OFFICE </h2>
                            </div>
                            <div className="text-right">
                                <QRCode className="w-20 h-20 p-2 mb-4 ml-auto" value={invoice.qrValue} />
                                <br />
                                <p className="text-gray-600">Computation Date: {invoice.computationDate}</p>
                                <p className="text-gray-600">Validity Date: {invoice.validityDate}</p>

                            </div>

                        </div>
                        <h1 className="text-center text-lg font-bold">Transfer Tax Computation Sheet </h1>
                        <div className="grid grid-cols-2 gap-4 mb-8 text-lg">

                            <div>
                                <p>Transferee</p>
                                <p className="font-bold">{invoice.transferee}</p>

                                <hr className="my-2" />

                                <p>Transferor</p>
                                <p className="font-bold">{invoice.transferor}</p>
                                <hr className="my-2" />

                            </div>

                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Properties computation</h3>
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="bg-muted text-muted-foreground">
                                        <th className="px-2 py-1 text-left font-medium">TD No</th>
                                        <th className="px-2 py-1 text-left font-medium">Lot No</th>
                                        <th className="px-2 py-1 text-right font-medium">Market Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.properties.map((p: any, i: number) => (
                                        <tr key={i} className="border-b">
                                            <td className="px-2 py-1">{p.tdNo}</td>
                                            <td className="px-2 py-1">{p.lotNo}</td>
                                            <td className="px-2 py-1 text-right">P {Number(p.marketValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="font-bold border-t-2">
                                        <td colSpan={2} className="px-2 py-2 text-right">Total Market Value:</td>
                                        <td className="px-2 py-2 text-right">P {Number(invoice.totalMarketValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-b pb-4 mt-6">
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Document Info</h3>
                                <p className="mt-1 font-medium">{invoice.documentInfo.type || "N/A"}</p>
                                <p className="text-sm text-muted-foreground">Doc No: {invoice.documentInfo.docNo || "N/A"}</p>
                                <p className="text-sm text-muted-foreground">Page No: {invoice.documentInfo.pageNo || "N/A"}</p>
                                <p className="text-sm text-muted-foreground">Book No: {invoice.documentInfo.bookNo || "N/A"}</p>
                                <p className="text-sm text-muted-foreground">Notarized By: {invoice.documentInfo.notarizedBy || "N/A"}</p>

                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Transaction Info</h3>
                                <p className="mt-1 font-medium">Transaction: {invoice.transactionInfo.type || "N/A"}</p>
                                <p className="text-sm text-muted-foreground">Consideration: P {Number(invoice.transactionInfo.consideration || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                <p className="text-sm text-muted-foreground">{invoice.transactionInfo.daysFromNotarial} days from Notarial Date</p>
                                <p className="text-sm text-muted-foreground">Computation Valid Until: {invoice.transactionInfo.validityDate}</p>
                            </div>
                        </div>

                        <div className="mt-5 border-b ml-0 mr-4 pb-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Transfer Tax Computation</h3>
                            <div className="flex justify-between items-end gap-8 mt-2">
                                <div className="space-y-1 text-sm bg-muted/20 p-4 rounded-md border w-[50%]">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Market Value:</span>
                                        <span>P {Number(invoice.totalMarketValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    {invoice.transactionInfo.type === "Deed of Sale" && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Consideration:</span>
                                            <span>P {Number(invoice.transactionInfo.consideration || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-medium">
                                        <span>Tax Base:</span>
                                        <span>P {Number(invoice.computation.taxBase || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Tax Rate:</span>
                                        <span>{invoice.computation.taxRate}%</span>
                                    </div>
                                    <div className="flex justify-between font-bold pt-2 border-t mt-1">
                                        <span>Basic Tax Due:</span>
                                        <span>P {Number(invoice.computation.basicTaxDue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>

                                    {invoice.transactionInfo.daysFromNotarial > 60 && (
                                        <div className="pt-2">
                                            <p className="text-xs text-destructive mb-1 font-medium">
                                                Late payment ({invoice.transactionInfo.daysFromNotarial} days from Notarial Date)
                                            </p>
                                            <div className="flex justify-between text-destructive">
                                                <span>Surcharge (25%):</span>
                                                <span>P {Number(invoice.computation.surcharge || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between text-destructive">
                                                <span>Interest (2% / month):</span>
                                                <span>P {Number(invoice.computation.interest || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-lg font-bold pt-3 border-t text-primary mt-2">
                                        <span>Total Amount Due:</span>
                                        <span>P {Number(invoice.computation.totalAmountDue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>

                                </div>
                                <div className="w-[50%] grid grid-cols-2 gap-8 break-inside-avoid pb-2 align-center">
                                    <div>
                                        <p className="text-xs mb-8">Prepared by:</p>
                                        <p className="font-bold border-b border-black w-[90%] pb-1 uppercase truncate">{invoice.preparedBy}</p>
                                        <p className="text-xs mt-1 truncate">{invoice.preparedByRole}</p>
                                        <hr className="my-4" />

                                        <p className="text-xs mb-8">Approved by:</p>
                                        <p className="font-bold border-b border-black w-[90%] pb-1 uppercase"></p>
                                        <p className="text-xs mt-1">City Treasurer / Authorized Personnel</p>
                                    </div>
                                </div>
                            </div>

                        </div>


                    </CardContent>
                </Card>


            </div>
        </div>
    )
}