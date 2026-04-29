"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Get all unpaid ARs (Acknowledgements without a settlementId)
export async function getUnsettledAcknowledgements() {
    try {
        return await prisma.foodVoucherIssuerAcknowledgement.findMany({
            where: {
                settlementId: null,
            } as any,
            include: {
                user: { select: { name: true } },
                redemptionClaim: {
                    include: {
                        vendor: true,
                    }
                }
            },
            orderBy: {
                date: 'asc'
            }
        });
    } catch (error) {
        console.error("Failed to fetch unsettled acknowledgements:", error);
        throw new Error("Failed to fetch unsettled acknowledgements");
    }
}

// Get all settlements for reporting
export async function getSettlements() {
    try {
        const data = await prisma.foodVoucherSettlement.findMany({
            include: {
                user: {
                    select: { name: true }
                },
                details: true,
                acknowledgements: {
                    include: {
                        redemptionClaim: {
                            include: { vendor: true }
                        },
                        vendorClaim: true
                    }
                }
            },
            orderBy: {
                datePaid: 'desc'
            }
        });
        return data;
    } catch (error) {
        console.error("Failed to fetch settlements:", error);
        throw new Error("Failed to fetch settlements");
    }
}

// Create a new settlement for multiple Acknowledgement ARs
export async function createSettlement(data: {
    amount: number;
    userId: string;
    acknowledgementIds: string[];
}) {
    try {
        // 1. Generate a new Payment/Settlement Control Number
        const lastSettlement = await prisma.foodVoucherSettlement.findFirst({
            orderBy: { arNumber: 'desc' }
        });

        let newArNumber = "SETTLE-0000001";
        if (lastSettlement && lastSettlement.arNumber) {
            const match = lastSettlement.arNumber.match(/SETTLE-(\d+)/);
            if (match) {
                const num = parseInt(match[1]) + 1;
                newArNumber = `SETTLE-${num.toString().padStart(7, '0')}`;
            }
        }

        // 2. Perform a transaction
        const newSettlement = await prisma.$transaction(async (tx) => {
            // Fetch the acks to get their vendor info
            const acks = await tx.foodVoucherIssuerAcknowledgement.findMany({
                where: { id: { in: data.acknowledgementIds } },
                include: { redemptionClaim: { include: { vendor: true } } }
            });

            // Create settlement
            const settlement = await tx.foodVoucherSettlement.create({
                data: {
                    amount: data.amount,
                    userId: data.userId,
                    arNumber: newArNumber,
                    details: {
                        create: acks.map(ack => ({
                            arNumber: ack.arNumber,
                            vendorName: ack.redemptionClaim?.vendor?.vendorName || "Unknown",
                            market: ack.redemptionClaim?.vendor?.market || "Unknown",
                            stallNo: ack.redemptionClaim?.vendor?.stallNo || "Unknown",
                            amount: ack.redemptionClaim?.totalAmount || 0,
                            userId: data.userId
                        }))
                    }
                }
            });

            // Loop through all acknowledgements to link them and mark as paid
            for (const ackId of data.acknowledgementIds) {
                const ack = await tx.foodVoucherIssuerAcknowledgement.update({
                    where: { id: ackId },
                    data: {
                        settlementId: settlement.id
                    },
                    include: { redemptionClaim: true }
                });

                if (ack.redemptionClaim) {
                    await tx.foodVoucherRedemptionClaim.update({
                        where: { id: ack.redemptionClaim.id },
                        data: { status: 'PAID' }
                    });
                }
            }

            return settlement;
        });

        revalidatePath("/foodvoucher-settlement");
        return newSettlement;
    } catch (error: any) {
        console.error("Failed to create settlement:", error);
        throw new Error(error.message || "Failed to create settlement");
    }
}

export async function updateSettlement(id: string, data: { amount?: number }) {
    try {
        const updated = await prisma.foodVoucherSettlement.update({
            where: { id },
            data: {
                amount: data.amount,
            }
        });
        revalidatePath("/foodvoucher-settlement");
        return updated;
    } catch (error: any) {
        console.error("Failed to update settlement:", error);
        throw new Error("Failed to update settlement");
    }
}

export async function deleteSettlement(id: string) {
    try {
        await prisma.$transaction(async (tx) => {
            // Find all acknowledgements linked to this settlement
            const acks = await tx.foodVoucherIssuerAcknowledgement.findMany({
                where: { settlementId: id },
                include: { redemptionClaim: true }
            });

            // Revert redemption claims to 'APPROVED'
            for (const ack of acks) {
                if (ack.redemptionClaim) {
                    await tx.foodVoucherRedemptionClaim.update({
                        where: { id: ack.redemptionClaim.id },
                        data: { status: 'APPROVED' }
                    });
                }
            }

            // Unlink ARs by setting settlementId to null
            await tx.foodVoucherIssuerAcknowledgement.updateMany({
                where: { settlementId: id } as any,
                data: { settlementId: null } as any
            });

            // Delete the settlement itself
            await tx.foodVoucherSettlement.delete({
                where: { id }
            });
        });

        revalidatePath("/foodvoucher-settlement");
    } catch (error: any) {
        console.error("Failed to delete settlement:", error);
        throw new Error("Failed to delete settlement");
    }
}

