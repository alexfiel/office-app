"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

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

        // Generate a random control number
        const controlNumber = `TT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // 2. Create NewTransferTax
        const newTransferTax = await prisma.newTransferTax.create({
            data: {
                t_controlNumber: controlNumber,
                t_TotalAmountDue: computationData.totalAmountDue,
                t_TotalSurcharge: computationData.surcharge,
                t_TotalInterest: computationData.interest,
                t_NotarialId: notarialId,
                t_DateCompute: new Date(),
                t_validity: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 days validity?
                t_daysElapsed: computationData.daysElapsed,
                t_status: "pending",
                t_paymentStatus: "unpaid",
                t_paymentReference: `PR-${Date.now()}`, // Or leave empty if not required, but it's marked unique and not nullable? Let's check schema.
                t_remarks: "Processed via portal",
                t_userId: userId,
            }
        });

        // 3. Create Details and update real property
        for (const property of cart) {
            const pData = transactionData.propertyEjsData?.[property.id];
            const isEjsType = ["Extrajudicial Settlement", "Donation", "Waiver of Rights"].includes(transactionData.transactionType);
            
            let displayValue = Number(property.marketValue);
            if (isEjsType && pData) {
                const totalOwners = pData.parsedOwners.length;
                const selectedCount = pData.selectedOwners.length;
                if (totalOwners > 0 && selectedCount > 0) {
                    displayValue = (displayValue / totalOwners) * selectedCount;
                } else if (totalOwners > 0) {
                    displayValue = 0;
                }
            }

            const considerationValue = transactionData.transactionType === "Sale" ? Number(transactionData.considerationValue) : 0;
            const taxBase = Math.max(displayValue, considerationValue);
            
            // Apportion tax due simply (this could be proportionate if needed, but here we just store the totals or proportional)
            // Wait, does the schema expect proportional tax per property?
            // "nt_transfertaxDue Decimal"
            // For simplicity, if it's 1 property, it's just the tax. If multiple, we should apportion.
            const apportionedDue = taxBase * 0.005; 
            const apportionedSurcharge = computationData.daysElapsed > 60 ? apportionedDue * 0.25 : 0;
            
            let apportionedInterest = 0;
            if (computationData.daysElapsed > 60) {
                const daysDelayed = computationData.daysElapsed - 60;
                const monthsDelayed = Math.ceil(daysDelayed / 30);
                const cappedMonths = Math.min(monthsDelayed, 36);
                apportionedInterest = apportionedDue * 0.02 * cappedMonths;
            }

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
