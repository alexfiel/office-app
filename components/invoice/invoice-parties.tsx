import React from "react";

interface PartiesSectionProps {
    invoice: any;
}

export function PartiesSection({ invoice }: PartiesSectionProps) {
    // Handles both frontend state (parties.newOwner) and database (transferee)
    const transferee = invoice?.transferee || invoice?.parties?.newOwner || "N/A";
    const transferor = invoice?.transferor || invoice?.parties?.prevOwner || "N/A";

    return (
        <div className="grid grid-cols-2 gap-2 mb-3">
            {/* Transferee / Buyer */}
            <div className="p-5 bg-slate-50 rounded-xl pb-1 border border-slate-150">
                <h6 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Transferee / Buyer
                </h6>
                <p className="text-md font-bold text-slate-900">
                    {transferee}
                </p>
            </div>

            {/* Transferor / Seller */}
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-150">
                <h6 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Transferor / Seller
                </h6>
                <p className="text-md font-bold text-slate-900">
                    {transferor}
                </p>
            </div>
        </div>
    );
}