"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, FileText, X, File, ArrowRight } from "lucide-react";
import { uploadFile } from "@/lib/upload/upload-action";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const PdfPreview = dynamic(() => import("./PdfPreview"), {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 w-[120px] h-[160px] rounded" />,
});

export function NotarialDocument() {
    const router = useRouter();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [documentName, setDocumentName] = useState("");
    const [documentType, setDocumentType] = useState("");
    const [docNo, setDocNo] = useState("");
    const [pageNo, setPageNo] = useState("");
    const [bookNo, setBookNo] = useState("");
    const [caseNo, setCaseNo] = useState("");
    const [notarialDate, setNotarialDate] = useState("");
    const [notarizedBy, setNotarizedBy] = useState("");
    const [recoveredFileName, setRecoveredFileName] = useState("");

    // Recover data from cookies
    useEffect(() => {
        try {
            const match = document.cookie.match(new RegExp('(^| )transferTaxDocument=([^;]+)'));
            if (match) {
                const storedData = JSON.parse(decodeURIComponent(match[2]));
                
                if (storedData.documentName) setDocumentName(storedData.documentName);
                if (storedData.documentType) setDocumentType(storedData.documentType);
                if (storedData.notarialDate) setNotarialDate(storedData.notarialDate);
                if (storedData.notarizedBy) setNotarizedBy(storedData.notarizedBy);
                if (storedData.documentUrl) setPreviewUrl(storedData.documentUrl);
                if (storedData.fileName) setRecoveredFileName(storedData.fileName);
                
                if (storedData.documentNumber) {
                    if (storedData.documentType === "Court") {
                        const caseMatch = storedData.documentNumber.match(/Case No\. (.*)/);
                        if (caseMatch) setCaseNo(caseMatch[1]);
                    } else {
                        const docMatch = storedData.documentNumber.match(/Doc No\. (.*?); Page No\. (.*?); Book No\. (.*)/);
                        if (docMatch) {
                            setDocNo(docMatch[1]);
                            setPageNo(docMatch[2]);
                            setBookNo(docMatch[3]);
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Failed to parse transferTaxDocument cookie", e);
        }
    }, []);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFiles(files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFiles(files[0]);
        }
    };

    const handleFiles = (file: File) => {
        if (file.type === "application/pdf") {
            setSelectedFile(file);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            alert("Please upload a valid PDF document.");
        }
    };

    const clearSelection = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const isDocumentTypeCourt = documentType === "Court";
    const isTrackingValid = isDocumentTypeCourt ? !!caseNo : (!!docNo && !!pageNo && !!bookNo);
    const hasDocument = selectedFile || previewUrl;
    const isFormValid = hasDocument && documentName && documentType && isTrackingValid && notarialDate && notarizedBy;

    const handleNext = async () => {
        if (!hasDocument) return;
        setIsSubmitting(true);
        
        try {
            let finalUrl = previewUrl;

            // Only upload if a new file was explicitly selected
            if (selectedFile) {
                const formData = new FormData();
                formData.append("file", selectedFile);
                
                const uploadResult = await uploadFile(formData);
                if (uploadResult?.url) {
                    finalUrl = uploadResult.url;
                } else {
                    console.error("Upload failed: No URL returned");
                    alert("Failed to upload the document. Please try again.");
                    setIsSubmitting(false);
                    return;
                }
            }
            
            if (finalUrl) {
                const fullDocumentNumber = isDocumentTypeCourt
                    ? `Case No. ${caseNo}`
                    : `Doc No. ${docNo}; Page No. ${pageNo}; Book No. ${bookNo}`;

                const documentData = {
                    documentName,
                    documentType,
                    documentNumber: fullDocumentNumber,
                    notarialDate,
                    notarizedBy,
                    documentUrl: finalUrl,
                    fileName: selectedFile ? selectedFile.name : recoveredFileName
                };

                // Save data in cookies
                document.cookie = `transferTaxDocument=${encodeURIComponent(JSON.stringify(documentData))}; path=/`; // session cookie
                
                console.log("Document uploaded and data saved to cookies:", documentData);
                router.push("/newTransferTax/search-property");
            }
        } catch (error) {
            console.error("Error during upload and save:", error);
            alert("An unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
            <Card className="border-2 shadow-lg rounded-2xl overflow-hidden bg-white">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 pt-8 pb-6 px-6 border-b">
                    <CardHeader className="text-center space-y-4 p-0">
                        <div className="mx-auto bg-white w-16 h-16 rounded-full flex items-center justify-center shadow-sm border border-blue-100">
                            <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="space-y-1.5">
                            <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
                                Upload Notarial Document
                            </CardTitle>
                            <CardDescription className="text-base text-gray-500 max-w-md mx-auto">
                                Please upload the scanned PDF copy of the notarial document to begin the new transfer tax assessment.
                            </CardDescription>
                        </div>
                    </CardHeader>
                </div>

                <CardContent className="p-6 sm:p-10">
                    {!hasDocument ? (
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all duration-200 ease-in-out cursor-pointer min-h-[280px] ${isDragging
                                ? "border-blue-500 bg-blue-50 scale-[1.02]"
                                : "border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100/50"
                                }`}
                        >
                            <div className={`p-4 rounded-full shadow-sm mb-5 transition-colors ${isDragging ? "bg-blue-100" : "bg-white"}`}>
                                <UploadCloud className={`w-10 h-10 ${isDragging ? "text-blue-600" : "text-gray-400"}`} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                Click or drag document here
                            </h3>
                            <p className="text-sm text-gray-500 mb-6 text-center max-w-xs">
                                Support for single or multi-page PDF documents. Maximum file size 10MB.
                            </p>
                            <Button type="button" variant="outline" className="pointer-events-none bg-white font-medium shadow-sm">
                                Browse Files
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept=".pdf"
                                className="hidden"
                            />
                        </div>
                    ) : (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 rounded-2xl p-6 relative overflow-hidden group flex flex-col md:flex-row gap-6 items-center">
                            {/* Decorative background element */}
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none"></div>
                            
                            {/* PDF Thumbnail */}
                            {previewUrl && (
                                <div className="relative border border-gray-200 rounded shadow-sm overflow-hidden shrink-0 bg-white flex items-center justify-center min-h-[160px] min-w-[120px]">
                                    <PdfPreview previewUrl={previewUrl} />
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10 w-full">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white p-3.5 rounded-xl shadow-sm border border-blue-100 hidden sm:block">
                                        <File className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-1 max-w-[200px] sm:max-w-[320px]" title={selectedFile?.name || recoveredFileName || "Uploaded Document"}>
                                            {selectedFile?.name || recoveredFileName || "Uploaded Document"}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-medium text-blue-600 bg-blue-100/50 px-2 py-0.5 rounded-md">
                                                PDF Document
                                            </span>
                                            {selectedFile && (
                                                <span className="text-xs text-gray-500">
                                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-4 sm:mt-0 self-end sm:self-auto">
                                    {previewUrl && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                window.open(previewUrl, "_blank");
                                            }}
                                            className="h-9 px-4 bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 font-medium z-20 shadow-sm"
                                        >
                                            View Full PDF
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={clearSelection}
                                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full h-9 w-9 shrink-0 z-20"
                                        title="Remove document"
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notarial Document Details Form */}
                    <div className="mt-8 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-2 border-b pb-2 border-gray-200/60">
                            <h3 className="text-lg font-semibold text-gray-800">Notarial Document Details</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="documentName" className="text-sm font-medium text-gray-700">Document Title</Label>
                                <Input
                                    id="documentName"
                                    list="documentTitles"
                                    placeholder="e.g. Deed of Absolute Sale"
                                    value={documentName}
                                    onChange={(e) => setDocumentName(e.target.value)}
                                    className="bg-gray-50/50 focus:bg-white shadow-sm"
                                />
                                <datalist id="documentTitles">
                                    <option value="Deed of Absolute Sale" />
                                    <option value="Deed of Donation" />
                                    <option value="Extrajudicial Settlement" />
                                    <option value="Deed of Partition" />
                                    <option value="Waiver of Rights" />
                                    <option value="Affidavit of Adjudication" />
                                    <option value="Final Certificate of Sale" />
                                </datalist>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="documentType" className="text-sm font-medium text-gray-700">Document Type</Label>
                                <Select value={documentType} onValueChange={setDocumentType}>
                                    <SelectTrigger id="documentType" className="bg-gray-50/50 focus:bg-white shadow-sm w-full">
                                        <SelectValue placeholder="Select Document Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Notarial">Notarial Document</SelectItem>
                                        <SelectItem value="Court">Court Document</SelectItem>
                                        <SelectItem value="Embassy">Embassy Document</SelectItem>
                                        <SelectItem value="Other">Other Document</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {documentType === "Court" ? (
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="caseNo" className="text-sm font-medium text-gray-700">Case No.</Label>
                                    <Input
                                        id="caseNo"
                                        placeholder="e.g. 12345-67"
                                        value={caseNo}
                                        onChange={(e) => setCaseNo(e.target.value)}
                                        className="bg-gray-50/50 focus:bg-white shadow-sm"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2 md:col-span-2">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="docNo" className="text-sm font-medium text-gray-700">Doc No.</Label>
                                            <Input
                                                id="docNo"
                                                placeholder="e.g. 123"
                                                value={docNo}
                                                onChange={(e) => setDocNo(e.target.value)}
                                                className="bg-gray-50/50 focus:bg-white shadow-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="pageNo" className="text-sm font-medium text-gray-700">Page No.</Label>
                                            <Input
                                                id="pageNo"
                                                placeholder="e.g. 45"
                                                value={pageNo}
                                                onChange={(e) => setPageNo(e.target.value)}
                                                className="bg-gray-50/50 focus:bg-white shadow-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bookNo" className="text-sm font-medium text-gray-700">Book No.</Label>
                                            <Input
                                                id="bookNo"
                                                placeholder="e.g. 12"
                                                value={bookNo}
                                                onChange={(e) => setBookNo(e.target.value)}
                                                className="bg-gray-50/50 focus:bg-white shadow-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="notarialDate" className="text-sm font-medium text-gray-700">
                                    {documentType === "Court" ? "Date of Registration of Document" : "Notarial Date"}
                                </Label>
                                <Input
                                    id="notarialDate"
                                    type="date"
                                    value={notarialDate}
                                    onChange={(e) => setNotarialDate(e.target.value)}
                                    className="bg-gray-50/50 focus:bg-white shadow-sm text-gray-700"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="notarizedBy" className="text-sm font-medium text-gray-700">Notarized By (Notary Public)</Label>
                                <Input
                                    id="notarizedBy"
                                    placeholder="e.g. Atty. Juan Dela Cruz"
                                    value={notarizedBy}
                                    onChange={(e) => setNotarizedBy(e.target.value)}
                                    className="bg-gray-50/50 focus:bg-white shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="px-6 py-5 border-t bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-gray-500 font-medium">
                        Step 1 of 4 • Document Upload
                    </p>
                    <Button
                        size="lg"
                        onClick={handleNext}
                        disabled={!isFormValid || isSubmitting}
                        className="w-full sm:w-auto font-semibold shadow-sm transition-all"
                    >
                        {isSubmitting ? "Uploading..." : "Next Step"}
                        {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
