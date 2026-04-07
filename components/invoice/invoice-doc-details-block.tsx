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
            <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-5 border-l-4 border-slate-300 pl-3">
                    DOCUMENT DETAILS
                </h3>
                <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-3">
                        <span className="text-slate-500 font-bold uppercase text-[10px]">DOCUMENT TYPE:</span>
                        <span className="col-span-2 font-semibold text-slate-900">{doc.type || "N/A"}</span>
                    </div>
                    <div className="grid grid-cols-3">
                        <span className="text-slate-500 font-bold uppercase text-[10px]">DOC NO:</span>
                        <span className="col-span-2 font-semibold text-slate-900">{doc.docNo || "N/A"}</span>
                    </div>
                    <div className="grid grid-cols-3">
                        <span className="text-slate-500 font-bold uppercase text-[10px]">PAGE NO:</span>
                        <span className="col-span-2 font-semibold text-slate-900">{doc.pageNo || "N/A"}</span>
                    </div>
                    <div className="grid grid-cols-3">
                        <span className="text-slate-500 font-bold uppercase text-[10px]">BOOK NO:</span>
                        <span className="col-span-2 font-semibold text-slate-900">{doc.bookNo || "N/A"}</span>
                    </div>
                    <div className="grid grid-cols-3">
                        <span className="text-slate-500 font-bold uppercase text-[10px]">NOTARY PUBLIC:</span>
                        <span className="col-span-2 font-semibold text-slate-900">{doc.notarizedBy || "N/A"}</span>
                    </div>
                    <div className="grid grid-cols-3">
                        <span className="text-slate-500 font-bold uppercase text-[10px]">NOTARIZED DATE:</span>
                        <span className="col-span-2 font-semibold text-slate-900">{doc.notarizedDate || doc.date || "N/A"}</span>
                    </div>
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