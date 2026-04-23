interface ReportDetailsProps {
    routeName: string;
    data: any[];
    totalPax: number;
    totalAmount: number;
}

export function ReportDetails({ routeName, data, totalPax, totalAmount }: ReportDetailsProps) {
    const arTotals: Record<string, { total: number, count: number }> = {};
    data.forEach(item => {
        const k = item.arnumber ? item.arnumber : `no-ar-${item.id}`;
        if (!arTotals[k]) {
            arTotals[k] = { total: 0, count: 0 };
        }
        arTotals[k].total += item.amount;
        arTotals[k].count += 1;
    });

    const seenArs = new Set<string>();

    return (
        <div className="mb-8">
            <div className="mb-4 flex justify-between text-sm italic">
                <p>Route: <span className="font-bold not-italic underline">{routeName || "All Routes"}</span></p>
                <p>Date Printed: {new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>

            <table className="w-full border-collapse border border-black text-xs">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-black p-2 text-center uppercase tracking-tighter">AR Number</th>
                        <th className="border border-black p-2 text-center uppercase tracking-tighter">Paid Date</th>
                        <th className="border border-black p-2 text-center uppercase tracking-tighter">Operation Date</th>
                        <th className="border border-black p-2 text-left uppercase tracking-tighter">Driver Name</th>
                        <th className="border border-black p-2 text-center uppercase tracking-tighter">Plate Number</th>
                        <th className="border border-black p-2 text-center uppercase tracking-tighter">Pax</th>
                        <th className="border border-black p-2 text-right uppercase tracking-tighter">Fare</th>
                        <th className="border border-black p-2 text-right uppercase tracking-tighter">Amount</th>
                        <th className="border border-black p-2 text-right uppercase tracking-tighter">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={9} className="border border-black p-8 text-center text-gray-400 italic">
                                No records found for the selected period.
                            </td>
                        </tr>
                    ) : (
                        data.map((item, idx) => {
                            const k = item.arnumber ? item.arnumber : `no-ar-${item.id}`;
                            let isFirstAr = false;
                            if (!seenArs.has(k)) {
                                seenArs.add(k);
                                isFirstAr = true;
                            }

                            return (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="border border-black p-2 text-center font-mono">
                                        {item.arnumber || "-"}
                                    </td>
                                    <td className="border border-black p-2 text-center">
                                        {item.paymentDate ? new Date(item.paymentDate).toLocaleDateString() : "-"}
                                    </td>
                                    <td className="border border-black p-2 text-center">
                                        {new Date(item.departureDate).toLocaleDateString()}
                                    </td>
                                    <td className="border border-black p-2 font-medium">{item.driverName}</td>
                                    <td className="border border-black p-2 text-center font-mono">{item.vehiclePlateNumber}</td>
                                    <td className="border border-black p-2 text-center">{item.numberofPax}</td>
                                    <td className="border border-black p-2 text-right">₱{item.fare.toFixed(2)}</td>
                                    <td className="border border-black p-2 text-right">
                                        ₱{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    {isFirstAr && (
                                        <td 
                                            rowSpan={arTotals[k].count} 
                                            className="border border-black p-2 text-right font-bold align-middle bg-white"
                                        >
                                            ₱{arTotals[k].total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                    )}
                                </tr>
                            );
                        })
                    )}
                </tbody>
                <tfoot>
                    <tr className="bg-slate-50 font-black text-sm">
                        <td colSpan={5} className="border border-black p-3 text-right uppercase">Overall Total:</td>
                        <td className="border border-black p-3 text-center">{totalPax.toLocaleString()}</td>
                        <td colSpan={2} className="border border-black p-3 bg-gray-50"></td>
                        <td className="border border-black p-3 text-right text-red-700">
                            ₱{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    )
}