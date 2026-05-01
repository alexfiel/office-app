"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type ExternalTransactionData = {
    voucherCode: string
    beneficiary: string
    amount: number
    createdAt: string | Date
}

export type ExternalSettlementData = {
    arNo: string
    batchNo: string
    vendorName: string
    totalTransactions: number
    totalAmount: number
    datePaid: string | Date
    market?: string
    stallNo?: string
    transactions: ExternalTransactionData[]
}

export async function uploadExternalSettlements(
    userId: string,
    settlements: ExternalSettlementData[]
) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const createdSettlements = [];

            for (const settlementData of settlements) {
                const { transactions, ...sData } = settlementData;

                // Create the settlement
                const settlement = await tx.externalFVSettlement.create({
                    data: {
                        arNo: sData.arNo,
                        batchNo: sData.batchNo,
                        vendorName: sData.vendorName,
                        totalTransactions: sData.totalTransactions,
                        totalAmount: sData.totalAmount,
                        datePaid: new Date(sData.datePaid),
                        market: sData.market,
                        stallNo: sData.stallNo,
                        userId: userId,
                        transactions: {
                            create: transactions.map(t => ({
                                voucherCode: t.voucherCode,
                                beneficiary: t.beneficiary,
                                amount: t.amount,
                                createdAt: new Date(t.createdAt)
                            }))
                        }
                    }
                });
                createdSettlements.push(settlement);
            }
            return createdSettlements;
        });

        revalidatePath("/foodvoucherExternalSettlement");
        return { success: true, count: result.length };
    } catch (error: any) {
        console.error("Failed to upload external settlements:", error);
        if (error.code === 'P2002') {
            throw new Error(`Duplicate AR Number found: ${error.meta?.target}`);
        }
        throw new Error(error.message || "Failed to upload settlements");
    }
}

export async function getExternalSettlements() {
    return await prisma.externalFVSettlement.findMany({
        where: {
            status: "forLiquidation"
        },
        include: {
            transactions: true
        },
        orderBy: {
            datePaid: 'desc'
        }
    });
}

export async function createExternalFVLiquidation(
    userId: string,
    settlementIds: string[]
) {
    try {
        // Generate the next liquidation number: CTO-FVLIQ-00000
        const lastLiquidation = await prisma.externalFVLiquidation.findFirst({
            orderBy: { createdAt: 'desc' }
        });

        let nextNumber = 1;
        if (lastLiquidation && lastLiquidation.liquidationNo.includes('-')) {
            const parts = lastLiquidation.liquidationNo.split('-');
            const lastNum = parseInt(parts[parts.length - 1]);
            if (!isNaN(lastNum)) {
                nextNumber = lastNum + 1;
            }
        }

        const liquidationNo = `CTO-FVLIQ-${nextNumber.toString().padStart(5, '0')}`;

        const totalAmount = await prisma.externalFVSettlement.aggregate({
            where: {
                id: { in: settlementIds }
            },
            _sum: {
                totalAmount: true
            }
        });

        const liquidation = await prisma.$transaction(async (tx) => {
            // Create the liquidation record
            const newLiquidation = await tx.externalFVLiquidation.create({
                data: {
                    liquidationNo: liquidationNo,
                    totalAmount: totalAmount._sum.totalAmount || 0,
                    userId: userId,
                }
            });

            // Update all selected settlements
            await tx.externalFVSettlement.updateMany({
                where: {
                    id: { in: settlementIds }
                },
                data: {
                    status: "liquidated",
                    liquidationId: newLiquidation.id
                }
            });

            return newLiquidation;
        });

        revalidatePath("/foodvoucherExternalSettlement");
        return { success: true, liquidationId: liquidation.id };
    } catch (error: any) {
        console.error("Failed to create external FV liquidation:", error);
        throw new Error(error.message || "Failed to create liquidation");
    }
}

export async function getExternalLiquidations(startDate?: Date, endDate?: Date) {
    const where: any = {};
    
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
            where.createdAt.gte = startDate;
        }
        if (endDate) {
            // Set end date to end of day
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            where.createdAt.lte = end;
        }
    }

    const liquidations = await prisma.externalFVLiquidation.findMany({
        where,
        include: {
            user: {
                select: { name: true }
            },
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

    // Serialize Decimal and Date for Client Components
    return liquidations.map(l => ({
        ...l,
        totalAmount: Number(l.totalAmount),
        createdAt: l.createdAt.toISOString(),
        settlements: l.settlements.map(s => ({
            ...s,
            totalAmount: Number(s.totalAmount),
            datePaid: s.datePaid.toISOString(),
            transactions: s.transactions.map(t => ({
                ...t,
                amount: Number(t.amount),
                createdAt: t.createdAt.toISOString()
            }))
        }))
    }));
}
