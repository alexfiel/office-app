"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { TransferTaxCalculator } from "@/lib/tax-calculator";
import { revalidatePath } from "next/cache";

const parseOwners = (ownerStr: string) => {
    if (!ownerStr) return [];
    let s = ownerStr.toUpperCase();
    const delimiters = ["SPS.", "SPS", "M/T", "MARRIED TO", "MARRIED", " AND ", "&", ";", ","];

    delimiters.forEach(d => {
        s = s.split(d).join("|");
    });

    const parsed = s.split("|")
        .map(n => n.trim())
        .filter(n => n.length > 2 && n !== "ET AL" && n !== "ET AL." && n !== "AND");

    return parsed.length > 0 ? parsed : [ownerStr.trim()];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveTransferTaxTransaction(data: any) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: "Unauthorized. Please log in." };
        }
        
        const userId = session.user.id;
        
        const {
            documentData,
            transactionData,
            cart,
            computationData
        } = data;
        
        // 1. Create NotarialDocument if it doesn't have an ID yet, or find it
        // Wait, did we save NotarialDocument yet? The UI just uploaded a file and set cookies.
        let notarialId = documentData.id;
        
        if (!notarialId) {
            const newDoc = await prisma.notarialDocument.create({
                data: {
                    documentName: documentData.documentName,
                    documentType: documentData.documentType,
                    documentNumber: documentData.documentNumber,
                    notarialDate: new Date(documentData.notarialDate),
                    notarizedBy: documentData.notarizedBy,
                    document_url: documentData.documentUrl || "",
                    userId: userId
                }
            });
            notarialId = newDoc.id;
        }

        // 2. Check if a pending NewTransferTax already exists for this NotarialDocument
        let newTransferTax = await prisma.newTransferTax.findFirst({
            where: {
                t_NotarialId: notarialId,
                t_status: "pending"
            }
        });

        if (newTransferTax) {
            // Append to existing
            newTransferTax = await prisma.newTransferTax.update({
                where: { id: newTransferTax.id },
                data: {
                    t_TotalMarketValue: { increment: computationData.totalMarketValue || 0 },
                    t_TotalConsiderationValue: { increment: computationData.considerationValue || 0 },
                    t_TaxBase: { increment: computationData.taxBase || 0 },
                    t_TotalAmountDue: { increment: computationData.totalAmountDue },
                    t_TotalSurcharge: { increment: computationData.surcharge },
                    t_TotalInterest: { increment: computationData.interest },
                }
            });
        } else {
            // Generate a random control number
            const controlNumber = `TT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            // Create new NewTransferTax
            newTransferTax = await prisma.newTransferTax.create({
                data: {
                    t_controlNumber: controlNumber,
                    t_TotalMarketValue: computationData.totalMarketValue || 0,
                    t_TotalConsiderationValue: computationData.considerationValue || 0,
                    t_TaxBase: computationData.taxBase || 0,
                    t_TotalAmountDue: computationData.totalAmountDue,
                    t_TotalSurcharge: computationData.surcharge,
                    t_TotalInterest: computationData.interest,
                    t_NotarialId: notarialId,
                    t_DateCompute: new Date(),
                    t_validity: computationData.validityDate === "MAXIMUM INTEREST REACHED" ? new Date("2099-12-31") : new Date(computationData.validityDate || new Date().setDate(new Date().getDate() + 30)),
                    t_daysElapsed: computationData.daysElapsed,
                    t_status: "pending",
                    t_paymentStatus: "unpaid",
                    t_paymentReference: `PR-${Date.now()}`, 
                    t_remarks: "Processed via portal",
                    t_userId: userId,
                }
            });
        }

        // 3. Create Details and update real property
        for (const property of cart) {
            const pData = transactionData.propertyEjsData?.[property.id];
            const isEjsType = ["Extrajudicial Settlement", "Donation", "Waiver of Rights"].includes(transactionData.transactionType);
            const isPartitionType = transactionData.transactionType === "Partition";
            const isAdjudicationType = transactionData.transactionType === "Adjudication";
            
            let displayValue = Number(property.marketValue);
            let finalArea = Number(property.area) || 0;
            let finalLotNumber = property.lotNumber || "";

            if (isEjsType && pData) {
                const totalOwners = pData.parsedOwners?.length || 0;
                const selectedCount = pData.selectedOwners?.length || 0;
                if (totalOwners > 0 && selectedCount > 0) {
                    displayValue = (displayValue / totalOwners) * selectedCount;
                } else if (totalOwners > 0) {
                    displayValue = 0;
                }
            } else if (isPartitionType && pData) {
                const suppliedArea = pData.suppliedArea || 0;
                if (suppliedArea > 0 && finalArea > 0) {
                    displayValue = (displayValue / finalArea) * suppliedArea;
                    finalArea = suppliedArea;
                } else {
                    displayValue = 0;
                }
                if (pData.newLotNumber) {
                    finalLotNumber = pData.newLotNumber;
                }
            } else if (isAdjudicationType && pData) {
                if (pData.adjudicationType === "Whole") {
                    // Keep 100% displayValue and original area
                } else if (pData.adjudicationType === "Portion") {
                    if (pData.portionType === "Percent") {
                        const pct = pData.percentShare || 0;
                        displayValue = displayValue * (pct / 100);
                        // Optional: compute finalArea if percent is applied
                        finalArea = finalArea * (pct / 100);
                    } else if (pData.portionType === "Area") {
                        const suppliedArea = pData.suppliedArea || 0;
                        if (suppliedArea > 0 && finalArea > 0) {
                            displayValue = (displayValue / finalArea) * suppliedArea;
                            finalArea = suppliedArea;
                        } else {
                            displayValue = 0;
                        }
                        if (pData.newLotNumber) {
                            finalLotNumber = pData.newLotNumber;
                        }
                    } else {
                        displayValue = 0;
                    }
                } else {
                    displayValue = 0;
                }
            } else if (transactionData.transactionType === "Sale" && pData) {
                if (pData.saleScope === "Whole") {
                    // Keep 100% displayValue and original area
                } else if (pData.saleScope === "Portion") {
                    const suppliedArea = pData.suppliedArea || 0;
                    if (suppliedArea > 0 && finalArea > 0) {
                        displayValue = (displayValue / finalArea) * suppliedArea;
                        finalArea = suppliedArea;
                    } else {
                        displayValue = 0;
                    }
                    if (pData.newLotNumber) {
                        finalLotNumber = pData.newLotNumber;
                    }
                } else {
                    displayValue = 0;
                }
            }

            const totalMV = computationData.totalMarketValue || 1; // avoid division by zero
            const considerationValue = transactionData.transactionType === "Sale" 
                ? (Number(transactionData.considerationValue) * (displayValue / totalMV)) 
                : 0;
            
            let mappedType = transactionData.transactionType.toUpperCase();
            if (mappedType === "SALE") mappedType = "DEED OF SALE";
            else if (mappedType === "EXTRAJUDICIAL SETTLEMENT") mappedType = "DEED OF EXTRAJUDICIAL SETTLEMENT";
            else if (mappedType === "DONATION") mappedType = "DEED OF DONATION";
            else if (mappedType === "WAIVER OF RIGHTS") mappedType = "DEED OF WAIVER OF RIGHTS";
            else if (mappedType === "PARTITION") mappedType = "DEED OF PARTITION";
            else if (mappedType === "ADJUDICATION") mappedType = "DEED OF ADJUDICATION";

            const computed = TransferTaxCalculator.computeTotal(
                mappedType,
                displayValue,
                considerationValue,
                documentData.notarialDate,
                1 // share already applied to displayValue
            );
            
            const taxBase = computed.taxBase;
            const apportionedDue = computed.basicTaxDue; 
            const apportionedSurcharge = computed.surcharge;
            const apportionedInterest = computed.interest;

            const transfereeCaps = transactionData.transferee ? transactionData.transferee.toUpperCase() : "";
            const transferorCaps = transactionData.transferor ? transactionData.transferor.toUpperCase() : "";

            await prisma.newTransferTaxDetails.create({
                data: {
                    nt_transferee: transfereeCaps,
                    nt_transferror: transferorCaps,
                    nt_transactiontype: transactionData.transactionType,
                    nt_taxdecnumber: property.taxdecnumber,
                    nt_lotnumber: finalLotNumber,
                    nt_area: finalArea,
                    nt_marketvalue: displayValue,
                    nt_considerationvalue: considerationValue,
                    nt_taxbase: taxBase,
                    nt_transfertaxDue: apportionedDue,
                    nt_surcharge: apportionedSurcharge,
                    nt_interest: apportionedInterest,
                    nt_totalTransferTaxDue: apportionedDue + apportionedSurcharge + apportionedInterest,
                    nt_transfertaxid: newTransferTax.id,
                    nt_userid: userId,
                    nt_realpropertyid: property.id
                }
            });

            let updatedOwner = property.owner;
            const transfereeUpper = transactionData.transferee.toUpperCase().trim();
            const originalOwnerUpper = property.owner.toUpperCase();
            
            // Check if transferee is already somewhere in the owner string
            const isTransfereeAlreadyOwner = originalOwnerUpper.includes(transfereeUpper);
            
            if (isEjsType && pData && pData.selectedOwners.length > 0) {
                // Remove the selected owners (transferors)
                const newOwnerList = pData.parsedOwners.filter((o: string) => !pData.selectedOwners.includes(o));
                
                if (!isTransfereeAlreadyOwner) {
                    newOwnerList.push(transfereeCaps);
                }
                
                updatedOwner = newOwnerList.join(", ");
            } else {
                // Standard Sale or other types
                if (isTransfereeAlreadyOwner) {
                    // If they are already an owner, just remove the transferors from the owner list
                    const transferorsToRemove = transactionData.transferor.toUpperCase().split(",").map((t: string) => t.trim());
                    const currentOwners = parseOwners(property.owner);
                    
                    const newOwnerList = currentOwners.filter((o: string) => {
                        return !transferorsToRemove.some((tToRemove: string) => o.includes(tToRemove) || tToRemove.includes(o));
                    });
                    
                    updatedOwner = newOwnerList.join(", ");
                } else {
                    // If it's a completely new buyer, they become the sole owner (standard assumption for outright sale)
                    updatedOwner = transfereeCaps;
                }
            }

            const isPortionOnly = finalArea < Number(property.area);

            if (isPortionOnly) {
                // Generate 3 random uppercase letters
                const randomLetters = Array.from({ length: 3 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
                const newPin = `${property.pin}-${randomLetters}`;
                
                // Ensure unique objid
                const uniqueIdSegment = Math.random().toString(36).substring(2, 7).toUpperCase();

                // Update original property (reduce area and market value, retain owner)
                await prisma.realProperty.update({
                    where: { id: property.id },
                    data: {
                        area: Number(property.area) - finalArea,
                        marketValue: Number(property.marketValue) - displayValue,
                    }
                });

                // Create the new portion property
                await prisma.realProperty.create({
                    data: {
                        objid: `${property.objid}-PORTION-${randomLetters}-${uniqueIdSegment}`,
                        pin: newPin,
                        taxdecnumber: property.taxdecnumber,
                        owner: updatedOwner,
                        rputype: property.rputype,
                        barangay: property.barangay,
                        classcode: property.classcode,
                        lotNumber: finalLotNumber,
                        blockNumber: property.blockNumber,
                        surveyno: property.surveyno,
                        tctOct: property.tctOct,
                        area: finalArea,
                        marketValue: displayValue,
                        userId: userId,
                    }
                });
            } else {
                // Update original property completely (full transfer)
                await prisma.realProperty.update({
                    where: { id: property.id },
                    data: {
                        owner: updatedOwner
                    }
                });
            }
        }

        return { success: true, notarialDocumentId: notarialId };

    } catch (error) {
        console.error("Error saving transfer tax:", error);
        return { error: "Failed to save transaction" };
    }
}

export async function getTransactionsByNotarialId(notarialId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: "Unauthorized. Please log in." };
        }

        const document = await prisma.notarialDocument.findUnique({
            where: { id: notarialId },
            include: {
                newTransferTaxes: {
                    include: {
                        t_transfertaxdetails: {
                            include: {
                                realProperty: true
                            }
                        }
                    },
                    orderBy: {
                        t_DateCompute: 'desc'
                    }
                }
            }
        });

        if (!document) {
            return { error: "Notarial Document not found." };
        }

        // Serialize the document to convert Prisma Decimal objects to plain strings
        const plainDocument = JSON.parse(JSON.stringify(document));

        return { success: true, document: plainDocument };
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return { error: "Failed to fetch transactions." };
    }
}

export async function getAllTransferTaxes() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: "Unauthorized. Please log in." };
        }

        const taxes = await prisma.newTransferTax.findMany({
            include: {
                notarialDocument: true,
                t_transfertaxdetails: {
                    include: {
                        realProperty: true
                    }
                }
            },
            orderBy: {
                t_DateCompute: 'desc'
            }
        });

        // Serialize the document to convert Prisma Decimal objects to plain strings
        const plainTaxes = JSON.parse(JSON.stringify(taxes));

        return { success: true, taxes: plainTaxes };
    } catch (error) {
        console.error("Error fetching all transactions:", error);
        return { error: "Failed to fetch transactions." };
    }
}

export async function getPaginatedTransferTaxes(page: number = 1, limit: number = 10) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: "Unauthorized. Please log in." };
        }

        const skip = (page - 1) * limit;

        const [taxes, total] = await Promise.all([
            prisma.newTransferTax.findMany({
                skip,
                take: limit,
                include: {
                    notarialDocument: true,
                    t_transfertaxdetails: {
                        include: {
                            realProperty: true
                        }
                    }
                },
                orderBy: {
                    t_DateCompute: 'desc'
                }
            }),
            prisma.newTransferTax.count()
        ]);

        const plainTaxes = JSON.parse(JSON.stringify(taxes));

        return { 
            success: true, 
            taxes: plainTaxes, 
            total, 
            totalPages: Math.ceil(total / limit) 
        };
    } catch (error) {
        console.error("Error fetching paginated transactions:", error);
        return { error: "Failed to fetch paginated transactions." };
    }
}

export async function deleteTransferTax(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: "Unauthorized. Please log in." };
        }

        const tax = await prisma.newTransferTax.findUnique({
            where: { id },
            include: {
                t_transfertaxdetails: {
                    include: { realProperty: true }
                }
            }
        });

        if (!tax) {
            return { error: "Transfer tax transaction not found." };
        }

        // Revert RealProperty owner updates
        for (const detail of tax.t_transfertaxdetails) {
            if (detail.realProperty) {
                const transfereeToRemove = detail.nt_transferee.toUpperCase().trim();
                const transferorsToAdd = detail.nt_transferror;

                const currentOwnerList = parseOwners(detail.realProperty.owner);
                
                // Remove the transferee
                const newOwnerList = currentOwnerList.filter(o => 
                    !o.includes(transfereeToRemove) && !transfereeToRemove.includes(o)
                );

                // Add the transferors back
                if (transferorsToAdd) {
                    const transferorsArray = transferorsToAdd.split(",").map((t: string) => t.trim());
                    for (const t of transferorsArray) {
                        if (t && !newOwnerList.includes(t)) {
                            newOwnerList.push(t);
                        }
                    }
                }

                await prisma.realProperty.update({
                    where: { id: detail.realProperty.id },
                    data: { owner: newOwnerList.join(", ") }
                });
            }
        }

        // Delete Details
        await prisma.newTransferTaxDetails.deleteMany({
            where: { nt_transfertaxid: id }
        });

        // Delete Master
        await prisma.newTransferTax.delete({
            where: { id }
        });

        return { success: true };
    } catch (error) {
        console.error("Error deleting transaction:", error);
        return { error: "Failed to delete transaction." };
    }
}

export async function recomputeTransferTax(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: "Unauthorized. Please log in." };
        }

        const tax = await prisma.newTransferTax.findUnique({
            where: { id },
            include: {
                notarialDocument: true,
                t_transfertaxdetails: true
            }
        });

        if (!tax || !tax.notarialDocument) {
            return { error: "Transaction or Notarial Document not found." };
        }

        const today = new Date();
        let totalSurcharge = 0;
        let totalInterest = 0;
        let totalAmountDue = 0;
        let overallDaysElapsed = 0;
        let overallValidityDate = "";

        // Recompute details
        for (const detail of tax.t_transfertaxdetails) {
            let mappedType = detail.nt_transactiontype.toUpperCase();
            if (mappedType === "SALE") mappedType = "DEED OF SALE";
            else if (mappedType === "EXTRAJUDICIAL SETTLEMENT") mappedType = "DEED OF EXTRAJUDICIAL SETTLEMENT";
            else if (mappedType === "DONATION") mappedType = "DEED OF DONATION";
            else if (mappedType === "WAIVER OF RIGHTS") mappedType = "DEED OF WAIVER OF RIGHTS";
            else if (mappedType === "PARTITION") mappedType = "DEED OF PARTITION";
            else if (mappedType === "ADJUDICATION") mappedType = "DEED OF ADJUDICATION";

            const computed = TransferTaxCalculator.computeTotal(
                mappedType,
                Number(detail.nt_marketvalue),
                Number(detail.nt_considerationvalue),
                tax.notarialDocument.notarialDate.toISOString(),
                1,
                today
            );

            await prisma.newTransferTaxDetails.update({
                where: { id: detail.id },
                data: {
                    nt_surcharge: computed.surcharge,
                    nt_interest: computed.interest,
                    nt_totalTransferTaxDue: computed.basicTaxDue + computed.surcharge + computed.interest
                }
            });

            totalSurcharge += computed.surcharge;
            totalInterest += computed.interest;
            totalAmountDue += (computed.basicTaxDue + computed.surcharge + computed.interest);
            overallDaysElapsed = computed.daysElapsed;
            overallValidityDate = computed.validityDate;
        }

        // Update Master
        await prisma.newTransferTax.update({
            where: { id },
            data: {
                t_DateCompute: today,
                t_TotalSurcharge: totalSurcharge,
                t_TotalInterest: totalInterest,
                t_TotalAmountDue: totalAmountDue,
                t_daysElapsed: overallDaysElapsed,
                t_validity: overallValidityDate === "MAXIMUM INTEREST REACHED" ? new Date("2099-12-31") : new Date(overallValidityDate || new Date().setDate(new Date().getDate() + 30))
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Error recomputing transaction:", error);
        return { error: "Failed to recompute transaction." };
    }
}

export async function updateBasicTransferTax(transactionId: string, detailsPayload: any[]) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: "Unauthorized. Please log in." };
        }

        // Fetch transaction and notarial doc to get dates
        const tx = await prisma.newTransferTax.findUnique({
            where: { id: transactionId },
            include: { notarialDocument: true, t_transfertaxdetails: true }
        });

        if (!tx) return { error: "Transaction not found." };

        const notarialDateStr = tx.notarialDocument.notarialDate.toISOString();
        const dateComputeStr = tx.t_DateCompute.toISOString();

        let updatedTotalMarketValue = 0;
        let updatedTotalConsideration = 0;
        let updatedTaxBase = 0;
        let updatedTotalSurcharge = 0;
        let updatedTotalInterest = 0;
        let updatedTotalAmountDue = 0;

        // Start a transaction to safely update all records
        await prisma.$transaction(async (prisma) => {
            // First update all details and accumulate totals
            for (const payload of detailsPayload) {
                const detail = tx.t_transfertaxdetails.find((d: any) => d.id === payload.id);
                if (!detail) continue;

                const mv = Number(detail.nt_marketvalue);
                const cv = Number(payload.considerationValue);
                const itemTaxBase = Math.max(mv, cv);
                const basicTaxDue = Math.max(itemTaxBase * 0.0075, 500);

                // Need to recompute penalties
                const calc = TransferTaxCalculator.calculateBasic(basicTaxDue, notarialDateStr, dateComputeStr);

                await prisma.newTransferTaxDetails.update({
                    where: { id: payload.id },
                    data: {
                        nt_transferee: payload.transferee,
                        nt_transferror: payload.transferror,
                        nt_considerationvalue: cv,
                        nt_taxbase: itemTaxBase,
                        nt_transfertaxDue: basicTaxDue,
                        nt_surcharge: calc.surcharge,
                        nt_interest: calc.interest,
                        nt_totalTransferTaxDue: calc.totalAmountDue
                    }
                });

                const newOwnerList = parseOwners(payload.transferee).join(", ");
                await prisma.realProperty.update({
                    where: { id: detail.nt_realpropertyid },
                    data: { owner: newOwnerList }
                });
            }

            // Now recompute the grand totals using exactly the grouped logic we use in the UI and save logic!
            const refreshedDetails = await prisma.newTransferTaxDetails.findMany({
                where: { nt_transfertaxid: transactionId }
            });

            // Group by type, transferor, transferee to match the grouping logic
            const grouped: Record<string, any[]> = {};
            refreshedDetails.forEach((dt: any) => {
                const key = `${dt.nt_transactiontype}-${dt.nt_transferror}-${dt.nt_transferee}`;
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(dt);
            });

            Object.values(grouped).forEach(groupDetails => {
                let groupMarketValue = 0;
                let groupConsideration = 0;

                groupDetails.forEach((dt: any) => {
                    groupMarketValue += Number(dt.nt_marketvalue);
                    if (Number(dt.nt_considerationvalue) > groupConsideration) {
                        groupConsideration = Number(dt.nt_considerationvalue);
                    }
                });

                const groupTaxBase = Math.max(groupMarketValue, groupConsideration);
                const groupBasicTax = Math.max(groupTaxBase * 0.0075, 500);

                const penalties = TransferTaxCalculator.calculateBasic(groupBasicTax, notarialDateStr, dateComputeStr);

                updatedTotalMarketValue += groupMarketValue;
                updatedTotalConsideration += groupConsideration;
                updatedTaxBase += groupTaxBase;
                updatedTotalSurcharge += penalties.surcharge;
                updatedTotalInterest += penalties.interest;
                updatedTotalAmountDue += penalties.totalAmountDue;
            });

            // Finally update the NewTransferTax summary
            await prisma.newTransferTax.update({
                where: { id: transactionId },
                data: {
                    t_TotalMarketValue: updatedTotalMarketValue,
                    t_TotalConsiderationValue: updatedTotalConsideration,
                    t_TaxBase: updatedTaxBase,
                    t_TotalSurcharge: updatedTotalSurcharge,
                    t_TotalInterest: updatedTotalInterest,
                    t_TotalAmountDue: updatedTotalAmountDue
                }
            });
        });

        return { success: true };
    } catch (error) {
        console.error("Error in updateBasicTransferTax:", error);
        return { error: "Failed to update transaction." };
    }
}

export async function updateNotarialDocumentAttachment(notarialId: string, documentUrl: string) {
    try {
        await prisma.notarialDocument.update({
            where: { id: notarialId },
            data: { document_url: documentUrl }
        });
        revalidatePath('/newTransferTax');
        return { success: true };
    } catch (error) {
        console.error("Failed to update attachment", error);
        return { success: false, error: "Failed to update attachment" };
    }
}

export async function captureTransferTaxPayment(
    transactionId: string,
    receiptNumber: string,
    amount: number,
    paymentDate: string,
    modeOfPayment: string
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: "Unauthorized. Please log in." };
        }
        
        const tx = await prisma.newTransferTax.findUnique({
            where: { id: transactionId },
            include: { notarialDocument: true, t_transfertaxdetails: true }
        });
        
        if (!tx || !tx.notarialDocument) {
            return { error: "Transaction not found." };
        }
        
        const pDate = new Date(paymentDate);
        let isRecomputed = false;
        
        // Recompute if payment date > validity date
        if (pDate > tx.t_validity) {
            let totalSurcharge = 0;
            let totalInterest = 0;
            let totalAmountDue = 0;
            let overallDaysElapsed = 0;
            let overallValidityDate = "";

            for (const detail of tx.t_transfertaxdetails) {
                let mappedType = detail.nt_transactiontype.toUpperCase();
                if (mappedType === "SALE") mappedType = "DEED OF SALE";
                else if (mappedType === "EXTRAJUDICIAL SETTLEMENT") mappedType = "DEED OF EXTRAJUDICIAL SETTLEMENT";
                else if (mappedType === "DONATION") mappedType = "DEED OF DONATION";
                else if (mappedType === "WAIVER OF RIGHTS") mappedType = "DEED OF WAIVER OF RIGHTS";
                else if (mappedType === "PARTITION") mappedType = "DEED OF PARTITION";
                else if (mappedType === "ADJUDICATION") mappedType = "DEED OF ADJUDICATION";

                const computed = TransferTaxCalculator.computeTotal(
                    mappedType,
                    Number(detail.nt_marketvalue),
                    Number(detail.nt_considerationvalue),
                    tx.notarialDocument.notarialDate.toISOString(),
                    1,
                    pDate
                );

                await prisma.newTransferTaxDetails.update({
                    where: { id: detail.id },
                    data: {
                        nt_surcharge: computed.surcharge,
                        nt_interest: computed.interest,
                        nt_totalTransferTaxDue: computed.basicTaxDue + computed.surcharge + computed.interest
                    }
                });

                totalSurcharge += computed.surcharge;
                totalInterest += computed.interest;
                totalAmountDue += (computed.basicTaxDue + computed.surcharge + computed.interest);
                overallDaysElapsed = computed.daysElapsed;
                overallValidityDate = computed.validityDate;
            }

            await prisma.newTransferTax.update({
                where: { id: transactionId },
                data: {
                    t_DateCompute: pDate,
                    t_TotalSurcharge: totalSurcharge,
                    t_TotalInterest: totalInterest,
                    t_TotalAmountDue: totalAmountDue,
                    t_daysElapsed: overallDaysElapsed,
                    t_validity: overallValidityDate === "MAXIMUM INTEREST REACHED" ? new Date("2099-12-31") : new Date(overallValidityDate || new Date(pDate).setDate(pDate.getDate() + 30))
                }
            });
            isRecomputed = true;
        }
        
        // Create the payment
        await prisma.capturedPayment.create({
            data: {
                cp_receiptnumber: receiptNumber,
                cp_amount: amount,
                cp_paymentDate: pDate,
                cp_remarks: "Paid via " + modeOfPayment,
                cp_modeOfPayment: modeOfPayment,
                cp_NewTransferTaxId: transactionId,
                cp_UserId: session.user.id
            }
        });
        
        // Update the NewTransferTax
        await prisma.newTransferTax.update({
            where: { id: transactionId },
            data: {
                t_status: "paid",
                t_paymentStatus: "paid"
            }
        });
        
        return { success: true, isRecomputed };
    } catch (error: any) {
        console.error("Error capturing payment:", error);
        if (error.code === 'P2002') {
             return { error: "Receipt number already exists." };
        }
        return { error: "Failed to capture payment." };
    }
}
