"use client"

import { useEffect, useState } from "react"
import QRCode from "react-qr-code"
import { useSession } from "next-auth/react"
import { DocumentInfo, RealPropertyInfo } from "@/lib/types/property"
import DocumentStep from "./DocumentStep"
import { TabsContent } from "../ui/tabs"
import TransactionStep from "./TransactionStep"
import { Tabs } from "../ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { PropertySearchStep } from "./PropertySearchStep"
import { PartiesStep } from "./PartiesStep"
import { PropertyCartStep } from "./PropertyCartStep"
import { useTaxComputation, useEJSComputation } from "@/hooks/use-tax-computation"
import { SummaryStep } from "./SummaryStep"
import { toast } from "sonner"
import InvoicePreview from "@/components/invoice/invoice-preview"
import { EJSTransferModal } from "./EJSTransferModal"

export default function TransferTxFrm() {
    const { data: session } = useSession()
    const [activeTab, setActiveTab] = useState("documents")

    const [transactionType, setTransactionType] = useState<string>("");
    const [consideration, setConsideration] = useState<number | "">("");

    const [documentInfo, setDocumentInfo] = useState<DocumentInfo>({
        type: "",
        docNo: "",
        pageNo: "",
        bookNo: "",
        notarizedBy: "",
        date: "",
        document_url: ""
    });


    const [cart, setCart] = useState<RealPropertyInfo[]>([]);

    const onAddToCart = (property: RealPropertyInfo) => {
        setCart((prev) => [...prev, property]);
    };

    const removeFromCart = (id: string) => {
        setCart((prev) => prev.filter((item) => item.id !== id));
    };

    const [parties, setParties] = useState({
        prevOwner: "",
        newOwner: ""
    });

    const ejsChainComputation = useEJSComputation(cart, documentInfo.date);
    const { ejsChain, setEjsChain } = ejsChainComputation;

    const [isEjsModalOpen, setIsEjsModalOpen] = useState(false);
    const [selectedEjsProperty, setSelectedEjsProperty] = useState<RealPropertyInfo | null>(null);

    const handleAddEJSTransfer = (newTransfer: any) => {
        setEjsChain((prev: any) => [...prev, newTransfer]);
        setIsEjsModalOpen(false);
        setSelectedEjsProperty(null);
    }

    const isEJS = transactionType === "DEED OF EXTRAJUDICIAL SETTLEMENT";

    const computation = useTaxComputation({
        notarialDate: documentInfo.date,
        transactionType: transactionType,
        totalMarketValue: cart.reduce((total, item) => {
            const val = typeof item.marketValue === 'string' ? parseFloat(item.marketValue) : item.marketValue;
            return total + (isNaN(val) ? 0 : val);
        }, 0),
        consideration: consideration,
    });

    // Use aggregate EJS totals if applicable, otherwise fallback to standard computation
    const effectivityComputation = isEJS ? ejsChainComputation.totals : computation;

    const [isSuccess, setIsSuccess] = useState(false);
    const [savedTxId, setSavedTxId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);


    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const payload = {
                // 1. Matches documentInfo in your API
                documentInfo: {
                    name: documentInfo.type, // Map type to name if schema requires it
                    type: documentInfo.type,
                    number: `DOC: ${documentInfo.docNo}, PAGE: ${documentInfo.pageNo}, BOOK: ${documentInfo.bookNo}`,
                    date: new Date(documentInfo.date).toISOString(),
                    notarizedBy: documentInfo.notarizedBy,
                    document_url: "", // Add if you have file uploads
                },
                // 2. Matches transferTaxInfo in your API
                transferTaxInfo: {
                    transferee: isEJS ? (ejsChain[0]?.heirs || "N/A") : parties.newOwner,
                    transferor: isEJS ? (ejsChain[0]?.deceasedOwner || "N/A") : parties.prevOwner,
                    transactionType: transactionType,
                    considerationValue: isEJS ? 0 : (Number(consideration) || 0),
                    totalMarketValue: isEJS ? 0 : effectivityComputation.totalMarketValue,
                    taxBase: effectivityComputation.taxBase,
                    taxDue: effectivityComputation.basicTaxDue,
                    surcharge: effectivityComputation.surcharge,
                    interest: effectivityComputation.interest,
                    totalAmountDue: effectivityComputation.totalAmountDue,
                    paymentStatus: "PENDING",
                    transactionDate: new Date().toISOString(),
                    validUntil: computation.validityDate,
                    dayselapsed: computation.daysElapsed,
                },
                // 3. Matches transferTaxDetails in your API
                transferTaxDetails: cart.map((item) => ({
                    id: item.id, // Used for the 'connect' in Prisma
                    taxdecnumber: item.taxdecnumber,
                    lotNumber: item.lotNumber,
                    owner: item.owner,
                    marketValue: Number(item.marketValue),
                    area: Number(item.area),
                })),
                chainTransactions: ejsChain,
            };

            const res = await fetch("/api/transfertax", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                // If Zod fails, the details will be in data.details
                console.error("Validation Details:", data.details);
                throw new Error(data.error || "SAVE FAILED");
            }

            setIsSuccess(true);
            setSavedTxId(data.result?.id || null);
            toast.success("TRANSACTION SAVED SUCCESSFULLY");

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setIsSuccess(false);
        setSavedTxId(null);
        setCart([]);
        setParties({ prevOwner: "", newOwner: "" });
        setActiveTab("documents");
    };

    if (isSuccess) {
        return (
            <InvoicePreview
                onBack={handleReset}
                data={{
                    transactionId: savedTxId || "SUCCESS",
                    transferee: isEJS ? (ejsChain[0]?.heirs || "N/A") : parties.newOwner,
                    transferor: isEJS ? (ejsChain[0]?.deceasedOwner || "N/A") : parties.prevOwner,
                    computationDate: new Date().toLocaleDateString(),
                    validityDate: effectivityComputation.validityDate,
                    properties: cart.map((item) => ({
                        ...item,
                        marketValue: Number(item.marketValue),
                        area: Number(item.area),
                    })),
                    totalMarketValue: isEJS ? "N/A" : effectivityComputation.totalMarketValue,
                    documentInfo: documentInfo,
                    transactionInfo: {
                        type: transactionType,
                        consideration: isEJS ? "N/A" : effectivityComputation.consideration,
                        dayselapsed: effectivityComputation.daysElapsed
                    },
                    ejsChain: ejsChain,
                    computation: {
                        taxBase: effectivityComputation.taxBase,
                        taxRate: effectivityComputation.taxRate,
                        basicTaxDue: effectivityComputation.basicTaxDue,
                        surcharge: effectivityComputation.surcharge,
                        interest: effectivityComputation.interest,
                        totalAmountDue: effectivityComputation.totalAmountDue
                    },
                    preparedBy: session?.user?.name || "OFFICE STAFF",
                    preparedByDesignation: "REVENUE EXAMINER"
                }}
            />
        );
    }
    //END OF NEW CODE BLOCK

    // Helper to trigger EJS modal from summary or cart
    const onTriggerEjsModal = (property: RealPropertyInfo) => {
        setSelectedEjsProperty(property);
        setIsEjsModalOpen(true);
    };

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="documents">
                <DocumentStep
                    data={documentInfo}
                    onDataChange={setDocumentInfo}
                    onNext={() => setActiveTab("transaction-type")}
                />
            </TabsContent>
            <TabsContent value="transaction-type">
                <TransactionStep
                    transactionType={transactionType}
                    consideration={consideration}
                    onTypeChange={setTransactionType}
                    onConsiderationChange={setConsideration}
                    onBack={() => setActiveTab("documents")}
                    onNext={() => setActiveTab("properties")}
                />
            </TabsContent>
            <TabsContent value="properties">
                <PropertySearchStep
                    cart={cart}
                    onAddToCart={onAddToCart}
                    onBack={() => setActiveTab("transaction-type")}
                    onNext={() => setActiveTab("cart")}
                />
            </TabsContent>
            <TabsContent value="cart">
                <PropertyCartStep
                    cart={cart}
                    ejsChain={ejsChain}
                    onRemove={removeFromCart}
                    onBack={() => setActiveTab("properties")}
                    onNext={() => setActiveTab(isEJS ? "summary" : "parties")}
                    onTriggerEjsTransfer={onTriggerEjsModal}
                    isEJS={isEJS}
                />
            </TabsContent>

            {/* Tab 5 */}
            <TabsContent value="parties">
                <PartiesStep
                    prevOwner={parties.prevOwner}
                    newOwner={parties.newOwner}
                    onPrevOwnerChange={(val) => setParties({ ...parties, prevOwner: val })}
                    onNewOwnerChange={(val) => setParties({ ...parties, newOwner: val })}
                    taxBase={computation.taxBase} // From our useTaxComputation hook
                    totalDue={computation.totalAmountDue}
                    onBack={() => setActiveTab("cart")}
                    onNext={() => setActiveTab("summary")}
                />
            </TabsContent>

            <TabsContent value="summary">
                <SummaryStep
                    documentInfo={documentInfo}
                    transactionType={transactionType}
                    cart={cart}
                    parties={parties}
                    ejsChain={ejsChain}
                    onTriggerEjsTransfer={onTriggerEjsModal}
                    computation={effectivityComputation}
                    isSuccess={isSuccess}
                    savedTxId={savedTxId}
                    isLoading={isLoading}
                    onSubmit={handleSubmit}
                    onReset={handleReset}
                    onBack={() => setActiveTab("parties")}
                />
            </TabsContent>

            <EJSTransferModal
                isOpen={isEjsModalOpen}
                onClose={() => setIsEjsModalOpen(false)}
                property={selectedEjsProperty}
                onAddTransfer={handleAddEJSTransfer}
            />
        </Tabs>
    )
}