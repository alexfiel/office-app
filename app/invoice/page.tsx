"use client"

import InvoiceForm from "@/components/invoice/invoice-form";
import InvoicePreview from "@/components/invoice/invoice-preview";
import TransferTaxForm from "@/components/transfertax/TransferTaxForm";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useState } from "react";

export default function InvoicePage() {
    const [previewData, setPreviewData] = useState<any>(null);

    return (
        <>
            {previewData && (
                <InvoicePreview data={previewData} onBack={() => setPreviewData(null)} />
            )}
            
            <div className={`min-h-screen bg-gray-50 p-4 ${previewData ? 'hidden' : ''}`}>
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold">Office of the City Treasurer</h1>
                            <p className="text-gray-600">City of Tagbilaran</p>
                        </div>
                    </div>

                    <TransferTaxForm onPreview={(data) => setPreviewData(data)} />
                </div>
            </div>
        </>
    )
}
