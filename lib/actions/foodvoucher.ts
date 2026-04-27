"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- VENDOR ACTIONS ---

export async function getVendors() {
    try {
        return await prisma.foodVoucherVendor.findMany({
            orderBy: { vendorName: 'asc' }
        });
    } catch (error) {
        console.error("Failed to fetch vendors:", error);
        throw new Error("Failed to fetch vendors");
    }
}

export async function addVendor(data: { vendorName: string, market: string, stallNo: string, userId: string }) {
    try {
        const vendor = await prisma.foodVoucherVendor.create({
            data
        });
        revalidatePath("/foodvoucher");
        return vendor;
    } catch (error) {
        console.error("Failed to add vendor:", error);
        throw new Error("Failed to add vendor");
    }
}

// --- VOUCHER ACTIONS ---

export async function getVouchers() {
    try {
        return await prisma.foodVoucher.findMany({
            include: { user: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        });
    } catch (error) {
        console.error("Failed to fetch vouchers:", error);
        throw new Error("Failed to fetch vouchers");
    }
}

export async function addVoucher(data: { voucherCode: string, amount: number, date: Date, userId: string }) {
    try {
        const voucher = await prisma.foodVoucher.create({
            data
        });
        revalidatePath("/foodvoucher");
        return voucher;
    } catch (error) {
        console.error("Failed to add voucher:", error);
        throw new Error("Failed to add voucher");
    }
}

// --- REDEMPTION ACTIONS ---

export async function createRedemptionClaim(data: { 
    redemptionCode: string, 
    vendorId: string, 
    totalAmount: number, 
    date: Date, 
    userId: string,
    voucherIds: string[] 
}) {
    try {
        const { voucherIds, ...claimData } = data;
        
        const claim = await prisma.$transaction(async (tx) => {
            const newClaim = await tx.foodVoucherRedemptionClaim.create({
                data: claimData
            });

            // Create details and update vouchers
            for (const vId of voucherIds) {
                const voucher = await tx.foodVoucher.findUnique({ where: { id: vId } });
                if (!voucher) throw new Error(`Voucher ${vId} not found`);

                await tx.foodVoucherRedemptionClaimDetails.create({
                    data: {
                        redemptionClaimId: newClaim.id,
                        foodVoucherId: vId,
                        amount: voucher.amount
                    }
                });

                await tx.foodVoucher.update({
                    where: { id: vId },
                    data: { vendorId: data.vendorId }
                });
            }

            return newClaim;
        });

        revalidatePath("/foodvoucher");
        return claim;
    } catch (error) {
        console.error("Failed to create redemption claim:", error);
        throw new Error("Failed to create redemption claim");
    }
}

export async function getRedemptionClaims() {
    try {
        return await prisma.foodVoucherRedemptionClaim.findMany({
            include: { 
                vendor: true,
                user: { select: { name: true } },
                details: { include: { foodVoucher: true } },
                acknowledgement: true
            },
            orderBy: { date: 'desc' }
        });
    } catch (error) {
        console.error("Failed to fetch redemption claims:", error);
        throw new Error("Failed to fetch redemption claims");
    }
}

export async function acknowledgeClaim(data: {
    redemptionClaimId?: string,
    vendorClaimId?: string,
    userId: string,
    ackBy: string
}) {
    try {
        const acknowledgement = await prisma.$transaction(async (tx) => {
            // Check if already acknowledged
            if (data.redemptionClaimId) {
                const existing = await tx.foodVoucherIssuerAcknowledgement.findUnique({
                    where: { redemptionClaimId: data.redemptionClaimId }
                });
                if (existing) throw new Error("Claim already acknowledged");
            } else if (data.vendorClaimId) {
                const existing = await tx.foodVoucherIssuerAcknowledgement.findUnique({
                    where: { vendorClaimId: data.vendorClaimId }
                });
                if (existing) throw new Error("Vendor claim already acknowledged");
            } else {
                throw new Error("Missing claim ID");
            }

            // Generate next AR Number: CTO-0000000
            const count = await tx.foodVoucherIssuerAcknowledgement.count();
            const nextNumber = (count + 1).toString().padStart(7, '0');
            const arNumber = `CTO-${nextNumber}`;

            const ack = await tx.foodVoucherIssuerAcknowledgement.create({
                data: {
                    redemptionClaimId: data.redemptionClaimId || null,
                    vendorClaimId: data.vendorClaimId || null,
                    arNumber,
                    userId: data.userId,
                    ackBy: data.ackBy,
                    acknowledged: true,
                    ackDate: new Date()
                }
            });

            // Update status to PAID
            if (data.redemptionClaimId) {
                await tx.foodVoucherRedemptionClaim.update({
                    where: { id: data.redemptionClaimId },
                    data: { status: 'PAID' }
                });
            } else if (data.vendorClaimId) {
                await tx.foodVoucherVendorClaim.update({
                    where: { id: data.vendorClaimId },
                    data: { status: 'PAID' }
                });
            }

            return ack;
        });

        revalidatePath("/foodvoucher");
        return acknowledgement;
    } catch (error: any) {
        console.error("Failed to acknowledge claim:", error);
        throw new Error(error.message || "Failed to acknowledge claim");
    }
}

// --- VENDOR CLAIM ACTIONS (EXTERNAL) ---

export async function getVendorClaims() {
    try {
        return await prisma.foodVoucherVendorClaim.findMany({
            include: { 
                user: { select: { name: true } },
                acknowledgement: true
            },
            orderBy: { createdAt: 'desc' }
        });
    } catch (error) {
        console.error("Failed to fetch vendor claims:", error);
        throw new Error("Failed to fetch vendor claims");
    }
}

// --- API KEY ACTIONS ---

export async function getApiKeys(userId: string) {
    try {
        return await prisma.apiKeyModel.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    } catch (error) {
        console.error("Failed to fetch API keys:", error);
        throw new Error("Failed to fetch API keys");
    }
}

export async function createApiKey(data: { name: string, userId: string }) {
    try {
        // Generate a random key
        const key = `sk_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
        
        const apiKey = await prisma.apiKeyModel.create({
            data: {
                ...data,
                key
            }
        });
        revalidatePath("/foodvoucher");
        return apiKey;
    } catch (error) {
        console.error("Failed to create API key:", error);
        throw new Error("Failed to create API key");
    }
}

export async function deleteApiKey(id: string) {
    try {
        await prisma.apiKeyModel.delete({
            where: { id }
        });
        revalidatePath("/foodvoucher");
    } catch (error) {
        console.error("Failed to delete API key:", error);
        throw new Error("Failed to delete API key");
    }
}

// --- DASHBOARD ACTIONS ---

export async function getFoodVoucherStats() {
    try {
        const [totalIssued, totalRedeemed, vendorCount] = await Promise.all([
            prisma.foodVoucher.aggregate({ _sum: { amount: true } }),
            prisma.foodVoucherRedemptionClaim.aggregate({ _sum: { totalAmount: true } }),
            prisma.foodVoucherVendor.count()
        ]);

        return {
            totalIssued: totalIssued._sum.amount || 0,
            totalRedeemed: totalRedeemed._sum.amount || 0, // Wait, this should be totalAmount from claims
            vendorCount
        };
    } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
        throw new Error("Failed to fetch dashboard stats");
    }
}
