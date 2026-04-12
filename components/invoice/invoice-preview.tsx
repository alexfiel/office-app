
import { calculateEJSTotals } from "../utils/invoiceCaculations";

import { Download } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import QRCode from "react-qr-code";

import { jsPDF } from "jspdf"
import * as htmlToImage from "html-to-image"
import { useRef } from "react"
import NextImage from "next/image";
import { PropertyTable } from "./invoice-property-table";
import { ChainOfTransfers } from "./invoice-chain-of-transfers";
import { DetailsBlock } from "./invoice-doc-details-block";
import { TaxBreakdown } from "./invoice-taxbreakdown";
import { SignatureBlock } from "./invoice-signature";
import { InvoiceHeader } from "./invoice-header";
import { TransactionSummary } from "./invoice-transaction-summary";
import { PartiesSection } from "./invoice-parties";

export default function InvoicePreview({ data, onBack }: { data?: any, onBack?: () => void }) {
    const invoiceRef = useRef<HTMLDivElement>(null)

    // 1. RE-ESTABLISH THE DATA LOGIC
    const invoice = data || {
        transferee: "N/A",
        transferor: "N/A",
        computationDate: new Date().toLocaleDateString(), // DEFAULT TO TODAY
        validityDate: "N/A",
        transactionId: "PREVIEW",
        properties: [],
        totalMarketValue: 0,
        documentInfo: {},
        transactionInfo: { type: "Standard", consideration: 0, dayselapsed: 0 },
        computation: { taxBase: 0, taxRate: 0, basicTaxDue: 0, totalAmountDue: 0 },
        preparedBy: "Staff",
        preparedByDesignation: "Assessor"
    };

    const isEJS = invoice.transactionInfo?.type === "DEED OF EXTRAJUDICIAL SETTLEMENT";
    const ejsTotals = isEJS ? calculateEJSTotals(invoice.ejsChain || [], invoice.computation) : null;

    const formatCurrency = (val: number) =>
        `₱ ${Number(val || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    const handleDownloadPdf = async () => {
        if (!invoiceRef.current) return;
        try {
            const dataUrl = await htmlToImage.toPng(invoiceRef.current, {
                pixelRatio: 2,
                skipFonts: true,
                cacheBust: true,
            });

            const folioWidth = 215.9;
            const folioHeight = 330.2;
            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: [folioWidth, folioHeight] });

            const img = new Image();
            img.crossOrigin = "anonymous";
            await new Promise((resolve) => {
                img.onload = resolve;
                img.src = dataUrl;
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const sideMargin = 12.7;
            const topMargin = 0.25;
            const footerBottomOffset = 10;

            const printableWidthMM = pdfWidth - (2 * sideMargin);
            const printableHeightMM = pdfHeight - topMargin - 20;

            const scale = img.width / printableWidthMM;
            const pixelHeightPerPage = printableHeightMM * scale;

            // --- FIX 1: CALCULATE REAL TOTAL PAGES BY IGNORING TINY OVERFLOWS ---
            const PIXEL_THRESHOLD = 20; // Ignore overlaps smaller than 20px
            const totalPages = Math.max(1, Math.ceil((img.height - PIXEL_THRESHOLD) / pixelHeightPerPage));

            let remainingHeight = img.height;
            let currentY = 0;
            let currentPage = 1;

            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            }

            // --- FIX 2: STOP LOOP IF REMAINING CONTENT IS NEGLIGIBLE ---
            while (remainingHeight > PIXEL_THRESHOLD && currentPage <= totalPages) {
                if (currentPage > 1) pdf.addPage();

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

                pdf.addImage(sliceDataUrl, 'PNG', sideMargin, topMargin, printableWidthMM, sliceHeightMM);

                // RENDER DYNAMIC FOOTER
                pdf.setFontSize(9);
                pdf.setTextColor(150);
                const pageText = `Page ${currentPage} of ${totalPages}`;
                const textWidth = pdf.getStringUnitWidth(pageText) * pdf.getFontSize() / pdf.internal.scaleFactor;
                const xPosition = (pdfWidth - textWidth) / 2;
                pdf.text(pageText, xPosition, pdfHeight - footerBottomOffset);

                remainingHeight -= sliceHeight;
                currentY += sliceHeight;
                currentPage++;
            }

            pdf.save(`invoice-${data?.transactionId || 'preview'}.pdf`);
        } catch (error) {
            console.error('PDF Error:', error);
        }
    };
    // 2. WRAP EVERYTHING IN A FRAGMENT (<> ... </>)
    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            {/* Header/Buttons (not part of the printed PDF) */}
            <div className="max-w-4xl mx-auto flex justify-between mb-4">
                <Button onClick={onBack} variant="outline">Back</Button>
                <Button onClick={handleDownloadPdf}>Download PDF</Button>
            </div>


            <Card className="max-w-4xl mx-auto shadow-lg">
                <CardContent className="p-10 bg-white" ref={invoiceRef}>
                    {/* 1. TOP GRID: HEADER (LEFT) & SUMMARY (RIGHT) */}
                    <div className="grid grid-cols-3 gap-5 mb-1 pb-1 items-center">

                        {/* LEFT COLUMN: Header (Logo & Title) */}
                        <div className="col-span-2">
                            <InvoiceHeader />
                        </div>

                        {/* RIGHT COLUMN: Transaction Summary (QR & Details) */}
                        <div className="col-span-1">
                            <TransactionSummary invoice={invoice} />
                        </div>

                    </div>

                    <PartiesSection
                        invoice={invoice}
                    />

                    <PropertyTable
                        properties={invoice.properties}
                        totalMarketValue={invoice.totalMarketValue}
                    />

                    <ChainOfTransfers
                        invoice={invoice}
                        formatCurrency={formatCurrency}
                    />

                    <div className="flex gap-10 items-stretch pb-4">
                        <DetailsBlock
                            invoice={invoice}
                            formatCurrency={formatCurrency}
                        />

                        <TaxBreakdown
                            invoice={invoice}
                            isEJS={isEJS}
                            ejsTotals={ejsTotals}
                        />
                    </div>

                    <SignatureBlock
                        preparedBy={invoice.preparedBy}
                        designation={invoice.preparedByDesignation}
                    />
                </CardContent>
            </Card>
        </div>
    );
}