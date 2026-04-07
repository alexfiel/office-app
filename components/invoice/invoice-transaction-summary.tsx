import QRCode from "react-qr-code";

export function TransactionSummary({ invoice }: { invoice: any }) {
    // 1. ADD THIS GUARD CLAUSE
    if (!invoice) {
        return <div className="p-4 text-slate-400">Loading transaction data...</div>;
    }

    return (
        <div className="flex justify-between items-start mb-10">


            <div className="bg-white p-4 flex flex-col items-center border-2 border-slate-100 rounded-xl shadow-sm">

                {/* 1. CENTERED QR CODE */}
                <div className="mb-4">
                    <QRCode className="w-24 h-24" value={invoice?.qrValue || "No Data"} />
                </div>

                {/* 2. DATA FIELDS (Left-aligned text within the centered container) */}
                <div className="space-y-1 w-full border-t pt-4">
                    {["Computation Date", "Validity Date", "Transaction ID"].map((label) => {
                        let key = label.charAt(0).toLowerCase() + label.slice(1).replace(/\s+/g, "");
                        if (key === "transactionID") key = "transactionId";

                        return (
                            <div key={key} className="flex justify-between items-center gap-4">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                    {label}:
                                </span>
                                <span className="text-[10px] text-slate-800 font-bold whitespace-nowrap">
                                    {invoice[key] || "N/A"}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}