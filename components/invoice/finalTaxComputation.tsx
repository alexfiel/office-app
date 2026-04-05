export default function FinalTaxComputation({
    invoice,
    isEJS,
    ejsTotals
}: any) {
    return (
        <div className="space-y-4 text-sm">
            <div className="flex justify-between">
                <span>Total Market Value</span>
                <span>
                    ₱ {Number(invoice.totalmarketvalue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
            </div>

            {isEJS ? (
                <>
                    <div className="flex justify-between font-bold">
                        <span>Total Tax Due</span>
                        <span>
                            ₱ {Number(ejsTotals.totalTaxDue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>

                    {invoice.transactionInfo.dayselapsed > 60 && (
                        <>
                            <div className="flex justify-between text-red-700">
                                <span>Total Surcharge</span>
                                <span>
                                    ₱ {Number(invoice.transactionInfo.surcharge).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between text-red-700">
                                <span>Total Interest</span>
                                <span>
                                    ₱ {Number(invoice.transactionInfo.interest).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </>
                    )}
                </>
            ) : (
                <>
                    {invoice.transactionInfo.type === "Deed of Sale" && (
                        <div className="flex justify-between">
                            <span>Consideration</span>
                            <span>
                                ₱ {Number(invoice.transactionInfo.consideration).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span>Tax Base</span>
                        <span>
                            ₱ {Number(invoice.computation.taxBase).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tax Rate</span>
                        <span>
                            {invoice.computation.taxRate}%
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tax Due</span>
                        <span>
                            ₱ {Number(invoice.computation.taxDue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                </>
            )}
        </div>
    )
}