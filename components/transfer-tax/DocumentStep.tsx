"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentInfo } from "@/lib/types/property";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import dynamic from "next/dynamic";
import { useState } from "react";

const UploadForm = dynamic(() => import("../uploadForm.tsx/page"), { ssr: false })

// 1. Define your common document types
const DOCUMENT_TYPES = [
    "DEED OF ABSOLUTE SALE",
    "DEED OF DONATION",
    "DEED OF EXTRAJUDICIAL SETTLEMENT",
    "DEED OF EXTRAJUDICIAL SETTLEMENT WITH SIMULATANEOUS SALE",
    "DEED OF EXTRAJUDICIAL SETTLEMENT WITH PARTITION",
    "DEED OF EXTRAJUDICIAL SETTLEMENT WITH DONATION",
    "DEED OF EXTRAJUDICIAL SETTLEMENT WITH PARTITION AND DONATION",
    "DEED OF EXTRAJUDICIAL SETTLEMENT WITH PARTITION AND SALE",
    "DEED OF EXTRAJUDICIAL SETTLEMENT WITH PARTITION AND WAIVER OF RIGHTS",
    "DEED OF ADJUDICATION",
    "DEED OF EXCHANGE",
    "DEED OF PARTITION",
    "DEED OF DEFINITE SALE",
    "DEED OF ASSIGNMENT",
    "DEED OF ASSIGNMENT OF RIGHTS, INTEREST AND PARTICIPATION",
    "CERTIFICATE OF SALE"
] as const;



interface DocumentStepProps {
    data: DocumentInfo;
    onDataChange: (newData: DocumentInfo) => void;
    // we can remove onUploadSuccess from the props if we handle it directly in onDataChange
    onNext: () => void;
}

export default function DocumentStep({ data, onDataChange, onNext }: DocumentStepProps) {

    //Helper to update specific fields
    const updateField = (field: keyof DocumentInfo, value: string) => {
        onDataChange({ ...data, [field]: value });
    };

    //Helper for the dynamic PDF URL
    const handleUploadSuccess = (url: string) => {
        onDataChange({ ...data, document_url: url });
    };

    const isComplete =
        data.type.trim() !== "" &&
        data.docNo.trim() !== "" &&
        data.pageNo.trim() !== "" &&
        data.bookNo.trim() !== "" &&
        data.notarizedBy.trim() !== "" &&
        data.date.trim() !== "" &&
        data.document_url.trim() !== "";



    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-small-caps">NOTARIAL DOCUMENTS</CardTitle>
                <CardDescription>
                    ALL FIELDS ARE MANDATORY. PLEASE ENSURE ACCURACY BEFORE PROCEEDING.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <Field>
                        <Label>Document Type <span className="text-destructive">*</span></Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 uppercase"
                            value={data.type}
                            onChange={(e) => updateField("type", e.target.value)}
                        >
                            <option value="" disabled>SELECT TYPE</option>
                            {DOCUMENT_TYPES.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </Field>

                    <Field>
                        <Label>Notarial Date <span className="text-destructive">*</span></Label>
                        <Input
                            type="date"
                            value={data.date}
                            onChange={(e) => updateField("date", e.target.value)}
                        />
                    </Field>

                    <Field>
                        <Label>Doc No. <span className="text-destructive">*</span></Label>
                        <Input
                            className="uppercase"
                            value={data.docNo}
                            onChange={(e) => updateField("docNo", e.target.value)}
                            placeholder="ENTER DOC NO."
                        />
                    </Field>

                    <Field>
                        <Label>Page No. <span className="text-destructive">*</span></Label>
                        <Input
                            className="uppercase"
                            value={data.pageNo}
                            onChange={(e) => updateField("pageNo", e.target.value)}
                            placeholder="ENTER PAGE NO."
                        />
                    </Field>

                    <Field>
                        <Label>Book No. <span className="text-destructive">*</span></Label>
                        <Input
                            className="uppercase"
                            value={data.bookNo}
                            onChange={(e) => updateField("bookNo", e.target.value)}
                            placeholder="ENTER BOOK NO."
                        />
                    </Field>

                    <Field>
                        <Label>Notarized By <span className="text-destructive">*</span></Label>
                        <Input
                            className="uppercase"
                            value={data.notarizedBy}
                            onChange={(e) => updateField("notarizedBy", e.target.value)}
                            placeholder="ENTER FULL NAME OF NOTARY"
                        />
                    </Field>
                </div>

                <div className="pt-4 border-t">
                    <Label className={`mb-2 block font-semibold ${!data.document_url ? 'text-destructive' : 'text-green-600'}`}>
                        {data.document_url ? '✅ DOCUMENT UPLOADED' : 'ATTACH SCANNED PDF (REQUIRED) *'}
                    </Label>
                    <UploadForm onUploadSuccess={handleUploadSuccess} />
                </div>
            </CardContent>
            <CardFooter className="flex flex-col items-end gap-2">
                {!isComplete && (
                    <p className="text-[10px] text-destructive italic font-bold">
                        * ALL FIELDS AND THE PDF UPLOAD ARE REQUIRED TO PROCEED.
                    </p>
                )}
                <Button
                    onClick={onNext}
                    disabled={!isComplete}
                    className="min-w-[150px]"
                >
                    Next: Transaction Type
                </Button>
            </CardFooter>
        </Card>
    );
}