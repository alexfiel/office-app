"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Fetches all Liquidations that have NOT yet been assigned to a Report of Disbursement
 */
export async function getUnreportedLiquidations() {
    try {
        const liquidations = await prisma.externalFVLiquidation.findMany({
            where: {
                reportOfDisbursementId: null
            },
            include: {
                settlements: {
                    include: {
                        transactions: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Map and serialize Decimals
        return liquidations.map(liq => ({
            ...liq,
            totalAmount: Number(liq.totalAmount),
            settlements: liq.settlements.map(set => ({
                ...set,
                totalAmount: Number(set.totalAmount),
                transactions: set.transactions.map(tx => ({
                    ...tx,
                    amount: Number(tx.amount)
                }))
            }))
        }));
    } catch (error) {
        console.error("Failed to fetch unreported liquidations:", error);
        throw new Error("Failed to fetch liquidations");
    }
}

/**
 * Fetches active Cash Advance Vouchers
 */
export async function getActiveCashAdvances() {
    try {
        const cas = await prisma.cashAdvanceVoucher.findMany({
            where: {
                status: 'ACTIVE'
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return cas.map(ca => ({
            ...ca,
            amount: Number(ca.amount),
            balance: Number(ca.balance)
        }));
    } catch (error) {
        console.error("Failed to fetch cash advances:", error);
        throw new Error("Failed to fetch cash advances");
    }
}

/**
 * Creates a SINGLE Report of Disbursement with multiple Granular Barangay details
 */
export async function createReportOfDisbursement(data: {
    cashAdvanceVoucherId: string;
    liquidationIds: string[];
    userId: string;
    reportGroups: {
        barangay: string;
        noOfVouchers: number;
        amount: number;
        details: { liquidationNo: string, liquidationDate: Date, noOfVouchers: number, amount: number }[];
    }[];
}) {
    try {
        return await prisma.$transaction(async (tx) => {
            // 1. Verify balance
            const ca = await tx.cashAdvanceVoucher.findUnique({
                where: { id: data.cashAdvanceVoucherId }
            });

            if (!ca) throw new Error("Cash Advance Voucher not found");

            const totalAmount = data.reportGroups.reduce((sum, g) => sum + g.amount, 0);
            const currentBalance = Number(ca.balance);
            if (currentBalance < totalAmount) {
                throw new Error(`Insufficient balance. Total: ${totalAmount}, Available: ${currentBalance}`);
            }

            const year = new Date().getFullYear();
            const prefix = `ROD-${year}-`;
            
            // Generate sequence
            const lastReport = await tx.externalReportofDisbursement.findFirst({
                where: { reportNumber: { startsWith: prefix } },
                orderBy: { reportNumber: 'desc' }
            });

            let sequence = 1;
            if (lastReport) {
                const parts = lastReport.reportNumber.split('-');
                const lastSeqStr = parts[parts.length - 1];
                if (lastSeqStr && !isNaN(parseInt(lastSeqStr))) {
                    sequence = parseInt(lastSeqStr) + 1;
                }
            }
            const reportNumber = `${prefix}${sequence.toString().padStart(6, '0')}`;

            // Flatten all details from all groups
            const allDetails = data.reportGroups.flatMap(group => 
                group.details.map(d => ({
                    barangay: group.barangay,
                    liquidationNo: d.liquidationNo,
                    liquidationDate: new Date(d.liquidationDate),
                    numberOfVouchers: d.noOfVouchers,
                    totalVoucherAmount: d.amount
                }))
            );

            // 2. Create the Report
            const report = await tx.externalReportofDisbursement.create({
                data: {
                    reportNumber: reportNumber,
                    totalAmount: totalAmount,
                    userId: data.userId,
                    cashAdvanceVoucherId: data.cashAdvanceVoucherId,
                    // Link Liquidations
                    liquidations: {
                        connect: data.liquidationIds.map(id => ({ id }))
                    },
                    // Create Detailed Line Items
                    details: {
                        create: allDetails
                    }
                },
                include: {
                    details: true,
                    liquidations: true,
                    cashAdvanceVoucher: true,
                    user: true
                }
            });

            // 3. Update Cash Advance Balance
            await tx.cashAdvanceVoucher.update({
                where: { id: data.cashAdvanceVoucherId },
                data: {
                    balance: currentBalance - totalAmount
                }
            });

            // Serialize return value
            return {
                ...report,
                totalAmount: Number(report.totalAmount),
                details: report.details.map(d => ({
                    ...d,
                    totalVoucherAmount: Number(d.totalVoucherAmount)
                })),
                liquidations: report.liquidations.map(l => ({
                    ...l,
                    totalAmount: Number(l.totalAmount)
                })),
                cashAdvanceVoucher: report.cashAdvanceVoucher ? {
                    ...report.cashAdvanceVoucher,
                    balance: Number(report.cashAdvanceVoucher.balance),
                    amount: Number(report.cashAdvanceVoucher.amount)
                } : null
            };
        });
    } catch (error: any) {
        console.error("Failed to create report of disbursement:", error);
        throw new Error(error.message || "Failed to create report");
    } finally {
        revalidatePath("/foodvoucherExternalSettlement");
        revalidatePath("/foodvoucher");
    }
}

/**
 * Fetches all created Reports of Disbursement
 */
export async function getDisbursementReports() {
    try {
        const reports = await prisma.externalReportofDisbursement.findMany({
            include: {
                details: true,
                cashAdvanceVoucher: true,
                user: true,
                liquidations: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return reports.map(report => ({
            ...report,
            totalAmount: Number(report.totalAmount),
            details: report.details.map(d => ({
                ...d,
                totalVoucherAmount: Number(d.totalVoucherAmount)
            })),
            liquidations: report.liquidations.map(l => ({
                ...l,
                totalAmount: Number(l.totalAmount)
            })),
            cashAdvanceVoucher: report.cashAdvanceVoucher ? {
                ...report.cashAdvanceVoucher,
                balance: Number(report.cashAdvanceVoucher.balance),
                amount: Number(report.cashAdvanceVoucher.amount)
            } : null
        }));
    } catch (error) {
        console.error("Failed to fetch disbursement reports:", error);
        throw new Error("Failed to fetch reports");
    }
}

/**
 * Deletes a Report of Disbursement and restores the Cash Advance balance
 */
export async function deleteReportOfDisbursement(reportId: string) {
    try {
        return await prisma.$transaction(async (tx) => {
            const report = await tx.externalReportofDisbursement.findUnique({
                where: { id: reportId },
                include: { details: true, cashAdvanceVoucher: true }
            });

            if (!report) throw new Error("Report not found");

            // Restore balance if it was linked to a cash advance
            if (report.cashAdvanceVoucher) {
                await tx.cashAdvanceVoucher.update({
                    where: { id: report.cashAdvanceVoucher.id },
                    data: {
                        balance: {
                            increment: report.totalAmount
                        }
                    }
                });
            }

            // 1. Delete details first to avoid FK constraint violation
            await tx.externalReportofDisbursementDetails.deleteMany({
                where: { externalReportofDisbursementId: reportId }
            });

            // 2. Delete the parent report
            await tx.externalReportofDisbursement.delete({
                where: { id: reportId }
            });

            return { success: true };
        });
    } catch (error: any) {
        console.error("Failed to delete report:", error);
        throw new Error(error.message || "Failed to delete report");
    } finally {
        revalidatePath("/foodvoucherExternalSettlement");
    }
}
