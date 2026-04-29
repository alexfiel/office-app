interface ReportSettlementDetailsProps {
    settlement: any;
}

export function ReportSettlementDetails({ settlement }: ReportSettlementDetailsProps) {
    if (!settlement) return null;

    const totalAmount = settlement.details?.reduce((sum: number, d: any) => sum + (d.amount || 0), 0) || settlement.amount;

    return (
        <div className="mb-8">
            <div className="mb-4 flex justify-between text-sm italic">
                <p>Settlement No: <span className="font-bold not-italic underline font-mono">{settlement.arNumber}</span></p>
                <p>Payment Date: <span className="font-bold not-italic">{new Date(settlement.datePaid).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</span></p>
            </div>
            
            <table className="w-full border-collapse border border-black text-xs">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-black p-2 text-center uppercase tracking-tighter w-12">#</th>
                        <th className="border border-black p-2 text-center uppercase tracking-tighter">AR Number</th>
                        <th className="border border-black p-2 text-left uppercase tracking-tighter">Vendor Name</th>
                        <th className="border border-black p-2 text-left uppercase tracking-tighter">Market Name</th>
                        <th className="border border-black p-2 text-center uppercase tracking-tighter">Stall Number</th>
                        <th className="border border-black p-2 text-right uppercase tracking-tighter">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {settlement.details?.map((d: any, idx: number) => (
                        <tr key={d.id} className="hover:bg-gray-50">
                            <td className="border border-black p-2 text-center font-mono">{idx + 1}</td>
                            <td className="border border-black p-2 text-center font-mono">{d.arNumber || "-"}</td>
                            <td className="border border-black p-2 font-medium">{d.vendorName || "-"}</td>
                            <td className="border border-black p-2">{d.market || "-"}</td>
                            <td className="border border-black p-2 text-center uppercase">{d.stallNo || "-"}</td>
                            <td className="border border-black p-2 text-right">₱{(d.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                    ))}
                    {(!settlement.details || settlement.details.length === 0) && (
                        <tr>
                            <td colSpan={6} className="border border-black p-8 text-center text-gray-400 italic">
                                No specific vendor details available for this settlement.
                            </td>
                        </tr>
                    )}
                </tbody>
                <tfoot>
                    <tr className="bg-slate-50 font-black text-sm">
                        <td colSpan={5} className="border border-black p-3 text-right uppercase">Overall Total:</td>
                        <td className="border border-black p-3 text-right text-red-700">
                            ₱{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}