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
        const { documentInfo, transferTaxInfo, transferTaxDetails, chainTransactions } = validatedData;

        // 2. Perform everything in a transaction to ensure Step 11 consistency
        const result = await prisma.$transaction(async (tx) => {
            // A. Create the main Transfer Tax record
            const newRecord = await tx.transferTax.create({
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
                    dayselapsed: transferTaxInfo.dayselapsed ?? 0,

                    user: { connect: { id: userId } },

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

                    details: {
                        create: transferTaxDetails.map((detail: any) => ({
                            taxdecnumber: detail.taxdecnumber,
                            lotNumber: detail.lotNumber,
                            owner: detail.owner,
                            marketValue: Number(detail.marketValue),
                            area: Number(detail.area),
                            user: { connect: { id: userId } },
                            realProperty: { connect: { id: detail.id } },
                        })),
                    },

                    chainTransactions: {
                        create: chainTransactions?.map((ctx: any) => ({
                            deceasedOwner: ctx.deceasedOwner,
                            heirs: ctx.heirs,
                            deceasedShare: ctx.share,
                            taxBase: ctx.taxBase,
                            basicTaxDue: ctx.basicTaxDue,
                            userId: userId,
                            realPropertyId: ctx.propertyId || null,
                        })),
                    },
                },
                include: {
                    notarialDocument: true,
                    details: true,
                    chainTransactions: true,
                },
            });

            // B. STEP 11: Update owner name of the property (remaining co-owner + heirs of the deceased)
            if (transferTaxInfo.transactionType === "DEED OF EXTRAJUDICIAL SETTLEMENT" && chainTransactions && chainTransactions.length > 0) {
                // Group settlements by property
                const propertyUpdates = new Map<string, any[]>();
                for (const ctx of chainTransactions) {
                    if (ctx.propertyId) {
                        const settlements = propertyUpdates.get(ctx.propertyId) || [];
                        settlements.push(ctx);
                        propertyUpdates.set(ctx.propertyId, settlements);
                    }
                }

                // Process each property update
                for (const [propId, settlements] of propertyUpdates.entries()) {
                    const property = await tx.realProperty.findUnique({
                        where: { id: propId },
                        select: { owner: true }
                    });

                    if (property) {
                        let ownerList = property.owner.split(";").map(o => o.trim()).filter(Boolean);

                        for (const s of settlements) {
                            // 1. Remove deceased (case insensitive match for safety, though UI provides exact string)
                            ownerList = ownerList.filter(o => o.toLowerCase() !== s.deceasedOwner.toLowerCase());
                            
                            // 2. Add heirs
                            if (s.heirs) {
                                ownerList.push(s.heirs);
                            }
                        }

                        // 3. Update the property with the new owner list
                        await tx.realProperty.update({
                            where: { id: propId },
                            data: {
                                owner: ownerList.join("; ")
                            }
                        });
                    }
                }
            }

            return newRecord;
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