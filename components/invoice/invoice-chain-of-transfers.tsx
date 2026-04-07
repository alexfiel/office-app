import React from "react";

interface ChainTransfer {
    title: string;
    type: string;
    transferee: string;
    transferor: string;
    taxBase: number;
    totalAmountDue: number;
    areaAdjudicated?: string;
    newLotNumber?: string;
}

interface ChainOfTransfersProps {
    invoice: any;
    formatCurrency: (val: number) => string;
}

export function ChainOfTransfers({ invoice, formatCurrency }: ChainOfTransfersProps) {
    if (!invoice.ejsChain || invoice.ejsChain.length === 0) return null;

    return (
        <div className="mb-10">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">
                CHAIN OF TRANSFERS
            </h3>
            <div className="space-y-4">

                {/* FIRST TRANSFER (BASE EJS) */}
                <div className="p-5 border-2 border-slate-200 rounded-xl bg-slate-50 relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 left-0 w-1 bg-slate-400 h-full"></div>
                    <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-2">
                        FIRST TRANSFER (EJS)
                    </h4>
                    <div className="grid grid-cols-2 text-sm">
                        <div>
                            <p className="text-slate-500 font-medium uppercase text-[10px]">TRANSFEREE:</p>
                            <p className="font-semibold text-slate-900">{invoice.transferee}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 font-medium uppercase text-[10px]">TRANSFEROR:</p>
                            <p className="font-semibold text-slate-900">{invoice.transferor}</p>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 text-sm">
                        <p className="font-medium text-slate-600 uppercase text-[10px]">
                            TAX BASE: <span className="text-slate-900">{formatCurrency(invoice.computation.taxBase)}</span>
                        </p>
                        <p className="font-bold text-slate-900 uppercase text-[10px] text-right">
                            TAX DUE: {formatCurrency(invoice.computation.totalAmountDue)}
                        </p>
                    </div>
                </div>

                {/* SUBSEQUENT TRANSFERS */}
                {invoice.ejsChain.map((t: ChainTransfer, i: number) => (
                    <div key={i} className="p-5 border-2 border-slate-200 rounded-xl bg-white relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 left-0 w-1 bg-blue-400 h-full"></div>
                        <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-2">
                            {t.title} ({t.type})
                        </h4>
                        <div className="grid grid-cols-2 text-sm">
                            <div>
                                <p className="text-slate-500 font-medium uppercase text-[10px]">TRANSFEREE:</p>
                                <p className="font-semibold text-slate-900">{t.transferee}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 font-medium uppercase text-[10px]">TRANSFEROR:</p>
                                <p className="font-semibold text-slate-900">{t.transferor}</p>
                            </div>
                        </div>

                        {/* ADJUDICATION SPECIFIC FIELDS */}
                        {t.type === "ADJUDICATION" && (
                            <div className="mt-3 grid grid-cols-2 text-xs bg-slate-50 p-2 rounded border border-slate-100">
                                <p className="text-slate-600">AREA ADJUDICATED: <span className="font-bold">{t.areaAdjudicated} SQ.M.</span></p>
                                <p className="text-slate-600">NEW LOT NO: <span className="font-bold">{t.newLotNumber}</span></p>
                            </div>
                        )}

                        <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 text-sm">
                            <p className="font-medium text-slate-600 uppercase text-[10px]">
                                TAX BASE: <span className="text-slate-900">{formatCurrency(t.taxBase)}</span>
                            </p>
                            <p className="font-bold text-slate-900 uppercase text-[10px] text-right">
                                TOTAL TAX DUE: {formatCurrency(t.totalAmountDue)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}