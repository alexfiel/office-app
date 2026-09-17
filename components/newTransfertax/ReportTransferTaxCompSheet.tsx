/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from 'react';
import {
    Loader2,
    FileText
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculateTaxPenalties } from '@/lib/tax-utils';
import { getActiveHeadOfOfficeSignatory } from '@/lib/actions/signatory-actions';
import { TAX_RATES, MIN_TAX_DUE } from '@/constants/taxRates';
import type { NewTransferTaxDetails } from '@prisma/client';

export type TransferTaxDetailItem = NewTransferTaxDetails & {
    realProperty?: {
        taxdecnumber?: string | null;
        lotnumber?: string | null;
        area?: number | null;
    } | null;
    [key: string]: any;
};

export const formatCurrency = (val: number | string | null | undefined): string => {
    const num = Number(val) || 0;
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatDate = (val: any): string => {
    if (!val) return "N/A";
    const d = new Date(val);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

export const formatValidityDate = (val: any): string => {
    if (!val) return "N/A";
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    if (d.getFullYear() >= 2099) return "MAXIMUM INTEREST REACHED";
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

export interface ProcessedTransactionGroup {
    key: string;
    transferor: string;
    transferee: string;
    transactionType: string;
    firstDt: TransferTaxDetailItem;
    groupDetails: TransferTaxDetailItem[];
    bodyRows: (string | number)[][];
    groupTotalMarketValue: number;
    groupConsideration: number;
    groupTaxBase: number;
    groupTaxDue: number;
    groupSurcharge: number;
    groupInterest: number;
    groupSubTotal: number;
    summaryRow: (string | number)[];
}

export interface ProcessedTransactionResult {
    groups: ProcessedTransactionGroup[];
    txTotalTaxDue: number;
    txTotalSurcharge: number;
    txTotalInterest: number;
    txGrandTotal: number;
    txHasMinimumTaxApplied: boolean;
    isVoided: boolean;
}

export function processTransactionComputation(
    tx: any,
    notarialDate?: string | Date | null
): ProcessedTransactionResult {
    const isVoided = tx.t_status?.toLowerCase() === 'voided';

    const details: TransferTaxDetailItem[] = [...(tx.t_transfertaxdetails || [])].sort((a: any, b: any) => {
        if (!a.id || !b.id) return 0;
        return a.id.localeCompare(b.id);
    });

    const grouped: Record<string, TransferTaxDetailItem[]> = {};
    details.forEach((dt: TransferTaxDetailItem) => {
        const transferor = (dt.nt_transferror || '').trim().toUpperCase();
        const transferee = (dt.nt_transferee || '').trim().toUpperCase();
        const txType = (dt.nt_transactiontype || '').trim().toUpperCase();
        const key = `${transferor}|${transferee}|${txType}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(dt);
    });

    let txTotalTaxDue = 0;
    let txTotalSurcharge = 0;
    let txTotalInterest = 0;
    let txGrandTotal = 0;
    let txHasMinimumTaxApplied = false;

    const groups: ProcessedTransactionGroup[] = Object.values(grouped).map((groupDetails: TransferTaxDetailItem[]) => {
        const firstDt = groupDetails[0];

        let groupTotalMarketValue = 0;

        // Sub Detail Table
        const bodyRows: (string | number)[][] = groupDetails.map((dt: TransferTaxDetailItem) => {
            const mv = Number(dt.nt_marketvalue || 0);
            groupTotalMarketValue += mv;
            const areaVal = Number(dt.nt_area || dt.realProperty?.area || 0);

            return [
                dt.realProperty?.taxdecnumber || dt.nt_taxdecnumber || "N/A",
                dt.realProperty?.lotnumber || dt.nt_lotnumber || "N/A",
                areaVal > 0 ? areaVal.toLocaleString('en-US') : "0",
                formatCurrency(mv),
                "", // Consideration
                "", // Tax Base
                "", // Tax Due
                "", // Surcharge
                "", // Interest
                ""  // Sub Total
            ];
        });

        // Determine Consideration for this transaction group from NewTransferTaxDetails
        const isSaleType = (firstDt.nt_transactiontype || '').toUpperCase().includes('SALE');
        const groupDetailsCons = groupDetails.map((dt: TransferTaxDetailItem) => Number(dt.nt_considerationvalue || 0));
        const sumCons = groupDetailsCons.reduce((sum: number, c: number) => sum + c, 0);
        const maxCons = Math.max(...groupDetailsCons, 0);

        let groupConsideration = 0;
        if (isSaleType) {
            // If all items have the same non-zero consideration (unapportioned duplicate stored on rows), use maxCons, otherwise sumCons
            const allSameNonZero = groupDetailsCons.length > 1 && groupDetailsCons.every(c => c > 0 && Math.abs(c - groupDetailsCons[0]) < 0.01);
            groupConsideration = allSameNonZero ? maxCons : sumCons;
        } else if (sumCons > 0) {
            groupConsideration = sumCons;
        } else {
            groupConsideration = 0;
        }

        // Tax Base = Total Market Value or Consideration, whichever is higher
        const groupTaxBase = Math.max(groupTotalMarketValue, groupConsideration);

        // Tax Due = Total Market Value or Consideration whichever is higher x .0075 (statutory minimum Php 500.00 unless voided)
        const rawCalculatedTax = groupTaxBase * TAX_RATES;
        const groupTaxDue = isVoided ? 0 : Math.max(rawCalculatedTax, MIN_TAX_DUE);

        if (!isVoided && rawCalculatedTax < MIN_TAX_DUE) {
            txHasMinimumTaxApplied = true;
        }

        const notarialDateStr = notarialDate ? new Date(notarialDate).toISOString() : "";
        const penalties = isVoided
            ? { surcharge: 0, interest: 0, totalAmountDue: 0 }
            : calculateTaxPenalties(groupTaxDue, notarialDateStr, tx.t_DateCompute ? new Date(tx.t_DateCompute) : new Date());

        const groupSurcharge = penalties.surcharge;
        const groupInterest = penalties.interest;
        const groupSubTotal = isVoided ? 0 : (groupTaxDue + groupSurcharge + groupInterest);

        txTotalTaxDue += groupTaxDue;
        txTotalSurcharge += groupSurcharge;
        txTotalInterest += groupInterest;
        txGrandTotal += groupSubTotal;

        // Add group TOTAL row presenting the computation
        const summaryRow: (string | number)[] = [
            "TOTAL:",
            "",
            "",
            formatCurrency(groupTotalMarketValue),
            formatCurrency(groupConsideration),
            formatCurrency(groupTaxBase),
            formatCurrency(groupTaxDue),
            formatCurrency(groupSurcharge),
            formatCurrency(groupInterest),
            formatCurrency(groupSubTotal)
        ];

        bodyRows.push(summaryRow);

        return {
            key: `${(firstDt.nt_transferror || '').trim()}|${(firstDt.nt_transferee || '').trim()}|${(firstDt.nt_transactiontype || '').trim()}`,
            transferor: firstDt.nt_transferror || "N/A",
            transferee: firstDt.nt_transferee || "N/A",
            transactionType: firstDt.nt_transactiontype || "N/A",
            firstDt,
            groupDetails,
            bodyRows,
            groupTotalMarketValue,
            groupConsideration,
            groupTaxBase,
            groupTaxDue,
            groupSurcharge,
            groupInterest,
            groupSubTotal,
            summaryRow
        };
    });

    return {
        groups,
        txTotalTaxDue,
        txTotalSurcharge,
        txTotalInterest,
        txGrandTotal,
        txHasMinimumTaxApplied,
        isVoided
    };
}

const loadBase64Image = async (url: string): Promise<string> => {
    try {
        const response = await fetch(url);
        if (!response.ok) return '';
        const blob = await response.blob();
        return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string) || '');
            reader.onerror = () => resolve('');
            reader.readAsDataURL(blob);
        });
    } catch {
        return '';
    }
};

interface ReportTransferTaxComputationProps {
    data: any;
    userName: string;
    preparedBy?: string;
    approver?: {
        name: string;
        designation: string;
        office?: string | null;
        signatureUrl?: string | null;
    };
    className?: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    buttonText?: string;
}

export function ReportTransferTaxCompSheet({
    data,
    userName,
    preparedBy,
    approver,
    className,
    variant,
    buttonText
}: ReportTransferTaxComputationProps) {
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [base64Logo, setBase64Logo] = useState<string>('');
    const [base64CityLogo, setBase64CityLogo] = useState<string>('');
    const [activeApprover, setActiveApprover] = useState<{
        name: string;
        designation: string;
        office?: string | null;
        signatureUrl?: string | null;
    }>(approver || {
        name: "HUBERT M. INAS, CPA, BCLTE",
        designation: "City Treasurer",
        office: "Office of the City Treasurer",
        signatureUrl: "",
    });
    const [base64ApproverSig, setBase64ApproverSig] = useState<string>('');

    useEffect(() => {
        let isMounted = true;

        const loadImagesAndSignatory = async () => {
            // Load logos concurrently without blocking each other
            Promise.allSettled([
                loadBase64Image('/cto_logo.png'),
                loadBase64Image('/Tagbilaran-City-Seal-Logo-rev.png')
            ]).then(([logoRes, cityLogoRes]) => {
                if (!isMounted) return;
                if (logoRes.status === 'fulfilled' && logoRes.value) setBase64Logo(logoRes.value);
                if (cityLogoRes.status === 'fulfilled' && cityLogoRes.value) setBase64CityLogo(cityLogoRes.value);
            });

            try {
                let currentSig = approver;
                if (!currentSig) {
                    const res = await getActiveHeadOfOfficeSignatory();
                    if (res.success && res.data) {
                        currentSig = res.data;
                    }
                }
                if (isMounted && currentSig) {
                    setActiveApprover(currentSig);
                    if (currentSig.signatureUrl) {
                        const sigB64 = await loadBase64Image(currentSig.signatureUrl);
                        if (isMounted && sigB64) {
                            setBase64ApproverSig(sigB64);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching active Head of Office signatory:', error);
            }
        };

        loadImagesAndSignatory();

        return () => {
            isMounted = false;
        };
    }, [approver]);

    const downloadAsPDF = async () => {
        setIsGeneratingPdf(true);
        try {
            // Fallback load images if user clicked immediately before useEffect completed
            let ctoLogo = base64Logo;
            let citySeal = base64CityLogo;
            let approverSig = base64ApproverSig;

            if (!ctoLogo) {
                ctoLogo = await loadBase64Image('/cto_logo.png');
            }
            if (!citySeal) {
                citySeal = await loadBase64Image('/Tagbilaran-City-Seal-Logo-rev.png');
            }
            if (!approverSig && activeApprover?.signatureUrl) {
                approverSig = await loadBase64Image(activeApprover.signatureUrl);
            }

            // Folio dimensions in mm (8.5 x 13 inches)
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
            if (ctoLogo) {
                try {
                    pdf.addImage(ctoLogo, 'PNG', 15, currentY - 5, 20, 20);
                } catch (e) {
                    console.warn('Could not add CTO logo to PDF:', e);
                }
            }

            // Draw Logo Right
            if (citySeal) {
                try {
                    pdf.addImage(citySeal, 'PNG', FOLIO_WIDTH - 35, currentY - 5, 20, 20);
                } catch (e) {
                    console.warn('Could not add City Seal logo to PDF:', e);
                }
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

            const docName = data.documentName || data.notarialDocument?.documentName || '';
            const docType = data.documentType || data.notarialDocument?.documentType || '';
            const docNum = data.documentNumber || data.notarialDocument?.documentNumber || '';
            const notarizedBy = data.notarizedBy || data.notarialDocument?.notarizedBy || '';
            const notarialDate = data.notarialDate || data.notarialDocument?.notarialDate;

            pdf.text(`Document Name: ${docName}`, M, currentY);
            currentY += 5;

            pdf.text(`Document Type: ${docType}`, M, currentY);
            pdf.text(`Document No: ${docNum}`, M + 100, currentY);
            currentY += 5;

            pdf.text(`Notarized By: ${notarizedBy}`, M, currentY);
            pdf.text(`Notarial Date: ${formatDate(notarialDate)}`, M + 100, currentY);

            currentY += 10;

            // Transactions Loop
            const transactions = Array.isArray(data.newTransferTaxes)
                ? data.newTransferTaxes
                : (data.t_controlNumber || data.t_transfertaxdetails ? [data] : []);
            let globalGrandTotal = 0;

            transactions.forEach((tx: any, index: number) => {
                // Check page break before starting a transaction
                if (currentY > FOLIO_HEIGHT - 65) {
                    pdf.addPage();
                    currentY = M + 10;
                }

                const {
                    groups,
                    txTotalTaxDue,
                    txTotalSurcharge,
                    txTotalInterest,
                    txGrandTotal,
                    txHasMinimumTaxApplied,
                    isVoided
                } = processTransactionComputation(tx, notarialDate);

                // Header for NewTransferTax
                pdf.setFontSize(10);
                pdf.setFont("helvetica", "bold");
                pdf.setTextColor(255, 255, 255);
                pdf.setFillColor(41, 128, 185); // Blue header for transaction
                pdf.rect(M, currentY - 4, safeWidth, 6, "F");
                pdf.text(`CONTROL NO: ${tx.t_controlNumber || 'N/A'}`, M + 2, currentY + 0.5);

                currentY += 7;
                pdf.setTextColor(0);
                pdf.setFontSize(8);
                pdf.setFont("helvetica", "normal");

                pdf.text(`Date Computed: ${formatDate(tx.t_DateCompute)}`, M, currentY);
                pdf.text(`Validity Date: ${formatValidityDate(tx.t_validity)}`, M + 60, currentY);
                pdf.text(`Days Elapsed: ${tx.t_daysElapsed ?? 0}`, M + 140, currentY);

                currentY += 4;

                groups.forEach((group) => {
                    // Check page break before sub-header table
                    if (currentY > FOLIO_HEIGHT - 50) {
                        pdf.addPage();
                        currentY = M + 10;
                    }

                    // Sub Header Table
                    autoTable(pdf, {
                        startY: currentY,
                        margin: { left: M, right: M },
                        headStyles: { fillColor: [240, 240, 240], textColor: 0, fontSize: 7, halign: 'center', fontStyle: 'bold' },
                        bodyStyles: { fontSize: 9, halign: 'center' },
                        head: [["Transferor", "Transferee", "Transaction Type"]],
                        body: [[
                            group.transferor,
                            group.transferee,
                            group.transactionType
                        ]],
                        theme: 'grid',
                    });
                    currentY = (pdf as any).lastAutoTable.finalY + 2;

                    autoTable(pdf, {
                        startY: currentY,
                        margin: { left: M, right: M },
                        headStyles: { fillColor: [248, 249, 250], textColor: 0, fontSize: 6.5, halign: 'center', fontStyle: 'bold' },
                        bodyStyles: { fontSize: 7 },
                        columnStyles: {
                            0: { halign: 'left', cellWidth: 24 },
                            1: { halign: 'left', cellWidth: 18 },
                            2: { halign: 'center', cellWidth: 14 },
                            3: { halign: 'right', cellWidth: 22 },
                            4: { halign: 'right', cellWidth: 22 },
                            5: { halign: 'right', cellWidth: 22 },
                            6: { halign: 'right', cellWidth: 18 },
                            7: { halign: 'right', cellWidth: 16 },
                            8: { halign: 'right', cellWidth: 16 },
                            9: { halign: 'right', fontStyle: 'bold', cellWidth: 18.5 }
                        },
                        didParseCell: (hookData) => {
                            if (hookData.section === 'body' && hookData.row.index === group.bodyRows.length - 1) {
                                hookData.cell.styles.fontStyle = 'bold';
                                hookData.cell.styles.fillColor = [240, 244, 248];
                            }
                        },
                        head: [["TD No", "Lot No", "Area", "Market Value", "Consideration", "Tax Base", "Tax Due", "Surcharge", "Interest", "Sub Total"]],
                        body: group.bodyRows,
                        theme: 'grid',
                    });
                    currentY = (pdf as any).lastAutoTable.finalY + 4;
                });

                // Check page break before Transaction Totals
                if (currentY > FOLIO_HEIGHT - 45) {
                    pdf.addPage();
                    currentY = M + 10;
                }

                // Transaction Totals
                pdf.setFontSize(8);
                pdf.setFont("helvetica", "bold");

                const labelX = FOLIO_WIDTH - M - 60;
                const valueX = FOLIO_WIDTH - M;

                let leftY = currentY;
                if (isVoided) {
                    pdf.setTextColor(192, 57, 43); // Red
                    pdf.text(`STATUS: VOIDED`, M, leftY);
                    leftY += 4;
                    pdf.setTextColor(0);
                    pdf.setFont("helvetica", "normal");
                    const vDate = tx.t_voidedDate ? formatDate(tx.t_voidedDate) : "N/A";
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
                        const pAmount = formatCurrency(tx.capturedPayment.cp_amount);
                        pdf.text(`Amount: Php ${pAmount}`, M, leftY);
                        leftY += 4;
                        const pDate = tx.capturedPayment.cp_paymentDate ? formatDate(tx.capturedPayment.cp_paymentDate) : "N/A";
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

                // If minimum tax applied, show clear note on the left side
                if (txHasMinimumTaxApplied && !isVoided) {
                    pdf.setFont("helvetica", "italic");
                    pdf.setFontSize(7.5);
                    pdf.setTextColor(100);
                    pdf.text(`* Minimum Basic Tax Due of Php ${MIN_TAX_DUE.toFixed(2)} applied per City Ordinance.`, M, leftY + 4);
                    leftY += 4;
                    pdf.setTextColor(0);
                    pdf.setFont("helvetica", "bold");
                    pdf.setFontSize(8);
                }

                pdf.setTextColor(0);
                pdf.text("Total Tax Due:", labelX, currentY);
                pdf.text(`Php ${formatCurrency(txTotalTaxDue)}`, valueX, currentY, { align: "right" });
                currentY += 4;

                pdf.text("Total Surcharge:", labelX, currentY);
                pdf.text(`Php ${formatCurrency(txTotalSurcharge)}`, valueX, currentY, { align: "right" });
                currentY += 4;

                pdf.text("Total Interest:", labelX, currentY);
                pdf.text(`Php ${formatCurrency(txTotalInterest)}`, valueX, currentY, { align: "right" });
                currentY += 4;

                pdf.setFontSize(9);
                pdf.text("Grand Total Tax Due:", labelX, currentY);
                pdf.text(`Php ${formatCurrency(txGrandTotal)}`, valueX, currentY, { align: "right" });

                // Ensure currentY is pushed down enough if leftY went further down
                currentY = Math.max(currentY, leftY) + 8;

                // Add a line separator if not the last transaction
                if (index < transactions.length - 1) {
                    pdf.setDrawColor(210, 210, 210);
                    pdf.line(M, currentY - 4, FOLIO_WIDTH - M, currentY - 4);
                }

                globalGrandTotal += txGrandTotal;
            });

            // Ensure sufficient space for Grand Total banner + signatures
            if (currentY > FOLIO_HEIGHT - 65) {
                pdf.addPage();
                currentY = M + 15;
            }

            currentY += 4;
            pdf.setFillColor(230, 240, 250);
            pdf.rect(FOLIO_WIDTH - M - 85, currentY - 6, 85, 10, "F");

            pdf.setFontSize(10);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(0);
            pdf.text("GRAND TOTAL:", FOLIO_WIDTH - M - 80, currentY + 0.5);
            pdf.text(`PHP ${formatCurrency(globalGrandTotal)}`, FOLIO_WIDTH - M - 4, currentY + 0.5, { align: "right" });

            currentY += 28;
            pdf.setFontSize(9);
            pdf.setFont("helvetica", "normal");

            const leftSignatureX = M + 15;
            const rightSignatureX = centerX + 15;

            pdf.text("Computed by:", leftSignatureX, currentY);
            pdf.text("Approved by:", rightSignatureX, currentY);

            // Approver signature image
            if (approverSig) {
                try {
                    pdf.addImage(approverSig, 'PNG', rightSignatureX + 10, currentY + 1, 30, 12);
                } catch (e) {
                    console.warn("Could not render approver signature image:", e);
                }
            }

            // User who created/computed the computation
            const creatorName =
                preparedBy ||
                data?.newTransferTaxes?.find((tx: any) => tx.user?.name)?.user?.name ||
                data?.newTransferTaxes?.[0]?.user?.name ||
                data?.user?.name ||
                data?.computedBy ||
                data?.preparedBy ||
                userName ||
                "Authorized Personnel";

            const creatorDesignation =
                data?.newTransferTaxes?.find((tx: any) => tx.user?.designation)?.user?.designation ||
                data?.newTransferTaxes?.[0]?.user?.designation ||
                data?.user?.designation ||
                "Authorized Personnel";

            currentY += 15;
            pdf.setFont("helvetica", "bold");
            pdf.text(creatorName.toUpperCase(), leftSignatureX + 20, currentY, { align: "center" });

            const approverName = (activeApprover?.name || "HUBERT M. INAS, CPA, BCLTE").toUpperCase();
            pdf.text(approverName, rightSignatureX + 25, currentY, { align: "center" });

            currentY += 2;
            pdf.setFont("helvetica", "normal");
            pdf.setLineWidth(0.3);
            pdf.line(leftSignatureX, currentY, leftSignatureX + 40, currentY);
            pdf.line(rightSignatureX - 5, currentY, rightSignatureX + 55, currentY);

            currentY += 4;
            pdf.setFontSize(8);
            pdf.text(creatorDesignation, leftSignatureX + 20, currentY, { align: "center" });

            const approverDesignation = activeApprover?.designation || "City Treasurer";
            pdf.text(approverDesignation, rightSignatureX + 25, currentY, { align: "center" });

            // Page numbers and footer
            const pageCount = (pdf as any).internal.getNumberOfPages();
            const allVoided = transactions.length > 0 && transactions.every((tx: any) => tx.t_status?.toLowerCase() === 'voided');

            const now = new Date();
            const printDateTime = now.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });

            for (let i = 1; i <= pageCount; i++) {
                pdf.setPage(i);

                if (allVoided) {
                    pdf.setFontSize(100);
                    pdf.setTextColor(255, 200, 200); // Light red fallback
                    if (typeof pdf.saveGraphicsState === 'function') {
                        try {
                            pdf.saveGraphicsState();
                            pdf.setGState(new (pdf as any).GState({ opacity: 0.15 }));
                            pdf.setTextColor(255, 0, 0); // Solid red with opacity
                            pdf.text("VOIDED", centerX, FOLIO_HEIGHT / 2 + 10, { align: 'center', angle: 45 });
                            pdf.restoreGraphicsState();
                        } catch {
                            pdf.text("VOIDED", centerX, FOLIO_HEIGHT / 2 + 10, { align: 'center', angle: 45 });
                        }
                    } else {
                        pdf.text("VOIDED", centerX, FOLIO_HEIGHT / 2 + 10, { align: 'center', angle: 45 });
                    }
                }

                pdf.setFontSize(8);
                pdf.setTextColor(130);
                pdf.text(`Printed by: ${userName} | ${printDateTime}`, M, FOLIO_HEIGHT - 10);
                pdf.text(`Page ${i} of ${pageCount}`, FOLIO_WIDTH - M, FOLIO_HEIGHT - 10, { align: 'right' });
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
            variant={variant || "default"}
            className={className || "bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all"}
        >
            {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
                <FileText className="w-4 h-4 mr-2" />
            )}
            {isGeneratingPdf ? 'Generating...' : (buttonText || 'Generate Report')}
        </Button>
    );
}
