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

    const addTransfer = (deceasedName: string, heirs: string[], share: number, mv: number) => {
        const taxBase = mv * share;
        const basicTaxDue = Math.max(taxBase * 0.0075, 500);
        const newTransfer = {
            deceasedOwner: deceasedName,
            heirs: heirs.join(", "),
            share,
            taxBase,
            basicTaxDue
        };

        setEjsChain((prev) => [...prev, newTransfer]);
    };
    // 2. Compute the final totals based on the chain and the date
    const totals = useMemo(() => {
        // Step 9: sum basic taxes
        const totalBasicTax = ejsChain.reduce((sum, item) => sum + item.basicTaxDue, 0);

        // Step 10: Apply penalties to the total sum
        // We ensure a minimum tax of P500 is applied to the aggregate if required by law
        const adjustedBasicTax = Math.max(totalBasicTax, 500);

        const penalties = calculateTaxPenalties(adjustedBasicTax, notarialDate);

        return {
            totalMarketValue: "N/A" as any,
            consideration: "N/A" as any,
            taxBase: adjustedBasicTax, // For EJS, taxBase is effectively the sum of shares
            taxRate: 0.75,
            basicTaxDue: adjustedBasicTax,
            ...penalties // Includes surcharge, interest, daysElapsed, validityDate, and totalAmountDue
        };

        // 3. Include notarialDate in the dependencies
    }, [ejsChain, notarialDate]);

    return {
        ejsChain,
        setEjsChain,
        addTransfer,
        totals
    };
}