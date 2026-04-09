"use client"

import { useEffect, useState } from "react"
import QRCode from "react-qr-code"
import { useSession } from "next-auth/react"
import { DocumentInfo } from "@/lib/types/property"
import DocumentStep from "./DocumentStep"
import { TabsContent } from "../ui/tabs"
import TransactionStep from "./TransactionStep"
import { Tabs } from "../ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"

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

        </Tabs>
    )
}