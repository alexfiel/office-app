import React from "react";

interface DetailsBlockProps {
    invoice: any;
    formatCurrency: (val: number) => string;
}

export function DetailsBlock({ invoice, formatCurrency }: DetailsBlockProps) {
    const doc = invoice.documentInfo || {};
    const trans = invoice.transactionInfo || {};

    return (
        <div className="w-1/2 space-y-8">
            {/* DOCUMENT DETAILS SECTION */}

            <div className="border-y border-slate-100 py-2 my-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] tracking-tight">
                    {/* Document Type - Boldest part to anchor the line */}
                    <span className="font-black text-slate-900 uppercase bg-slate-100 px-2 py-0.5 rounded">
                        {doc.type || "N/A"}
                    </span>

                    {/* Notary Notation Group */}
                    <div className="flex items-center gap-1.5 text-slate-600">
                        <span className="font-bold text-slate-400 uppercase">Ref:</span>
                        <span className="font-semibold text-slate-900">
                            Doc {doc.docNo || "N/A"} • Page {doc.pageNo || "N/A"} • Book {doc.bookNo || "N/A"}
                        </span>
                    </div>

                    <span className="text-slate-300">|</span>

                    {/* Notary Name */}
                    <div className="flex items-center gap-1.5 text-slate-600">
                        <span className="font-bold text-slate-400 uppercase">Notary:</span>
                        <span className="font-semibold text-slate-900 uppercase">
                            {doc.notarizedBy || "N/A"}
                        </span>
                    </div>

                    <span className="text-slate-300">|</span>

                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-slate-600">
                        <span className="font-bold text-slate-400 uppercase">Date:</span>
                        <span className="font-semibold text-slate-900">
                            {doc.notarizedDate || doc.date || "N/A"}
                        </span>
                    </div>

                    {doc.document_url && (
                        <>
                            <span className="text-slate-300 print:hidden">|</span>
                            <div className="flex items-center gap-1.5 print:hidden">
                                <a
                                    href={doc.document_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-bold text-blue-600 hover:underline uppercase"
                                >
                                    📄 VIEW PDF
                                </a>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <hr className="border-slate-200" />

            {/* TRANSACTION DETAILS SECTION */}
            <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-5 border-l-4 border-slate-300 pl-3">
                    TRANSACTION DETAILS
                </h3>
                <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-3">
                        <span className="text-slate-500 font-bold uppercase text-[10px]">TRANSACTION:</span>
                        <span className="col-span-2 font-semibold text-slate-900">{trans.type || "N/A"}</span>
                    </div>
                    <div className="grid grid-cols-3">
                        <span className="text-slate-500 font-bold uppercase text-[10px]">CONSIDERATION:</span>
                        <span className="col-span-2 font-semibold text-slate-900">{formatCurrency(trans.consideration)}</span>
                    </div>
                    <div className="grid grid-cols-3">
                        <span className="text-slate-500 font-bold uppercase text-[10px]">DAYS ELAPSED:</span>
                        <span className="col-span-2 font-semibold text-slate-900">{trans.dayselapsed} DAYS</span>
                    </div>
                    <div className="grid grid-cols-3">
                        <span className="text-slate-500 font-bold uppercase text-[10px]">VALID UNTIL:</span>
                        <span className="col-span-2 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded inline-block w-fit border border-amber-100">
                            {trans.validityDate}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}