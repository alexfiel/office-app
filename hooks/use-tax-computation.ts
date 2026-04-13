import { useMemo, useState } from "react";
import { calculateTaxPenalties } from "@/lib/tax-utils";



export function useTaxComputation({ notarialDate, transactionType, totalMarketValue, consideration }: any) {
    return useMemo(() => {
        const mv = Number(totalMarketValue) || 0;
        const con = Number(consideration) || 0;
        const isSale = ["DEED OF SALE", "CERTIFICATE OF SALE"].includes(transactionType.toUpperCase());

        const taxBase = isSale ? Math.max(mv, con) : mv;
        const basicTaxDue = Math.max(taxBase * 0.0075, 500);

        // Call the shared utility
        const penalties = calculateTaxPenalties(basicTaxDue, notarialDate);

        return {
            totalMarketValue: mv,
            consideration: con,
            taxBase,
            taxRate: 0.75, // Standard rate
            basicTaxDue: basicTaxDue,
            ...penalties, // Spreads surcharge, interest, daysElapsed, etc.
        };
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

        const taxBase = numericMv * numericShare;

        // Ensure this doesn't result in NaN
        const basicTaxDue = isNaN(taxBase) ? 500 : Math.max(taxBase * 0.0075, 500);

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
        // If no one is settled yet, everything is 0
        if (ejsChain.length === 0) {
            return {
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
        const adjustedBasicTax = Math.max(totalBasicTax, 500);

        const penalties = calculateTaxPenalties(adjustedBasicTax, notarialDate);

        return {
            taxBase: adjustedBasicTax,
            basicTaxDue: adjustedBasicTax,
            ...penalties
        };
    }, [ejsChain, notarialDate]);

    return {
        ejsChain,
        setEjsChain,
        addTransfer,
        totals
    };
}