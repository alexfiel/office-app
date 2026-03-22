import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();

        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Verify the record exists and belongs to the user
        const existingRecord = await prisma.transferTax.findUnique({
            where: { id },
            include: {
                notarialDocument: true,
                details: true,
            }
        });

        if (!existingRecord) {
            return NextResponse.json({ error: "Transfer tax record not found" }, { status: 404 });
        }

        // Must be the owner to delete (or an ADMIN)
        if (existingRecord.userId !== session.user.id && (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden: You don't have permission to delete this record" }, { status: 403 });
        }

        // Delete nested TransferTaxDetails first
        await prisma.transferTaxDetails.deleteMany({
            where: { transferTaxId: id }
        });

        // Delete the main TransferTax record
        await prisma.transferTax.delete({
            where: { id }
        });

        // Optionally, delete the associated notarial document (assuming 1-to-1)
        if (existingRecord.notarialDocumentId) {
             const dependentTaxes = await prisma.transferTax.findMany({
                 where: { notarialDocumentId: existingRecord.notarialDocumentId }
             });
             // Only delete if no other TransferTaxes reference it
             if (dependentTaxes.length === 0) {
                 await prisma.notarialDocument.delete({
                     where: { id: existingRecord.notarialDocumentId }
                 });
             }
        }

        return NextResponse.json(
            { message: "Transfer tax record deleted successfully" },
            { status: 200 }
        );

    } catch (error: any) {
        console.error("Error deleting transfer tax form:", error);
        return NextResponse.json(
            { error: "Failed to delete transfer tax record" },
            { status: 500 }
        );
    }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();

        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const record = await prisma.transferTax.findUnique({
            where: { id },
            include: {
                notarialDocument: true,
                details: {
                    include: {
                        realProperty: true
                    }
                }
            }
        });

        if (!record) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json(record, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to fetch record" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();

        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const userId = session.user.id;
        const body = await req.json();

        // Verify ownership
        const existing = await prisma.transferTax.findUnique({
             where: { id },
             include: { notarialDocument: true }
        });

        if (!existing) {
             return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        if (existing.userId !== userId && (session.user as any).role !== "ADMIN") {
             return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // We skip exact Zod parsing here as we assume the payload format matches the POST endpoint exactly 
        // (but we could re-use transferTaxFormSchema.parse(body) if needed)
        const { documentInfo, transferTaxInfo, transferTaxDetails } = body;

        // 1. Update Notarial Document if it exists
        if (existing.notarialDocumentId) {
             await prisma.notarialDocument.update({
                 where: { id: existing.notarialDocumentId },
                 data: {
                     documentName: documentInfo.name,
                     documentType: documentInfo.type,
                     documentNumber: documentInfo.number,
                     notarialDate: documentInfo.date ?? new Date(),
                     notarizedBy: documentInfo.notarizedBy,
                     document_url: documentInfo.document_url || "",
                 }
             });
        }

        // 2. Clear old details and replace with new cart data
        await prisma.transferTaxDetails.deleteMany({
             where: { transferTaxId: id }
        });

        // 3. Update the TransferTax record itself and hook up new details
        const result = await prisma.transferTax.update({
            where: { id },
            data: {
                transferee: transferTaxInfo.transferee,
                transferor: transferTaxInfo.transferor,
                transactionType: transferTaxInfo.transactionType,
                considerationvalue: transferTaxInfo.considerationValue ?? transferTaxInfo.considerationvalue,
                totalmarketvalue: transferTaxInfo.totalMarketValue ?? transferTaxInfo.totalmarketvalue,
                taxbase: transferTaxInfo.taxBase ?? transferTaxInfo.taxbase,
                taxdue: transferTaxInfo.taxDue ?? transferTaxInfo.taxdue,
                surcharge: transferTaxInfo.surcharge,
                interest: transferTaxInfo.interest,
                totalamountdue: transferTaxInfo.totalAmountDue ?? transferTaxInfo.totalamountdue,
                paymentstatus: transferTaxInfo.paymentStatus ?? transferTaxInfo.paymentstatus,
                transactionDate: transferTaxInfo.transactionDate ?? new Date(),
                validuntil: transferTaxInfo.validUntil ?? "N/A",

                details: {
                    create: transferTaxDetails.map((detail: any) => ({
                        taxdecnumber: detail.taxdecnumber,
                        lotNumber: detail.lotNumber,
                        owner: detail.owner,
                        marketValue: Number(detail.marketValue),
                        area: Number(detail.area),
                        user: { connect: { id: userId } },
                        realProperty: {
                            connect: { id: detail.id } // Requires `id` (RealPropertyId) from payload
                        },
                    })),
                },
            },
            include: {
                notarialDocument: true,
                details: true,
            },
        });

        return NextResponse.json(
            { message: "Transfer Tax updated successfully", result },
            { status: 200 }
        );

    } catch (error: any) {
        console.error("Error updating transfer tax form:", error);
        return NextResponse.json(
            { error: "Failed to update transfer tax form" },
            { status: 500 }
        );
    }
}
