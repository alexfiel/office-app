import React from "react";

interface TaxBreakdownProps {
    invoice: any;
    isEJS: boolean;
    ejsTotals: any;
}

export function TaxBreakdown({ invoice, isEJS, ejsTotals }: TaxBreakdownProps) {
    const formatCurrency = (val: number) =>
        `₱ ${Number(val || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    const renderPenaltySection = (surcharge: number, interest: number) => (
        <div className="pt-3 pb-2">
            <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-700 uppercase tracking-widest border border-red-200">
                    LATE PENALTY APPLIED
                </span>
            </div>
            <div className="space-y-2 pl-4 border-l-4 border-red-300 bg-red-50/50 py-1 rounded-r-lg">
                <div className="flex justify-between text-red-800 pr-3">
                    <span className="font-medium">SURCHARGE (25%):</span>
                    <span className="font-bold">{formatCurrency(surcharge)}</span>
                </div>
                <div className="flex justify-between text-red-800 pr-3">
                    <span className="font-medium">INTEREST (2% / MO):</span>
                    <span className="font-bold">{formatCurrency(interest)}</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-1/2 p-7 rounded-2xl border-2 border-slate-200 bg-slate-50/80 flex flex-col justify-center shadow-inner relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 bg-gray-600 h-full"></div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 border-b-2 border-slate-200 pb-3">
                FINAL TAX COMPUTATION
            </h3>

            <div className="space-y-4 text-sm z-10 relative">
                {/* TOTAL MARKET VALUE */}
                <div className="flex justify-between items-center px-1">
                    <span className="text-slate-500 font-medium text-xs">Total Market Value:</span>
                    <span className="font-semibold text-slate-800">
                        {formatCurrency(invoice.totalMarketValue)}
                    </span>
                </div>
                {/* CONSIDERATION - NOW SHOWN DIRECTLY BELOW MARKET VALUE */}
                {!isEJS && (
                    <div className="flex justify-between items-center px-1">
                        <span className="text-slate-500 font-medium text-xs">Consideration Amount:</span>
                        <span className="font-semibold text-slate-800">
                            {formatCurrency(invoice.transactionInfo?.consideration)}
                        </span>
                    </div>
                )}
                <div className="my-2 border-t border-dashed border-slate-300"></div>

                {isEJS ? (
                    /* EJS COMPUTATION VIEW */
                    <>
                        <div className="flex justify-between items-center pt-4 border-t-2 border-slate-200 border-dashed px-1">
                            <span className="font-bold text-slate-700 uppercase text-xs">TOTAL TAX DUE:</span>
                            <span className="font-bold text-slate-900">
                                {formatCurrency(ejsTotals?.taxDue)}
                            </span>
                        </div>
                        {invoice.transactionInfo.dayselapsed > 60 &&
                            renderPenaltySection(ejsTotals?.surcharge, ejsTotals?.interest)}
                    </>
                ) : (
                    /* STANDARD COMPUTATION VIEW */
                    <>
                        {invoice.transactionInfo.type === "DEED OF SALE" && (
                            <div className="flex justify-between items-center px-1">
                                <span className="text-slate-600 font-medium uppercase text-xs">CONSIDERATION:</span>
                                <span className="font-semibold text-slate-800">
                                    {formatCurrency(invoice.transactionInfo.consideration)}
                                </span>
                            </div>
                        )}

                        <div className="flex justify-between items-center bg-white p-3 rounded-xl border-2 border-slate-100 shadow-sm">
                            <span className="font-black text-slate-800 uppercase tracking-wider text-xs">TAX BASE:</span>
                            <span className="font-bold text-slate-900 text-base">
                                {formatCurrency(invoice.computation.taxBase)}
                            </span>
                        </div>

                        <div className="flex justify-between items-center px-1">
                            <span className="text-slate-600 font-medium uppercase text-xs">TAX RATE:</span>
                            <span className="font-bold text-slate-800 bg-slate-200 px-2 py-0.5 rounded">
                                {invoice.computation.taxRate}%
                            </span>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t-2 border-slate-200 border-dashed px-1">
                            <span className="font-bold text-slate-700 uppercase text-xs">BASIC TAX DUE:</span>
                            <span className="font-bold text-slate-900">
                                {formatCurrency(invoice.computation.basicTaxDue)}
                            </span>
                        </div>

                        {invoice.transactionInfo.dayselapsed > 60 &&
                            renderPenaltySection(
                                invoice.computation.surcharge,
                                invoice.computation.interest
                            )}
                    </>
                )}
            </div>

            {/* GRAND TOTAL FOOTER */}
            <div className="mt-6 pt-5 border-t-2 border-slate-800 z-10 relative">
                <div className="flex justify-between items-center">
                    <span className="text-base font-black text-slate-900 uppercase tracking-widest">
                        GRAND TOTAL DUE
                    </span>
                    <span className="text-2xl font-black text-black-600 drop-shadow-sm">
                        {formatCurrency(
                            isEJS ? ejsTotals?.total : invoice.computation.totalAmountDue
                        )}
                    </span>
                </div>
            </div>
        </div>
    );
}