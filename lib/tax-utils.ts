// lib/tax-utils.ts

export interface PenaltyResult {
    daysElapsed: number;
    surcharge: number;
    interest: number;
    validityDate: string;
    totalAmountDue: number;
}

export function calculateTaxPenalties(taxDue: number, notarialDate: string): PenaltyResult {
    let daysElapsed = 0;
    let surcharge = 0;
    let interest = 0;
    let validityDate = "N/A";

    if (!notarialDate) {
        return { daysElapsed, surcharge, interest, validityDate, totalAmountDue: taxDue };
    }

    const start = new Date(notarialDate);
    const today = new Date();

    // Normalize dates to midnight to avoid hour-based discrepancies
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - start.getTime();
    daysElapsed = diffTime > 0 ? Math.floor(diffTime / (1000 * 60 * 60 * 24)) : 0;

    // 1. Surcharge Logic (25% after 60 days)
    if (daysElapsed > 60) {
        surcharge = taxDue * 0.25;
    }

    // 2. Interest Logic (2% per month after 90 days, capped at 72%)
    if (daysElapsed > 90) {
        const monthsLate = Math.ceil((daysElapsed - 90) / 30);
        interest = Math.min(taxDue * 0.02 * monthsLate, taxDue * 0.72);
    }

    // 3. Validity Date Logic
    if (daysElapsed > 90) {
        if (interest >= taxDue * 0.72) {
            validityDate = "MAXIMUM INTEREST REACHED";
        } else {
            const daysIntoCycle = (daysElapsed - 90) % 30;
            const daysToNext = 30 - daysIntoCycle;
            const vDate = new Date();
            vDate.setDate(vDate.getDate() + (daysToNext - 1));
            validityDate = vDate.toLocaleDateString('EN-US').toUpperCase();
        }
    } else {
        const nextThreshold = daysElapsed <= 60 ? 60 : 90;
        const vDate = new Date(start);
        vDate.setDate(vDate.getDate() + nextThreshold);
        validityDate = vDate.toLocaleDateString('EN-US').toUpperCase();
    }

    return {
        daysElapsed,
        surcharge,
        interest,
        validityDate,
        totalAmountDue: taxDue + surcharge + interest
    };
}