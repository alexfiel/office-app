// ✅ CORRECT: Added 'return'
export function PropertyTable({ properties, totalMarketValue }: { properties: any[], totalMarketValue: number }) {
    const formatCurrency = (val: number) =>
        `₱ ${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return ( // <--- YOU NEED THIS LINE
        <div className="mb-10">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">
                Properties Involved
            </h3>
            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-slate-100 border-b border-slate-200">
                        <tr>
                            <th className="px-5 py-4 text-left font-bold text-slate-600 uppercase tracking-wider text-xs">Tax Declaration No.</th>
                            <th className="px-5 py-4 text-left font-bold text-slate-600 uppercase tracking-wider text-xs">Lot Number</th>
                            <th className="px-5 py-4 text-left font-bold text-slate-600 uppercase tracking-wider text-xs">Area(sqm)</th>
                            <th className="px-5 py-4 text-right font-bold text-slate-600 uppercase tracking-wider text-xs">Market Value / SP</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {properties?.map((p, i) => (
                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                <td className="px-5 py-3 text-slate-800 font-medium">{p.taxdecnumber}</td>
                                <td className="px-5 py-3 text-slate-800">{p.lotNumber}</td>
                                <td className="px-5 py-3 text-slate-800">{p.area}</td>
                                <td className="px-5 py-3 text-right font-semibold text-slate-900">
                                    {formatCurrency(p.marketValue)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-800 text-white">
                        <tr>
                            <td colSpan={3} className="px-5 py-4 text-right font-bold tracking-wide uppercase text-xs">Total Market Value / SP:</td>
                            <td className="px-5 py-4 text-right font-bold text-base">
                                {formatCurrency(totalMarketValue)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    ); // <--- ENSURE PARENTHESIS IS CLOSED
}