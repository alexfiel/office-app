"use client";

import { Document, Page, pdfjs } from "react-pdf";

// Ensure this matches your installed version of pdfjs-dist
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfPreviewProps {
    previewUrl: string;
}

export default function PdfPreview({ previewUrl }: PdfPreviewProps) {
    return (
        <Document
            file={previewUrl}
            onLoadError={(err) => console.error("PDF Load Error:", err)}
        >
            <Page pageNumber={1} width={120} renderTextLayer={false} renderAnnotationLayer={false} />
        </Document>
    );
}
