import { useMemo, useState } from "react";
import { calculateTaxPenalties } from "@/lib/tax-utils";
import { TransferTaxCalculator, TransactionType } from "@/lib/tax-calculator";

export function useTaxComputation({ notarialDate, transactionType, totalMarketValue, consideration }: any) {
    return useMemo(() => {
        return TransferTaxCalculator.computeTotal(
            transactionType as TransactionType,
            totalMarketValue,
            consideration,
            notarialDate
        );
    }, [notarialDate, transactionType, totalMarketValue, consideration]);
}

export function useEJSComputation(properties: any[], notarialDate: string) {
    const [ejsChain, setEjsChain] = useState<any[]>([]);

    const addTransfer = (deceasedName: string, heirs: string[], share: any, mv: any) => {
        // Force conversion to numbers and handle potential "1/2" strings
        const numericMv = Number(String(mv).replace(/,/g, '')) || 0;

        let numericShare = 0;
        try {
            numericShare = typeof share === 'string' ? eval(share) : Number(share);
        } catch {
            numericShare = 0;
        }

        // Use the centralized calculator logic for EJS base computation
        const taxBase = TransferTaxCalculator.computeBase(
            "DEED OF EXTRAJUDICIAL SETTLEMENT",
            numericMv,
            0,
            numericShare
        );

        const basicTaxDue = TransferTaxCalculator.computeBasicTaxDue(taxBase);

        const newTransfer = {
            deceasedOwner: deceasedName,
            heirs: heirs.join(", "),
            share: numericShare,
            taxBase,
            basicTaxDue
        };

        setEjsChain((prev) => [...prev, newTransfer]);
    };

    // 2. Compute the final totals based on the chain and the date
    const totals = useMemo(() => {
        const totalMV = properties.reduce((sum, item) => {
            const val = typeof item.marketValue === 'string' ? parseFloat(item.marketValue) : item.marketValue;
            return sum + (isNaN(val) ? 0 : val);
        }, 0);

        // If no one is settled yet, everything is 0
        if (ejsChain.length === 0) {
            return {
                totalMarketValue: totalMV,
                taxRate: 0.75,
                consideration: 0,
                taxBase: 0,
                basicTaxDue: 0,
                surcharge: 0,
                interest: 0,
                totalAmountDue: 0,
                daysElapsed: 0,
                validityDate: "N/A"
            };
        }

        const totalBasicTax = ejsChain.reduce((sum, item) => sum + (item.basicTaxDue || 0), 0);
        const adjustedBasicTax = Math.max(totalBasicTax, TransferTaxCalculator.MIN_TAX);

        const penalties = calculateTaxPenalties(adjustedBasicTax, notarialDate);

        return {
            totalMarketValue: totalMV,
            taxRate: 0.75,
            consideration: 0,
            taxBase: adjustedBasicTax,
            basicTaxDue: adjustedBasicTax,
            ...penalties
        };
    }, [ejsChain, notarialDate, properties]);

    return {
        ejsChain,
        setEjsChain,
        addTransfer,
        totals
    };
}