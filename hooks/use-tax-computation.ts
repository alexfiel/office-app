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
        const mv = Number(totalMarketValue) || 0;
        const con = Number(consideration) || 0;

        // 1. Corrected Tax Base Logic: Case-insensitive check
        // Also added Certificate of Sale as it follows the same "Higher Of" rule
        const isSale = ["DEED OF SALE", "CERTIFICATE OF SALE"].includes(transactionType.toUpperCase());

        const taxBase = isSale ? Math.max(mv, con) : mv;

        // 2. Basic Tax Due (0.75% with P500 minimum)
        const taxDue = Math.max(taxBase * 0.0075, 500);

        // 3. Penalty Logic
        let daysElapsed = 0;
        let surcharge = 0;
        let interest = 0;
        let validityDate = "N/A";

        if (notarialDate) {
            const start = new Date(notarialDate);
            const today = new Date();

            // Remove the time portion to avoid partial-day math issues
            start.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);

            // Use simple subtraction. Only calculate if the date is in the past.
            const diffTime = today.getTime() - start.getTime();
            daysElapsed = diffTime > 0 ? Math.floor(diffTime / (1000 * 60 * 60 * 24)) : 0;

            // Surcharge (25% after 60 days)
            if (daysElapsed > 60) surcharge = taxDue * 0.25;

            // Interest (2% per month after 90 days, capped at 72% / 36 months)
            if (daysElapsed > 90) {
                const monthsLate = Math.ceil((daysElapsed - 90) / 30);
                interest = Math.min(taxDue * 0.02 * monthsLate, taxDue * 0.72);
            }

            // Validity Date Logic
            if (daysElapsed > 90) {
                if (interest >= taxDue * 0.72) {
                    validityDate = "MAXIMUM INTEREST REACHED";
                } else {
                    // Valid until the end of the current 30-day interest cycle
                    const daysIntoCycle = (daysElapsed - 90) % 30;
                    const daysToNext = 30 - daysIntoCycle;
                    const vDate = new Date();
                    vDate.setDate(vDate.getDate() + (daysToNext - 1)); // -1 to be safe for same-day payments
                    validityDate = vDate.toLocaleDateString('EN-US').toUpperCase();
                }
            } else {
                // Not yet penalized: Valid until the next penalty threshold
                const nextThreshold = daysElapsed <= 60 ? 60 : 90;
                const vDate = new Date(start);
                vDate.setDate(vDate.getDate() + nextThreshold);
                validityDate = vDate.toLocaleDateString('EN-US').toUpperCase();
            }
        }

        return {
            taxBase,
            consideration: con,
            totalMarketValue: mv, // Return this for comparison display in Summary
            taxDue,
            surcharge,
            interest,
            totalAmountDue: taxDue + surcharge + interest,
            daysElapsed,
            validityDate,
        };
    }, [notarialDate, transactionType, totalMarketValue, consideration]);
}