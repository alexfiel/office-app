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
import { useTaxComputation } from "@/hooks/use-tax-computation"
import { SummaryStep } from "./SummaryStep"
import { toast } from "sonner"
import InvoicePreview from "@/components/invoice/invoice-preview"

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

    const computation = useTaxComputation({
        notarialDate: documentInfo.date,
        transactionType: transactionType,
        totalMarketValue: cart.reduce((total, item) => {
            const val = typeof item.marketValue === 'string' ? parseFloat(item.marketValue) : item.marketValue;
            return total + (isNaN(val) ? 0 : val);
        }, 0),
        consideration: consideration,
    });

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
                    transferee: parties.newOwner,
                    transferor: parties.prevOwner,
                    transactionType: transactionType,
                    considerationValue: Number(consideration) || 0,
                    totalMarketValue: computation.totalMarketValue,
                    taxBase: computation.taxBase,
                    taxDue: computation.taxDue,
                    surcharge: computation.surcharge,
                    interest: computation.interest,
                    totalAmountDue: computation.totalAmountDue,
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
                    transferee: parties.newOwner,
                    transferor: parties.prevOwner,
                    computationDate: new Date().toLocaleDateString(),
                    validityDate: computation.validityDate,
                    properties: cart.map((item) => ({
                        ...item,
                        marketValue: Number(item.marketValue),
                        area: Number(item.area),
                    })),
                    totalMarketValue: computation.totalMarketValue,
                    documentInfo: documentInfo,
                    transactionInfo: {
                        type: transactionType,
                        consideration: computation.consideration,
                        dayselapsed: computation.daysElapsed
                    },
                    computation: {
                        taxBase: computation.taxBase,
                        taxDue: computation.taxDue,
                        surcharge: computation.surcharge,
                        interest: computation.interest,
                        totalAmountDue: computation.totalAmountDue
                    },
                    preparedBy: "OFFICE STAFF",
                    preparedByDesignation: "REVENUE EXAMINER"
                }}
            />
        );
    }
    //END OF NEW CODE BLOCK

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
                    onRemove={removeFromCart}
                    onBack={() => setActiveTab("properties")}
                    onNext={() => setActiveTab("parties")}
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
                    computation={{
                        ...computation,
                        taxBase: computation.taxBase,
                        totalAmountDue: computation.totalAmountDue,

                    }}// From useTaxComputation hook
                    isSuccess={isSuccess}
                    savedTxId={savedTxId}
                    isLoading={isLoading}
                    onSubmit={handleSubmit}
                    onReset={handleReset}
                    onBack={() => setActiveTab("parties")}
                />
            </TabsContent>

        </Tabs>
    )
}