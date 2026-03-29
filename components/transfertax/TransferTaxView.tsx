"use client"

import { useState } from "react"
import TransferTaxForm from "./TransferTaxForm"
import InvoicePreview from "@/components/invoice/invoice-preview"

export default function TransferTaxView() {
    const [previewData, setPreviewData] = useState<any>(null)

    if (previewData) {
        return (
            <div className="absolute inset-0 z-50 bg-gray-50 overflow-auto rounded-tl-xl md:rounded-tl-none">
                <InvoicePreview data={previewData} onBack={() => setPreviewData(null)} />
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-4 border rounded-lg p-4 bg-white shadow-sm">
            <TransferTaxForm onPreview={setPreviewData} />
        </div>
    )
}
