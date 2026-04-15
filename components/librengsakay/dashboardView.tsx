// components/librengsakay/dashboardView.tsx

export interface Stats {
    totalPax: number;
    totalSpent: number;
    runningBalance: number;
    budgetUtilization: number;
    initialBudget: number;
}

export default function DashboardView({ stats, recent }: { stats: Stats, recent: any[] }) {
    return (
        <div className="space-y-6">
            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white border rounded-xl shadow-sm">
                    <p className="text-sm font-medium text-muted-foreground">Passengers Served (MTD)</p>
                    <h2 className="text-3xl font-bold text-blue-600">{stats.totalPax.toLocaleString()}</h2>
                </div>

                <div className="p-6 bg-white border rounded-xl shadow-sm">
                    <p className="text-sm font-medium text-muted-foreground">Total Liquidated</p>
                    <h2 className="text-3xl font-bold text-red-600">₱{stats.totalSpent.toLocaleString()}</h2>
                </div>

                <div className="p-6 bg-white border rounded-xl shadow-sm">
                    <p className="text-sm font-medium text-muted-foreground">Running Balance</p>
                    <h2 className={`text-3xl font-bold ${stats.runningBalance < 50000 ? 'text-orange-600' : 'text-green-600'}`}>
                        ₱{stats.runningBalance.toLocaleString()}
                    </h2>
                </div>
            </div>

            {/* Budget Progress Bar */}
            <div className="bg-white p-6 rounded-xl border shadow-sm">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">Budget Utilization</span>
                    <span className="text-sm font-bold">{stats.budgetUtilization.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                        className="h-3 rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${Math.min(stats.budgetUtilization, 100)}%` }}
                    />
                </div>
            </div>

            {/* RECENT LIQUIDATIONS TABLE */}
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 uppercase text-xs tracking-wider">Recent Liquidations (Audit Log)</h3>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">LATEST 5</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white text-gray-500 uppercase text-[11px] font-bold border-b">
                            <tr>
                                <th className="px-6 py-3">AR Number</th>
                                <th className="px-6 py-3">Date Paid</th>
                                <th className="px-6 py-3">Driver</th>
                                <th className="px-6 py-3">Plate</th>
                                <th className="px-6 py-3 text-right">Amount</th>
                                <th className="px-6 py-3 text-right">Prepared By</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {recent.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-400 italic">No liquidations recorded yet.</td>
                                </tr>
                            ) : (
                                recent.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-blue-700">{item.arnumber}</td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {new Date(item.paymentDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-800">{item.driverName}</td>
                                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">{item.vehiclePlateNumber}</td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900">₱{item.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded uppercase tracking-tighter">
                                                {item.user?.name || "System"}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}