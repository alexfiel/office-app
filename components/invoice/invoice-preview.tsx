import FinalTaxComputation from "./finalTaxComputation";
import ChainTransfers from "./ChainTransfers";
import { calculateEJSTotals } from "../utils/invoiceCaculations";

import { Download } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import QRCode from "react-qr-code";

import { jsPDF } from "jspdf"
import * as htmlToImage from "html-to-image"
import { useRef } from "react"
import NextImage from "next/image";

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
            notarizedDate: "12/25/2026",
        },
        transactionInfo: {
            type: "DEED OF ABSOLUTE SALE",
            consideration: 100000.00,
            dayselapsed: 100,
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
        preparedByDesignation: "DESIGNATION",
    };

    const isEJS = invoice.transactionInfo.type === "EJS";

    const ejsTotals = isEJS
        ? calculateEJSTotals(invoice.ejsChain || [])
        : null;


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

                <Card className="shadow-lg border-0 ring-1 ring-gray-200">

                    <CardContent className="p-10 bg-white" ref={invoiceRef}>
                        {/* Header Image */}
                        <div className="w-full mb-8 text-center pb-6 border-b-2 border-gray-200">
                            <div className="w-full flex justify-center items-center mb-6 min-h-[100px]">
                                <img src="/header.png" alt="Logo" style={{ width: '550px', height: '80px' }} />
                            </div>
                            <h1 className="text-2xl font-black tracking-widest text-slate-800 uppercase">RPT Transfer Tax Computation Sheet</h1>
                        </div>

                        {/* Summary Info & QR */}
                        <div className="flex justify-between items-start mb-10">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wide w-40">Computation Date:</span>
                                    <span className="text-base font-semibold text-slate-900">{invoice.computationDate}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wide w-40">Validity Date:</span>
                                    <span className="text-base font-semibold text-slate-900">{invoice.validityDate}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wide w-40">Transaction ID:</span>
                                    <span className="text-base font-semibold text-slate-900">{invoice.transactionId}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="bg-white p-3 border-2 border-slate-100 rounded-xl shadow-sm">
                                    <QRCode className="w-24 h-24" value={invoice.qrValue} />
                                </div>
                            </div>
                        </div>

                        {/* Parties */}
                        <div className="grid grid-cols-2 gap-8 mb-10">
                            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Transferee / Buyer</h3>
                                <p className="text-xl font-bold text-slate-900">{invoice.transferee}</p>
                            </div>
                            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Transferor / Seller</h3>
                                <p className="text-xl font-bold text-slate-900">{invoice.transferor}</p>
                            </div>
                        </div>

                        {/* Properties Table */}
                        <div className="mb-10">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Properties Involved</h3>
                            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-100 border-b border-slate-200">
                                        <tr>
                                            <th className="px-5 py-4 text-left font-bold text-slate-600 uppercase tracking-wider text-xs">Tax Declaration No.</th>
                                            <th className="px-5 py-4 text-left font-bold text-slate-600 uppercase tracking-wider text-xs">Lot Number</th>
                                            <th className="px-5 py-4 text-right font-bold text-slate-600 uppercase tracking-wider text-xs">Market Value / SP</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {invoice.properties.map((p: any, i: number) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-5 py-3 text-slate-800 font-medium">{p.tdNo}</td>
                                                <td className="px-5 py-3 text-slate-800">{p.lotNo}</td>
                                                <td className="px-5 py-3 text-right font-semibold text-slate-900">
                                                    ₱ {Number(p.marketValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-800 text-white">
                                        <tr>
                                            <td colSpan={2} className="px-5 py-4 text-right font-bold tracking-wide uppercase text-xs">Total Market Value / SP:</td>
                                            <td className="px-5 py-4 text-right font-bold text-base">
                                                ₱ {Number(invoice.totalMarketValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {invoice.ejsChain && invoice.ejsChain.length > 0 && (
                            <div className="mb-10">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Chain of Transfers</h3>
                                <div className="space-y-4">
                                    <div className="p-5 border-2 border-slate-200 rounded-xl bg-slate-50 relative overflow-hidden shadow-sm">
                                        <div className="absolute top-0 left-0 w-1 bg-slate-400 h-full"></div>
                                        <h4 className="font-bold text-slate-800 uppercase text-xs tracking-wider mb-2">FIRST TRANSFER (EJS)</h4>
                                        <div className="grid grid-cols-2 text-sm">
                                            <div>
                                                <p className="text-slate-500 font-medium">Transferee:</p>
                                                <p className="font-semibold text-slate-900">{invoice.transferee}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 font-medium">Transferor:</p>
                                                <p className="font-semibold text-slate-900">{invoice.transferor}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 text-sm">
                                            <p className="font-medium text-slate-600">Tax Base: ₱ {Number(invoice.computation.taxBase || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                            <p className="font-bold text-slate-900">Tax Due: ₱ {Number(invoice.computation.totalAmountDue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>

                                    {invoice.ejsChain.map((t: any, i: number) => (
                                        <div key={i} className="p-5 border-2 border-slate-200 rounded-xl bg-white relative overflow-hidden shadow-sm">
                                            <div className="absolute top-0 left-0 w-1 bg-slate-400 h-full"></div>
                                            <h4 className="font-bold text-slate-800 uppercase text-xs tracking-wider mb-2">{t.title} ({t.type})</h4>
                                            <div className="grid grid-cols-2 text-sm">
                                                <div>
                                                    <p className="text-slate-500 font-medium">Transferee:</p>
                                                    <p className="font-semibold text-slate-900">{t.transferee}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500 font-medium">Transferor:</p>
                                                    <p className="font-semibold text-slate-900">{t.transferor}</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 text-sm">
                                                <p className="font-mediuem text-slate-600">{t.type === "Adjudication" ? "Area Adjudicated (sq.m.)" : ""}</p>
                                                <p className="font-mediuem text-slate-600">{t.type === "Adjudication" ? t.areaAdjudicated : ""}</p>
                                                <p className="font-mediuem text-slate-600">{t.type === "Adjudication" ? "New Lot Number" : ""}</p>
                                                <p className="font-mediuem text-slate-600">{t.type === "Adjudication" ? t.newLotNumber : ""}</p>
                                                <p className="font-medium text-slate-600">Tax Base: ₱ {Number(t.taxBase || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                <p className="font-bold text-slate-900">Total Tax Due: ₱ {Number(t.totalAmountDue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Computation and Signatures */}
                        <div className="flex gap-10 items-stretch pb-4">
                            <div>
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-5">Document Details</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="grid grid-cols-3"><span className="text-slate-500 font-medium tracking-wide">Document Type</span> <span className="col-span-2 font-semibold text-slate-900">{invoice.documentInfo.type || "N/A"}</span></div>
                                    <div className="grid grid-cols-3"><span className="text-slate-500 font-medium tracking-wide">Doc No.</span> <span className="col-span-2 font-semibold text-slate-900">{invoice.documentInfo.docNo || "N/A"}</span></div>
                                    <div className="grid grid-cols-3"><span className="text-slate-500 font-medium tracking-wide">Page No.</span> <span className="col-span-2 font-semibold text-slate-900">{invoice.documentInfo.pageNo || "N/A"}</span></div>
                                    <div className="grid grid-cols-3"><span className="text-slate-500 font-medium tracking-wide">Book No.</span> <span className="col-span-2 font-semibold text-slate-900">{invoice.documentInfo.bookNo || "N/A"}</span></div>
                                    <div className="grid grid-cols-3"><span className="text-slate-500 font-medium tracking-wide">Notary Public</span> <span className="col-span-2 font-semibold text-slate-900">{invoice.documentInfo.notarizedBy || "N/A"}</span></div>
                                    <div className="grid grid-cols-3"><span className="text-slate-500 font-medium tracking-wide">Notarized Date</span> <span className="col-span-2 font-semibold text-slate-900">{invoice.documentInfo.notarizedDate || invoice.documentInfo.date || "N/A"}</span></div>
                                </div>
                                <hr className="my-5" />
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-5">Transaction Details</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="grid grid-cols-3"><span className="text-slate-500 font-medium tracking-wide">Transaction</span> <span className="col-span-2 font-semibold text-slate-900">{invoice.transactionInfo.type || "N/A"}</span></div>
                                        <div className="grid grid-cols-3"><span className="text-slate-500 font-medium tracking-wide">Consideration</span> <span className="col-span-2 font-semibold text-slate-900">₱ {Number(invoice.transactionInfo.consideration || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                                        <div className="grid grid-cols-3"><span className="text-slate-500 font-medium tracking-wide">Days Elapsed</span> <span className="col-span-2 font-semibold text-slate-900">{invoice.transactionInfo.dayselapsed} days</span></div>
                                        <div className="grid grid-cols-3"><span className="text-slate-500 font-medium tracking-wide">Valid Until</span> <span className="col-span-2 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded inline-block w-fit">{invoice.transactionInfo.validityDate}</span></div>
                                    </div>
                                </div>
                            </div>


                            <div className="w-1/2 p-7 rounded-2xl border-2 border-slate-200 bg-slate-50/80 flex flex-col justify-center shadow-inner relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 bg-primary h-full"></div>
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 border-b-2 border-slate-200 pb-3">Final Tax Computation</h3>

                                <div className="space-y-4 text-sm z-10 relative">

                                    {isEJS ? (

                                        <>
                                            <div className="flex justify-between items-center px-1">
                                                <span className="text-slate-600 font-medium">Total Market Value:</span>
                                                <span className="font-semibold text-slate-800">
                                                    ₱ {Number(invoice.totalMarketValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center pt-4 border-t-2 border-slate-200 border-dashed px-1">
                                                <span className="font-bold text-slate-700">Total Tax Due:</span>
                                                <span className="font-bold text-slate-900">
                                                    ₱ {Number(ejsTotals?.taxDue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>

                                            {invoice.transactionInfo.dayselapsed > 60 && (
                                                <div className="pt-3 pb-2">
                                                    <div className="space-y-2 pl-4 border-l-4 border-red-300 bg-red-50/50 py-2 rounded-r-lg">

                                                        <div className="flex justify-between text-red-800 pr-3">
                                                            <span className="font-medium">Total Surcharge:</span>
                                                            <span className="font-bold">
                                                                ₱ {Number(ejsTotals?.surcharge || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                        </div>

                                                        <div className="flex justify-between text-red-800 pr-3">
                                                            <span className="font-medium">Total Interest:</span>
                                                            <span className="font-bold">
                                                                ₱ {Number(ejsTotals?.interest || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                        </div>

                                                    </div>
                                                </div>
                                            )}
                                        </>

                                    ) : (

                                        <>
                                            <div className="flex justify-between items-center px-1">
                                                <span className="text-slate-600 font-medium">Total Market Value:</span>
                                                <span className="font-semibold text-slate-800">
                                                    ₱ {Number(invoice.totalMarketValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>

                                            {invoice.transactionInfo.type === "Deed of Sale" && (
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-slate-600 font-medium">Consideration:</span>
                                                    <span className="font-semibold text-slate-800">
                                                        ₱ {Number(invoice.transactionInfo.consideration || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center bg-white p-3 rounded-xl border-2 border-slate-100 shadow-sm">
                                                <span className="font-black text-slate-800 uppercase tracking-wider text-xs">Tax Base:</span>
                                                <span className="font-bold text-slate-900 text-base">
                                                    ₱ {Number(invoice.computation.taxBase || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center px-1">
                                                <span className="text-slate-600 font-medium">Tax Rate:</span>
                                                <span className="font-bold text-slate-800 bg-slate-200 px-2 py-0.5 rounded">
                                                    {invoice.computation.taxRate}%
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center pt-4 border-t-2 border-slate-200 border-dashed px-1">
                                                <span className="font-bold text-slate-700">Basic Tax Due:</span>
                                                <span className="font-bold text-slate-900">
                                                    ₱ {Number(invoice.computation.basicTaxDue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>

                                            {invoice.transactionInfo.dayselapsed > 60 && (
                                                <div className="pt-3 pb-2">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-700 uppercase tracking-widest border border-red-200">
                                                            Late Penalty Applied
                                                        </span>
                                                    </div>

                                                    <div className="space-y-2 pl-4 border-l-4 border-red-300 bg-red-50/50 py-2 rounded-r-lg">

                                                        <div className="flex justify-between text-red-800 pr-3">
                                                            <span className="font-medium">Surcharge (25%):</span>
                                                            <span className="font-bold">
                                                                ₱ {Number(invoice.computation.surcharge || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                        </div>

                                                        <div className="flex justify-between text-red-800 pr-3">
                                                            <span className="font-medium">Interest (2% / month):</span>
                                                            <span className="font-bold">
                                                                ₱ {Number(invoice.computation.interest || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                        </div>

                                                    </div>
                                                </div>
                                            )}
                                        </>

                                    )}

                                </div>


                                <div className="mt-6 pt-5 border-t-2 border-slate-800 z-10 relative">
                                    <div className="flex justify-between items-center">
                                        <span className="text-base font-black text-slate-900 uppercase tracking-widest">Grand Total Due</span>
                                        <span className="text-2xl font-black text-primary drop-shadow-sm">
                                            ₱ {Number(
                                                isEJS
                                                    ? ejsTotals?.total || 0
                                                    : invoice.computation.totalAmountDue || 0
                                            ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Document & Transaction Info */}
                        <div className="grid grid-cols-2 gap-10 mb-10 py-8 border-y border-dashed border-slate-300">


                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-8">Prepared by:</p>
                                <div className="border-b-2 border-slate-900 w-[85%] pb-1">
                                    <p className="font-bold text-slate-900 text-lg uppercase truncate">{invoice.preparedBy}</p>
                                </div>
                                <p className="text-xs font-semibold text-slate-500 mt-2 truncate uppercase tracking-widest">{invoice.preparedByDesignation}</p>
                            </div>



                            <div className="space-y-12">


                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-8">Approved by:</p>
                                    <div className="border-b-2 border-slate-900 w-[85%] pb-1 h-7">
                                    </div>
                                    <p className="text-xs font-semibold text-slate-500 mt-2 uppercase tracking-widest">City Treasurer / Authorized Personnel</p>
                                </div>
                            </div>
                        </div>




                    </CardContent>
                </Card>


            </div>
        </div >
    )
}