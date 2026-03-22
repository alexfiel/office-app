import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { transferTaxFormSchema } from "@/lib/schema";

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const body = await req.json();

        // 1. Validate incoming data
        const validatedData = transferTaxFormSchema.parse(body);
        const { documentInfo, transferTaxInfo, transferTaxDetails } = validatedData;

        // 2. Create the record
        const result = await prisma.transferTax.create({
            data: {
                transferee: transferTaxInfo.transferee,
                transferor: transferTaxInfo.transferor,
                transactionType: transferTaxInfo.transactionType,
                considerationvalue: transferTaxInfo.considerationValue,
                totalmarketvalue: transferTaxInfo.totalMarketValue,
                taxbase: transferTaxInfo.taxBase,
                taxdue: transferTaxInfo.taxDue,
                surcharge: transferTaxInfo.surcharge,
                interest: transferTaxInfo.interest,
                totalamountdue: transferTaxInfo.totalAmountDue,
                paymentstatus: transferTaxInfo.paymentStatus,
                transactionDate: transferTaxInfo.transactionDate ?? new Date(),
                validuntil: transferTaxInfo.validUntil ?? "N/A",

                // Connect the main record to the User
                user: { connect: { id: userId } },

                // Create Notarial Document nested
                notarialDocument: {
                    create: {
                        documentName: documentInfo.name,
                        documentType: documentInfo.type,
                        documentNumber: documentInfo.number,
                        notarialDate: documentInfo.date ?? new Date(),
                        notarizedBy: documentInfo.notarizedBy,
                        document_url: documentInfo.document_url || "",
                        user: { connect: { id: userId } },
                    },
                },

                // Create Transfer Tax Details nested
                details: {
                    create: transferTaxDetails.map((detail: any) => ({
                        taxdecnumber: detail.taxdecnumber,
                        lotNumber: detail.lotNumber,
                        owner: detail.owner,
                        marketValue: Number(detail.marketValue),
                        area: Number(detail.area),
                        user: { connect: { id: userId } },
                        realProperty: {
                            connect: { id: detail.id }
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
            { message: "Transfer Tax saved successfully", result },
            { status: 200 }
        );

    } catch (error: any) {
        console.error("Error saving transfer tax form:", error);

        // Handle Zod validation errors specifically
        if (error.name === "ZodError") {
            return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
        }

        return NextResponse.json(
            { error: "Failed to save transfer tax form" },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    try {
        const session = await auth();

        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const transferTaxes = await prisma.transferTax.findMany({
            include: {
                notarialDocument: true,
                details: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(transferTaxes, { status: 200 });

    } catch (error: any) {
        console.error("Error fetching transfer taxes:", error);
        return NextResponse.json(
            { error: "Failed to fetch transfer taxes" },
            { status: 500 }
        );
    }
}