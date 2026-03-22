"use client";

import { useRef, useState, useTransition } from "react";
import { uploadFile } from "@/lib/upload/upload-action";
import { Document, Page, pdfjs } from "react-pdf";

// Ensure this matches your installed version of pdfjs-dist
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface UploadFormProps {
    onUploadSuccess: (url: string) => void;
}

export default function UploadForm({ onUploadSuccess }: UploadFormProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === "application/pdf") {
            setUploadSuccess(false);
            // Clean up old memory-stored URLs
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    // Modified to be a standard function called by the form action
    async function clientAction(formData: FormData) {
        startTransition(async () => {
            try {
                const result = await uploadFile(formData);

                // Debug: See what the server is actually sending back
                console.log("Upload Result:", result);

                if (result?.url) {
                    setUploadSuccess(true);
                    onUploadSuccess(result.url);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                } else {
                    // If result.url is missing, this is why you get the error
                    console.error("Server Action returned success but no URL found.");
                }
            } catch (error) {
                console.error("Upload failed:", error);
            }
        });
    }

    return (
        <div className="flex flex-col gap-6 max-w-md border p-4 rounded-lg bg-gray-50/50">
            {/* Use the clientAction function here */}
            <form action={clientAction} className="flex flex-col gap-4">
                <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-gray-700">Notarial Document PDF</span>
                    <input
                        type="file"
                        name="file" // Ensure your server action looks for 'file'
                        accept=".pdf"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        required
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                </label>
                <button
                    type="submit"
                    disabled={isPending}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
                >
                    {isPending ? "Uploading to Cloud..." : "Upload & Attach PDF"}
                </button>
            </form>

            {previewUrl && (
                <div className="relative group mt-2 flex flex-col items-center">
                    <p className="text-xs font-medium text-gray-600 mb-2">
                        {uploadSuccess ? "✅ Attached to Transaction" : "File Preview:"}
                    </p>

                    <div className="relative border rounded shadow-sm overflow-hidden w-[120px]">
                        {/* error handling for pdf loading */}
                        <Document
                            file={previewUrl}
                            onLoadError={(err) => console.error("PDF Load Error:", err)}
                        >
                            <Page pageNumber={1} width={120} renderTextLayer={false} renderAnnotationLayer={false} />
                        </Document>
                        <a
                            href={previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                            <span className="text-white text-[10px] bg-black/60 px-2 py-1 rounded">View Full</span>
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}