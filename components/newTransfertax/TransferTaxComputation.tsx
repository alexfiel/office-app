"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calculator, ArrowLeft, ArrowRight, Save, CalendarDays, Receipt } from "lucide-react";
import { toast } from "sonner";
import { saveTransferTaxTransaction } from "@/lib/actions/transfertax-actions";
import { calculateTaxPenalties } from "@/lib/tax-utils";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const LOCAL_TAX_RATE = 0.005; // 0.5%
const SURCHARGE_RATE = 0.25; // 25%
const INTEREST_RATE_PER_MONTH = 0.02; // 2%
const MAX_INTEREST_MONTHS = 36;
const GRACE_PERIOD_DAYS = 60;

export function TransferTaxComputation() {
    const router = useRouter();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [documentData, setDocumentData] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [transactionData, setTransactionData] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [cart, setCart] = useState<any[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showNextTxDialog, setShowNextTxDialog] = useState(false);

    useEffect(() => {
        try {
            // Load Document
            const docMatch = document.cookie.match(new RegExp('(^| )transferTaxDocument=([^;]+)'));
            if (docMatch) setDocumentData(JSON.parse(decodeURIComponent(docMatch[2])));
            else {
                toast.error("Missing document data. Redirecting.");
                router.push("/newTransferTax");
                return;
            }

            // Load Cart
            const cartMatch = document.cookie.match(new RegExp('(^| )rpt-cart=([^;]+)'));
            if (cartMatch) setCart(JSON.parse(decodeURIComponent(cartMatch[2])));
            else {
                toast.error("Missing properties cart. Redirecting.");
                router.push("/newTransferTax/search-property");
                return;
            }

            // Load Transaction
            const txMatch = document.cookie.match(new RegExp('(^| )transferTaxTransaction=([^;]+)'));
            if (txMatch) setTransactionData(JSON.parse(decodeURIComponent(txMatch[2])));
            else {
                toast.error("Missing transaction data. Redirecting.");
                router.push("/newTransferTax/transaction");
                return;
            }

        } catch (e) {
            console.error("Failed to parse cookies", e);
        }
    }, [router]);

    if (!documentData || !transactionData || !cart.length) {
        return <div className="flex justify-center p-12"><div className="animate-pulse flex items-center gap-2"><Calculator className="w-5 h-5 text-gray-400" /> <span className="text-gray-500">Loading Computation...</span></div></div>;
    }

    // Determine Total Market Value from cart and EJS data
    const totalMarketValue = cart.reduce((acc, property) => {
        const pData = transactionData.propertyEjsData?.[property.id];
        const isEjsType = ["Extrajudicial Settlement", "Donation", "Waiver of Rights"].includes(transactionData.transactionType);
        const isPartitionType = transactionData.transactionType === "Partition";
        const isAdjudicationType = transactionData.transactionType === "Adjudication";
        
        let displayValue = Number(property.marketValue);
        let finalArea = Number(property.area) || 0;

        if (isEjsType && pData) {
            const totalOwners = pData.parsedOwners.length;
            const selectedCount = pData.selectedOwners.length;
            if (totalOwners > 0 && selectedCount > 0) {
                displayValue = (displayValue / totalOwners) * selectedCount;
            } else if (totalOwners > 0) {
                displayValue = 0;
            }
        } else if (isPartitionType && pData) {
            const suppliedArea = pData.suppliedArea || 0;
            if (suppliedArea > 0 && finalArea > 0) {
                displayValue = (displayValue / finalArea) * suppliedArea;
            } else {
                displayValue = 0;
            }
        } else if (isAdjudicationType && pData) {
            if (pData.adjudicationType === "Whole") {
                // keep 100%
            } else if (pData.adjudicationType === "Portion") {
                if (pData.portionType === "Percent") {
                    const pct = pData.percentShare || 0;
                    displayValue = displayValue * (pct / 100);
                } else if (pData.portionType === "Area") {
                    const suppliedArea = pData.suppliedArea || 0;
                    if (suppliedArea > 0 && finalArea > 0) {
                        displayValue = (displayValue / finalArea) * suppliedArea;
                    } else {
                        displayValue = 0;
                    }
                } else {
                    displayValue = 0;
                }
            } else {
                displayValue = 0;
            }
        } else if (transactionData.transactionType === "Sale" && pData) {
            if (pData.saleScope === "Whole") {
                // keep 100%
            } else if (pData.saleScope === "Portion") {
                const suppliedArea = pData.suppliedArea || 0;
                if (suppliedArea > 0 && finalArea > 0) {
                    displayValue = (displayValue / finalArea) * suppliedArea;
                } else {
                    displayValue = 0;
                }
            } else {
                displayValue = 0;
            }
        }
        return acc + displayValue;
    }, 0);

    const considerationValue = transactionData.transactionType === "Sale" ? transactionData.considerationValue : 0;
    const taxBase = Math.max(totalMarketValue, considerationValue);
    const taxDue = taxBase * LOCAL_TAX_RATE;

    const penaltyResult = calculateTaxPenalties(taxDue, documentData.notarialDate);
    const { daysElapsed, surcharge, interest, totalAmountDue, validityDate: validityDateStr } = penaltyResult;

    const handleSaveTransaction = async () => {
        setIsSubmitting(true);
        try {
            // Verify if attachment was properly uploaded
            if (!documentData?.documentUrl) {
                toast.error("Missing document attachment. Please go back and upload the Notarial Document.");
                setIsSubmitting(false);
                return;
            }

            if (documentData.documentUrl.startsWith('blob:')) {
                toast.error("Document attachment was not properly saved. Please go back and re-upload the Notarial Document.");
                setIsSubmitting(false);
                return;
            }

            const result = await saveTransferTaxTransaction({
                documentData,
                transactionData,
                cart,
                computationData: {
                    totalAmountDue,
                    surcharge,
                    interest,
                    daysElapsed,
                    validityDate: validityDateStr,
                    totalMarketValue,
                    considerationValue,
                    taxBase
                }
            });

            if (result.error) {
                toast.error(result.error);
                return;
            }

            toast.success("Transfer Tax Transaction successfully saved!");
            
            // If NotarialDocument was created newly, update its ID in the cookie so next tx can link to it
            if (result.notarialDocumentId && !documentData.id) {
                const updatedDocData = { ...documentData, id: result.notarialDocumentId };
                document.cookie = `transferTaxDocument=${encodeURIComponent(JSON.stringify(updatedDocData))}; path=/`;
                setDocumentData(updatedDocData);
            }

            setShowNextTxDialog(true);
        } catch (error) {
            console.error("Failed to save:", error);
            toast.error("An error occurred while saving the transaction.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleContinueAnother = () => {
        // Clear transaction and cart, but keep the notarial document
        document.cookie = "transferTaxTransaction=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "rpt-cart=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        router.push("/newTransferTax/search-property");
    };

    const handleFinish = () => {
        const notarialId = documentData?.id;
        // Clear all cookies
        document.cookie = "transferTaxDocument=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "rpt-cart=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "transferTaxTransaction=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        
        if (notarialId) {
            router.push(`/newTransferTax/summary/${notarialId}`);
        } else {
            router.push("/newTransferTax");
        }
    };

    const handleBack = () => {
        router.push("/newTransferTax/transaction");
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
            <Card className="border-2 shadow-lg rounded-2xl overflow-hidden bg-white mb-8">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 pt-8 pb-6 px-6 border-b">
                    <CardHeader className="text-center space-y-4 p-0">
                        <div className="mx-auto bg-white w-16 h-16 rounded-full flex items-center justify-center shadow-sm border border-blue-100">
                            <Calculator className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="space-y-1.5">
                            <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
                                Transfer Tax Computation
                            </CardTitle>
                            <CardDescription className="text-base text-gray-500 max-w-md mx-auto">
                                Review the computed tax assessment and transaction summary before saving the record.
                            </CardDescription>
                        </div>
                    </CardHeader>
                </div>

                <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x border-b">
                        
                        {/* Left Side: Summary Meta */}
                        <div className="md:col-span-5 p-6 bg-gray-50/50 space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-600" />
                                    Transaction Overview
                                </h3>
                                <dl className="space-y-3 text-sm">
                                    <div className="grid grid-cols-3">
                                        <dt className="text-gray-500 col-span-1">Doc Title:</dt>
                                        <dd className="font-semibold text-gray-900 col-span-2 text-right">{documentData.documentName}</dd>
                                    </div>
                                    <div className="grid grid-cols-3">
                                        <dt className="text-gray-500 col-span-1">Doc Type:</dt>
                                        <dd className="font-semibold text-gray-900 col-span-2 text-right">{documentData.documentType}</dd>
                                    </div>
                                    <div className="grid grid-cols-3">
                                        <dt className="text-gray-500 col-span-1">Doc No:</dt>
                                        <dd className="font-semibold text-gray-900 col-span-2 text-right">{documentData.documentNumber}</dd>
                                    </div>
                                    <div className="grid grid-cols-3">
                                        <dt className="text-gray-500 col-span-1">Tx Type:</dt>
                                        <dd className="font-semibold text-gray-900 col-span-2 text-right">{transactionData.transactionType}</dd>
                                    </div>
                                    <div className="border-t pt-3 mt-3"></div>
                                    <div className="grid grid-cols-3">
                                        <dt className="text-gray-500 col-span-1">Transferor:</dt>
                                        <dd className="font-semibold text-gray-900 col-span-2 text-right line-clamp-2">{transactionData.transferor}</dd>
                                    </div>
                                    <div className="grid grid-cols-3">
                                        <dt className="text-gray-500 col-span-1">Transferee:</dt>
                                        <dd className="font-semibold text-gray-900 col-span-2 text-right line-clamp-2">{transactionData.transferee}</dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="pt-2">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <CalendarDays className="w-4 h-4 text-blue-600" />
                                    Date & Deadlines
                                </h3>
                                <dl className="space-y-3 text-sm">
                                    <div className="grid grid-cols-3">
                                        <dt className="text-gray-500 col-span-1">Date:</dt>
                                        <dd className="font-semibold text-gray-900 col-span-2 text-right">{new Date(documentData.notarialDate).toLocaleDateString()}</dd>
                                    </div>
                                    <div className="grid grid-cols-3">
                                        <dt className="text-gray-500 col-span-1">Elapsed:</dt>
                                        <dd className={`font-semibold col-span-2 text-right ${daysElapsed > GRACE_PERIOD_DAYS ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {daysElapsed} Days
                                        </dd>
                                    </div>
                                    <div className="grid grid-cols-3">
                                        <dt className="text-gray-500 col-span-1">Status:</dt>
                                        <dd className="font-semibold col-span-2 text-right flex justify-end">
                                            {daysElapsed > GRACE_PERIOD_DAYS ? (
                                                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs">Past Due</span>
                                            ) : (
                                                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs">On Time</span>
                                            )}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        {/* Right Side: Computation */}
                        <div className="md:col-span-7 p-6 md:p-8 bg-white">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-gray-700" />
                                Assessment Computation
                            </h3>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-gray-600 font-medium">Total Market Value</span>
                                    <span className="text-gray-900 font-bold">₱{totalMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                
                                {transactionData.transactionType === "Sale" && (
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-gray-600 font-medium">Consideration Value</span>
                                        <span className="text-gray-900 font-bold">₱{considerationValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center py-3 border-y border-dashed border-gray-300 bg-gray-50/50 -mx-4 px-4">
                                    <span className="text-gray-800 font-bold">Tax Base <span className="text-xs font-normal text-gray-500 ml-1">(Higher Value)</span></span>
                                    <span className="text-indigo-700 font-bold text-lg">₱{taxBase.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>

                                <div className="flex justify-between items-center py-2 pt-4">
                                    <span className="text-gray-600 font-medium">Transfer Tax Due <span className="text-xs text-gray-400 ml-1">(0.5%)</span></span>
                                    <span className="text-gray-900 font-semibold">₱{taxDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>

                                <div className="flex justify-between items-center py-2">
                                    <span className="text-gray-600 font-medium">Surcharge <span className="text-xs text-gray-400 ml-1">{daysElapsed > GRACE_PERIOD_DAYS ? "(25%)" : "(0%)"}</span></span>
                                    <span className={`font-semibold ${surcharge > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                        ₱{surcharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center py-2">
                                    <span className="text-gray-600 font-medium">Interest <span className="text-xs text-gray-400 ml-1">{daysElapsed > GRACE_PERIOD_DAYS ? "(2% / mo)" : "(0%)"}</span></span>
                                    <span className={`font-semibold ${interest > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                        ₱{interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center py-5 mt-4 border-t-2 border-gray-900">
                                    <span className="text-gray-900 font-black text-xl uppercase tracking-tight">Total Amount Due</span>
                                    <span className="text-emerald-600 font-black text-2xl tracking-tight">
                                        ₱{totalAmountDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="px-6 py-5 bg-gray-50 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                    <Button variant="ghost" onClick={handleBack} disabled={isSubmitting} className="w-full sm:w-auto text-gray-600 hover:text-gray-900 font-medium">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Revise Details
                    </Button>
                    <p className="text-xs text-gray-500 font-bold hidden sm:block">
                        Step 4 of 4 • Final Computation
                    </p>
                    <Button
                        size="lg"
                        onClick={handleSaveTransaction}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto font-bold shadow-sm transition-all bg-blue-600 hover:bg-blue-700"
                    >
                        {isSubmitting ? (
                            <>Processing...</>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Transaction
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>

            <AlertDialog open={showNextTxDialog} onOpenChange={setShowNextTxDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Transaction Saved Successfully!</AlertDialogTitle>
                        <AlertDialogDescription>
                            The Transfer Tax details have been saved, and the real property owners have been updated.
                            <br /><br />
                            Would you like to add another computation using the same Notarial Document and selected properties?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleFinish}>No, I&apos;m done</AlertDialogCancel>
                        <AlertDialogAction onClick={handleContinueAnother} className="bg-blue-600 hover:bg-blue-700">
                            Yes, add another computation
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
