export default function ChainTransfers({ chain }: any) {

    if (!chain || chain.length === 0) return null;

    return (
        <div className="space-y-4">

            {chain.map((transfer: any, index: number) => (

                <div key={index} className="border p-4 rounded-lg">

                    <h4 className="font-bold mb-2">
                        Transfer {index + 1}
                    </h4>

                    <div className="flex justify-between text-sm">
                        <span>{transfer.transferor}</span>
                        <span>→</span>
                        <span>{transfer.transferee}</span>
                    </div>

                    <div className="flex justify-between text-sm mt-2">
                        <span>Tax Base</span>
                        <span>
                            ₱ {Number(transfer.taxBase).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    <div className="flex justify-between font-bold text-sm">
                        <span>Total Tax Due</span>
                        <span>
                            ₱ {Number(transfer.totalAmountDue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                </div>

            ))}

        </div>
    );
}