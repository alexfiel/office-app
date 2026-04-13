import React from "react";

interface ChainTransfer {
    deceasedOwner: string;
    heirs: string;
    share: number;
    shareString?: string; // e.g., "1/2"
    taxBase: number;
    basicTax: number;
    tdNo?: string;
}

interface ChainOfTransfersProps {
    invoice: {
        ejsChain?: ChainTransfer[];
    };
    formatCurrency: (val: number) => string;
}

export function ChainOfTransfers({ invoice, formatCurrency }: ChainOfTransfersProps) {
    if (!invoice.ejsChain || invoice.ejsChain.length === 0) return null;

    return (
        <div className="mb-8 break-inside-avoid">
            <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                    Chain of Sequential Settlements
                </h3>
                <div className="h-[1px] flex-1 bg-slate-200"></div>
            </div>

            <div className="space-y-3">
                {invoice.ejsChain.map((t: ChainTransfer, i: number) => (
                    <div
                        key={i}
                        className="p-4 border border-slate-300 rounded-lg bg-white relative overflow-hidden shadow-sm print:shadow-none"
                    >
                        {/* Step Indicator Line */}
                        <div className="absolute top-0 left-0 w-1.5 bg-slate-800 h-full"></div>

                        <div className="flex justify-between items-start mb-3">
                            <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-tighter">
                                SETTLEMENT STEP {i + 1}
                                <span className="ml-2 px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-mono">
                                    {t.tdNo || "PROPERTY SETTLEMENT"}
                                </span>
                            </h4>
                            <div className="text-[10px] font-bold text-slate-500 uppercase">
                                Share: <span className="text-blue-700">{t.shareString || `${(t.share * 100)}%`}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 text-sm">
                            <div className="space-y-1">
                                <p className="text-slate-500 font-bold uppercase text-[9px] flex items-center gap-1">
                                    <span className="w-1 h-1 bg-red-500 rounded-full"></span> DECEASED OWNER:
                                </p>
                                <p className="font-bold text-slate-900 uppercase leading-tight">
                                    {t.deceasedOwner}
                                </p>
                            </div>
                            <div className="space-y-1 border-l pl-6 border-slate-100">
                                <p className="text-slate-500 font-bold uppercase text-[9px] flex items-center gap-1">
                                    <span className="w-1 h-1 bg-green-500 rounded-full"></span> HEIRS / BENEFICIARIES:
                                </p>
                                <p className="font-semibold text-slate-900 uppercase leading-tight">
                                    {t.heirs}
                                </p>
                            </div>
                        </div>

                        {/* Financial calculation for this specific hop */}
                        <div className="mt-4 pt-3 border-t border-dashed border-slate-200 flex justify-between items-end">
                            <div className="text-[9px] text-slate-500 italic">
                                Computation: $$Market Value \times Share \times 0.75\%$$
                            </div>
                            <div className="text-right space-y-0.5">
                                <p className="text-[10px] text-slate-600">
                                    Tax Base for this Step: <span className="font-mono">{formatCurrency(t.taxBase)}</span>
                                </p>
                                <p className="font-black text-slate-900 text-xs">
                                    Basic Tax Due: {formatCurrency(t.basicTax)}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Total Summary for the Chain */}
            <div className="mt-4 p-3 bg-slate-900 rounded-lg text-white flex justify-between items-center">
                <span className="text-[10px] font-bold tracking-widest uppercase">Total Basic Tax for All Steps:</span>
                <span className="text-sm font-black font-mono">
                    {formatCurrency(invoice.ejsChain.reduce((sum, t) => sum + t.basicTax, 0))}
                </span>
            </div>
        </div>
    );
}