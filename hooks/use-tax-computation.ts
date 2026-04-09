// hooks/use-tax-computation.ts
import { useMemo } from "react";

interface ComputationProps {
    notarialDate: string;
    transactionType: string;
    totalMarketValue: number;
    consideration: number | "";
}

export function useTaxComputation({
    notarialDate,
    transactionType,
    totalMarketValue,
    consideration,
}: ComputationProps) {
    return useMemo(() => {
        // 1. Calculate Tax Base
        const taxBase = transactionType === "Deed of Sale"
            ? Math.max(totalMarketValue, Number(consideration || 0))
            : totalMarketValue;

        // 2. Basic Tax Due (0.75% with P500 minimum)
        const taxDue = Math.max(taxBase * 0.0075, 500);

        // 3. Penalty Logic
        let daysElapsed = 0;
        let surcharge = 0;
        let interest = 0;
        let validityDate = "";

        if (notarialDate) {
            const start = new Date(notarialDate);
            const today = new Date();
            daysElapsed = Math.ceil(Math.abs(today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

            // Surcharge (25% after 60 days)
            if (daysElapsed > 60) surcharge = taxDue * 0.25;

            // Interest (2% per month after 90 days, capped at 72%)
            if (daysElapsed > 90) {
                const monthsLate = Math.ceil((daysElapsed - 90) / 30);
                interest = Math.min(taxDue * 0.02 * monthsLate, taxDue * 0.72);
            }

            // Validity Date Calculation
            if (daysElapsed > 90) {
                if (interest >= taxDue * 0.72) {
                    validityDate = "MAXIMUM INTEREST REACHED";
                } else {
                    const daysIntoCycle = (daysElapsed - 90) % 30;
                    const daysToNext = daysIntoCycle === 0 ? 0 : 30 - daysIntoCycle;
                    const vDate = new Date();
                    vDate.setDate(vDate.getDate() + daysToNext);
                    validityDate = vDate.toLocaleDateString('EN-US').toUpperCase();
                }
            } else {
                const gracePeriod = daysElapsed > 60 ? 90 : 60;
                const vDate = new Date(start);
                vDate.setDate(vDate.getDate() + gracePeriod);
                validityDate = vDate.toLocaleDateString('EN-US').toUpperCase();
            }
        }

        return {
            taxBase,
            taxDue,
            surcharge,
            interest,
            totalAmountDue: taxDue + surcharge + interest,
            daysElapsed,
            validityDate,
        };
    }, [notarialDate, transactionType, totalMarketValue, consideration]);
}