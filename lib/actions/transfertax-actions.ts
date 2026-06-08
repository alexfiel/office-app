"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { TransferTaxCalculator } from "@/lib/tax-calculator";

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
                    document_url: documentData.fileUrl || "",
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
            
            let displayValue = Number(property.marketValue);
            if (isEjsType && pData) {
                const totalOwners = pData.parsedOwners?.length || 0;
                const selectedCount = pData.selectedOwners?.length || 0;
                if (totalOwners > 0 && selectedCount > 0) {
                    displayValue = (displayValue / totalOwners) * selectedCount;
                } else if (totalOwners > 0) {
                    displayValue = 0;
                }
            }

            const considerationValue = transactionData.transactionType === "Sale" ? Number(transactionData.considerationValue) : 0;
            
            let mappedType = transactionData.transactionType.toUpperCase();
            if (mappedType === "SALE") mappedType = "DEED OF SALE";
            else if (mappedType === "EXTRAJUDICIAL SETTLEMENT") mappedType = "DEED OF EXTRAJUDICIAL SETTLEMENT";
            else if (mappedType === "DONATION") mappedType = "DEED OF DONATION";
            else if (mappedType === "WAIVER OF RIGHTS") mappedType = "DEED OF WAIVER OF RIGHTS";

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
                    nt_lotnumber: property.lotNumber || "",
                    nt_area: Number(property.area) || 0,
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
                        return !transferorsToRemove.some(tToRemove => o.includes(tToRemove) || tToRemove.includes(o));
                    });
                    
                    updatedOwner = newOwnerList.join(", ");
                } else {
                    // If it's a completely new buyer, they become the sole owner (standard assumption for outright sale)
                    updatedOwner = transfereeCaps;
                }
            }

            await prisma.realProperty.update({
                where: { id: property.id },
                data: {
                    owner: updatedOwner
                }
            });
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
