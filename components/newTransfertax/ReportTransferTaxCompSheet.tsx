"use client";

import React, { useState, useEffect } from 'react';
import {
    Printer,
    Loader2,
    FileText
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TransferTaxCalculator } from '@/lib/tax-calculator';

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
    data: any;
    userName: string;
}

export function ReportTransferTaxCompSheet({
    data,
    userName
}: ReportTransferTaxComputationProps) {
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [base64Logo, setBase64Logo] = useState<string>('');
    const [base64CityLogo, setBase64CityLogo] = useState<string>('');

    useEffect(() => {
        const loadImages = async () => {
            try {
                const logoUrl = '/cto_logo.png';
                const base64 = await loadBase64Image(logoUrl);
                setBase64Logo(base64);

                const cityLogoUrl = '/Tagbilaran-City-Seal-Logo-rev.png';
                const cityBase64 = await loadBase64Image(cityLogoUrl);
                setBase64CityLogo(cityBase64);
            } catch (error) {
                console.error('Error loading images:', error);
            }
        };
        loadImages();
    }, []);

    const downloadAsPDF = async () => {
        setIsGeneratingPdf(true);
        try {
            // Folio dimensions in mm
            const FOLIO_WIDTH = 215.9;
            const FOLIO_HEIGHT = 330.2;
            const M = 12.7; // 0.5 inch margin
            const safeWidth = FOLIO_WIDTH - (M * 2);

            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: [FOLIO_WIDTH, FOLIO_HEIGHT]
            });

            const centerX = FOLIO_WIDTH / 2;
            let currentY = M + 10;

            // Draw Logo Left
            if (base64Logo) {
                pdf.addImage(base64Logo, 'PNG', 15, currentY - 5, 20, 20);
            }

            // Draw Logo Right
            if (base64CityLogo) {
                pdf.addImage(base64CityLogo, 'PNG', FOLIO_WIDTH - 35, currentY - 5, 20, 20);
            }

            // Draw Header
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(0);
            pdf.setFontSize(12);
            pdf.text("Republic of the Philippines", centerX, currentY, { align: "center" });

            currentY += 5;
            pdf.setFontSize(12);
            pdf.text("CITY GOVERNMENT OF TAGBILARAN", centerX, currentY, { align: "center" });

            currentY += 5;
            pdf.setFontSize(11);
            pdf.text("OFFICE OF THE CITY TREASURER", centerX, currentY, { align: "center" });

            currentY += 5;
            pdf.setFontSize(9);
            pdf.setFont("helvetica", "normal");
            pdf.text("Tagbilaran City, Bohol, Philippines", centerX, currentY, { align: "center" });

            currentY += 10;
            pdf.setFontSize(14);
            pdf.setFont("helvetica", "bold");
            pdf.text("TRANSFER TAX COMPUTATION SHEET", centerX, currentY, { align: "center" });

            currentY += 12;

            // Notarial Document Info
            pdf.setFontSize(10);
            pdf.setFont("helvetica", "bold");
            pdf.setFillColor(240, 240, 240);
            pdf.rect(M, currentY - 4, safeWidth, 6, "F");
            pdf.text("NOTARIAL DOCUMENT INFORMATION", M + 2, currentY + 0.5);

            currentY += 7;
            pdf.setFontSize(9);
            pdf.setFont("helvetica", "normal");

            pdf.text(`Document Name: ${data.documentName || ''}`, M, currentY);
            pdf.text(`${data.documentNumber || ''}`, M + 100, currentY);
            currentY += 5;

            pdf.text(`Document Type: ${data.documentType || ''}`, M, currentY);
            pdf.text(`Notarial Date: ${new Date(data.notarialDate).toLocaleDateString()}`, M + 100, currentY);
            currentY += 5;

            pdf.text(`Notarized By: ${data.notarizedBy || ''}`, M, currentY);

            currentY += 10;

            // Transactions Loop
            const transactions = data.newTransferTaxes || [];
            let globalGrandTotal = 0;

            transactions.forEach((tx: any, index: number) => {
                // Check page break
                if (currentY > FOLIO_HEIGHT - 60) {
                    pdf.addPage();
                    currentY = M + 10;
                }

                // Header for NewTransferTax
                pdf.setFontSize(10);
                pdf.setFont("helvetica", "bold");
                pdf.setTextColor(255, 255, 255);
                pdf.setFillColor(41, 128, 185); // Blue header for transaction
                pdf.rect(M, currentY - 4, safeWidth, 6, "F");
                pdf.text(`CONTROL NO: ${tx.t_controlNumber}`, M + 2, currentY + 0.5);

                currentY += 7;
                pdf.setTextColor(0);
                pdf.setFontSize(8);
                pdf.setFont("helvetica", "normal");

                pdf.text(`Date Computed: ${new Date(tx.t_DateCompute).toLocaleDateString()}`, M, currentY);

                const valDate = new Date(tx.t_validity);
                const valStr = valDate.getFullYear() >= 2099 ? "MAXIMUM INTEREST REACHED" : valDate.toLocaleDateString();
                pdf.text(`Validity Date: ${valStr}`, M + 60, currentY);

                pdf.text(`Days Elapsed: ${tx.t_daysElapsed}`, M + 140, currentY);

                currentY += 4;



                // Group Details for NewTransfertaxDetails to create Sub Header and Sub Detail Tables
                const details = [...(tx.t_transfertaxdetails || [])].sort((a: any, b: any) => {
                    if (!a.id || !b.id) return 0;
                    return a.id.localeCompare(b.id);
                });

                const grouped: Record<string, any[]> = {};
                details.forEach((dt: any) => {
                    const key = `${dt.nt_transferror}|${dt.nt_transferee}|${dt.nt_transactiontype}`;
                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push(dt);
                });

                let txTotalTaxDue = 0;
                let txTotalSurcharge = 0;
                let txTotalInterest = 0;
                let txGrandTotal = 0;

                Object.values(grouped).forEach((groupDetails: any) => {
                    const firstDt = groupDetails[0];

                    // Sub Header Table
                    autoTable(pdf, {
                        startY: currentY,
                        margin: { left: M, right: M },
                        headStyles: { fillColor: [240, 240, 240], textColor: 0, fontSize: 7, halign: 'center', fontStyle: 'bold' },
                        bodyStyles: { fontSize: 10, halign: 'center' },
                        head: [["Transferor", "Transferee", "Transaction Type"]],
                        body: [[
                            firstDt.nt_transferror || "N/A",
                            firstDt.nt_transferee || "N/A",
                            firstDt.nt_transactiontype || "N/A"
                        ]],
                        theme: 'grid',
                    });
                    currentY = (pdf as any).lastAutoTable.finalY + 2;

                    let groupTotalMarketValue = 0;
                    let groupConsideration = 0;
                    let groupTaxDue = 0;
                    let groupSurcharge = 0;
                    let groupInterest = 0;

                    // Sub Detail Table
                    const bodyRows = groupDetails.map((dt: any) => {
                        const mv = Number(dt.nt_marketvalue || 0);
                        groupTotalMarketValue += mv;

                        const cons = Number(dt.nt_considerationvalue || 0);
                        groupConsideration += cons;

                        let taxDue = Number(dt.nt_transfertaxDue || dt.nt_transfertaxdue || 0);
                        let surcharge = Number(dt.nt_surcharge || 0);
                        let interest = Number(dt.nt_interest || 0);

                        if (tx.t_status?.toLowerCase() === 'voided') {
                            taxDue = 0;
                            surcharge = 0;
                            interest = 0;
                        }

                        groupTaxDue += taxDue;
                        groupSurcharge += surcharge;
                        groupInterest += interest;

                        return [
                            dt.nt_taxdecnumber || "N/A",
                            dt.nt_lotnumber || "N/A",
                            dt.nt_area || 0,
                            mv.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                            "", // Consideration
                            "", // Tax Base
                            "", // Tax Due
                            "", // Surcharge
                            "", // Interest
                            ""  // Sub Total
                        ];
                    });

                    // Next Row (Summary Row)
                    const transactionType = groupDetails[0]?.nt_transactiontype || "";
                    const groupTaxBase = TransferTaxCalculator.computeBase(
                        transactionType,
                        groupTotalMarketValue,
                        groupConsideration
                    );
                    const groupSubTotal = groupTaxDue + groupSurcharge + groupInterest;

                    txTotalTaxDue += groupTaxDue;
                    txTotalSurcharge += groupSurcharge;
                    txTotalInterest += groupInterest;
                    txGrandTotal += groupSubTotal;

                    bodyRows.push([
                        "TOTAL:",
                        "",
                        "",
                        groupTotalMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                        groupConsideration.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                        groupTaxBase.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                        groupTaxDue.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                        groupSurcharge.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                        groupInterest.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                        groupSubTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })
                    ]);

                    autoTable(pdf, {
                        startY: currentY,
                        margin: { left: M, right: M },
                        headStyles: { fillColor: [250, 250, 250], textColor: 0, fontSize: 6, halign: 'center', fontStyle: 'bold' },
                        bodyStyles: { fontSize: 8 },
                        columnStyles: {
                            2: { halign: 'center' },
                            3: { halign: 'right' },
                            4: { halign: 'right' },
                            5: { halign: 'right' },
                            6: { halign: 'right' },
                            7: { halign: 'right' },
                            8: { halign: 'right' },
                            9: { halign: 'right', fontStyle: 'bold' }
                        },
                        head: [["TD No", "Lot No", "Area", "Market Value", "Consideration", "Tax Base", "Tax Due", "Surcharge", "Interest", "Sub Total"]],
                        body: bodyRows,
                        theme: 'grid',
                    });
                    currentY = (pdf as any).lastAutoTable.finalY + 5;
                });

                // Transaction Totals
                pdf.setFontSize(8);
                pdf.setFont("helvetica", "bold");

                const labelX = FOLIO_WIDTH - M - 60;
                const valueX = FOLIO_WIDTH - M;

                let leftY = currentY;
                if (tx.t_status?.toLowerCase() === 'voided') {
                    pdf.setTextColor(192, 57, 43); // Red
                    pdf.text(`STATUS: VOIDED`, M, leftY);
                    leftY += 4;
                    pdf.setTextColor(0);
                    pdf.setFont("helvetica", "normal");
                    const vDate = tx.t_voidedDate ? new Date(tx.t_voidedDate).toLocaleDateString() : "N/A";
                    pdf.text(`Date Voided: ${vDate}`, M, leftY);
                    leftY += 4;
                    pdf.text(`Voided by: ${tx.t_voidedBy || "N/A"}`, M, leftY);
                    pdf.setFont("helvetica", "bold");
                } else if (tx.t_status === "Paid" || tx.capturedPayment) {
                    pdf.setTextColor(39, 174, 96); // Green
                    pdf.text(`STATUS: PAID`, M, leftY);

                    if (tx.capturedPayment) {
                        pdf.setTextColor(0);
                        pdf.setFont("helvetica", "normal");
                        leftY += 4;
                        pdf.text(`Receipt No: ${tx.capturedPayment.cp_receiptnumber || "N/A"}`, M, leftY);
                        leftY += 4;
                        const pAmount = Number(tx.capturedPayment.cp_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
                        pdf.text(`Amount: Php ${pAmount}`, M, leftY);
                        leftY += 4;
                        const pDate = tx.capturedPayment.cp_paymentDate ? new Date(tx.capturedPayment.cp_paymentDate).toLocaleDateString() : "N/A";
                        pdf.text(`Date Paid: ${pDate}`, M, leftY);
                        leftY += 4;
                        pdf.text(`Mode: ${tx.capturedPayment.cp_modeOfPayment || "N/A"}`, M, leftY);
                        pdf.setFont("helvetica", "bold");
                    }
                } else {
                    pdf.setTextColor(192, 57, 43); // Red
                    pdf.text(`STATUS: PENDING PAYMENT`, M, leftY);
                    pdf.setTextColor(0);
                }

                pdf.setTextColor(0);
                pdf.text("Total Tax Due:", labelX, currentY);
                pdf.text(`Php ${txTotalTaxDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, valueX, currentY, { align: "right" });
                currentY += 4;

                pdf.text("Total Surcharge:", labelX, currentY);
                pdf.text(`Php ${txTotalSurcharge.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, valueX, currentY, { align: "right" });
                currentY += 4;

                pdf.text("Total Interest:", labelX, currentY);
                pdf.text(`Php ${txTotalInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, valueX, currentY, { align: "right" });
                currentY += 4;

                pdf.setFontSize(9);
                pdf.text("Grand Total Tax Due:", labelX, currentY);
                pdf.text(`Php ${txGrandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, valueX, currentY, { align: "right" });

                // Ensure currentY is pushed down enough if leftY went further down
                currentY = Math.max(currentY, leftY) + 10;

                // Add a line separator if not the last transaction
                if (index < transactions.length - 1) {
                    pdf.setDrawColor(200, 200, 200);
                    pdf.line(M, currentY - 5, FOLIO_WIDTH - M, currentY - 5);
                }

                globalGrandTotal += txGrandTotal;
            });

            if (currentY > FOLIO_HEIGHT - 60) {
                pdf.addPage();
                currentY = M + 20;
            }

            currentY += 5;
            pdf.setFillColor(230, 240, 250);
            pdf.rect(FOLIO_WIDTH - M - 80, currentY - 6, 80, 10, "F");

            pdf.setFontSize(11);
            pdf.setFont("helvetica", "bold");
            pdf.text("GRAND TOTAL:", FOLIO_WIDTH - M - 75, currentY + 0.5);
            pdf.text(`PHP ${globalGrandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, FOLIO_WIDTH - M - 5, currentY + 0.5, { align: "right" });

            currentY += 35;
            pdf.setFontSize(9);
            pdf.setFont("helvetica", "normal");

            const leftSignatureX = M + 15;
            const rightSignatureX = centerX + 15;

            pdf.text("Prepared by:", leftSignatureX, currentY);
            pdf.text("Approved by:", rightSignatureX, currentY);

            currentY += 15;
            pdf.setFont("helvetica", "bold");
            pdf.text(userName.toUpperCase(), leftSignatureX + 20, currentY, { align: "center" });
            pdf.text("HUBERT M. INAS, CPA, BCLTE", rightSignatureX + 25, currentY, { align: "center" });

            currentY += 2;
            pdf.setFont("helvetica", "normal");
            pdf.setLineWidth(0.3);
            pdf.line(leftSignatureX, currentY, leftSignatureX + 40, currentY);
            pdf.line(rightSignatureX - 5, currentY, rightSignatureX + 55, currentY);

            currentY += 4;
            pdf.setFontSize(8);
            pdf.text("Authorized Personnel", leftSignatureX + 20, currentY, { align: "center" });
            pdf.text("City Treasurer", rightSignatureX + 25, currentY, { align: "center" });

            // Page numbers
            const pageCount = (pdf as any).internal.getNumberOfPages();
            const hasVoided = transactions.some((tx: any) => tx.t_status?.toLowerCase() === 'voided');

            for (let i = 1; i <= pageCount; i++) {
                pdf.setPage(i);
                
                if (hasVoided) {
                    pdf.setFontSize(100);
                    pdf.setTextColor(255, 200, 200); // Light red color as fallback for opacity
                    if (typeof pdf.saveGraphicsState === 'function') {
                        try {
                            pdf.saveGraphicsState();
                            pdf.setGState(new (pdf as any).GState({opacity: 0.15}));
                            pdf.setTextColor(255, 0, 0); // Solid red with opacity
                            pdf.text("VOIDED", centerX, FOLIO_HEIGHT / 2 + 10, { align: 'center', angle: 45 });
                            pdf.restoreGraphicsState();
                        } catch (e) {
                            // Fallback if GState fails
                            pdf.text("VOIDED", centerX, FOLIO_HEIGHT / 2 + 10, { align: 'center', angle: 45 });
                        }
                    } else {
                        pdf.text("VOIDED", centerX, FOLIO_HEIGHT / 2 + 10, { align: 'center', angle: 45 });
                    }
                }

                pdf.setFontSize(8);
                pdf.setTextColor(150);
                pdf.text(`Page ${i} of ${pageCount}`, centerX, FOLIO_HEIGHT - 10, { align: 'center' });
            }

            const pdfBlobUrl = pdf.output('bloburl');
            window.open(pdfBlobUrl, '_blank');
        } catch (error: any) {
            console.error("PDF Export Error:", error);
            alert(`Error generating PDF: ${error?.message || 'Unknown error'}`);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <Button
            onClick={downloadAsPDF}
            disabled={isGeneratingPdf || !data}
            className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all"
        >
            {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
                <FileText className="w-4 h-4 mr-2" />
            )}
            {isGeneratingPdf ? 'Generating...' : 'Generate Report'}
        </Button>
    );
}
