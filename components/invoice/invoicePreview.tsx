import ChainTransfers from "./ChainTransfers";
import FinalTaxComputation from "./finalTaxComputation";
import { calculateEJSTotals, computeGrandTotal } from "../utils/invoiceCaculations";

export default function InvoicePreview({ invoice }: any) {

    const isEJS = invoice.transactionInfo?.type === "EJS";

    const ejsTotals = calculateEJSTotals(invoice.ejsChain || []);

    const grandTotal = computeGrandTotal(invoice, isEJS, ejsTotals);

    return (
        <div className="space-y-8">

            {/* Chain of Transfers */}

            {isEJS && (
                <ChainTransfers chain={invoice.ejsChain} />
            )}

            {/* Final Tax Computation */}

            <FinalTaxComputation
                invoice={invoice}
                isEJS={isEJS}
                ejsTotals={ejsTotals}
            />

            {/* Grand Total */}

            <div className="flex justify-between text-xl font-bold border-t pt-4">

                <span>Grand Total</span>

                <span>
                    ₱ {Number(grandTotal).toLocaleString(undefined, {
                        minimumFractionDigits: 2
                    })}
                </span>

            </div>

        </div>
    );
}