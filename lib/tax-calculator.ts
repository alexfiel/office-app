import { calculateTaxPenalties, PenaltyResult } from "./tax-utils";

export type TransactionType =
    | "DEED OF SALE"
    | "CERTIFICATE OF SALE"
    | "DEED OF DONATION"
    | "DEED OF EXTRAJUDICIAL SETTLEMENT"
    | "DEED OF PARTITION"
    | "DEED OF ASSIGNMENT OF RIGHTS"
    | "DEED OF WAIVER OF RIGHTS"
    | "DEED OF ADJUDICATION"
    | string;

export interface ComputationResult extends PenaltyResult {
    totalMarketValue: number;
    consideration: number;
    taxBase: number;
    taxRate: number;
    basicTaxDue: number;
}

export class TransferTaxCalculator {
    static TAX_RATE = 0.0075;
    static MIN_TAX = 500;

    /**
     * Compute the Tax Base given the rules for each transaction type.
     */
    static computeBase(
        transactionType: TransactionType,
        marketValue: number,
        consideration: number = 0,
        share: number = 1
    ): number {
        const type = transactionType.toUpperCase();
        const mv = Number(marketValue) || 0;
        const con = Number(consideration) || 0;

        if (type === "DEED OF SALE" || type === "CERTIFICATE OF SALE") {
            return Math.max(mv, con);
        } else if (type === "DEED OF DONATION") {
            return mv;
        } else if (type === "DEED OF EXTRAJUDICIAL SETTLEMENT" || type === "DEED OF PARTITION") {
            return mv * share;
        }

        // Default fallback
        return Math.max(mv, con);
    }

    /**
     * Calculate the basic tax due, enforcing the minimum threshold.
     */
    static computeBasicTaxDue(taxBase: number): number {
        if (isNaN(taxBase)) return this.MIN_TAX;
        return Math.max(taxBase * this.TAX_RATE, this.MIN_TAX);
    }

    /**
     * Compute the aggregate totals including penalties.
     */
    static computeTotal(
        transactionType: TransactionType,
        totalMarketValue: number,
        consideration: number,
        notarialDate: string,
        share: number = 1
    ): ComputationResult {
        const taxBase = this.computeBase(transactionType, totalMarketValue, consideration, share);
        const basicTaxDue = this.computeBasicTaxDue(taxBase);
        const penalties = calculateTaxPenalties(basicTaxDue, notarialDate);

        return {
            totalMarketValue: Number(totalMarketValue) || 0,
            consideration: Number(consideration) || 0,
            taxBase,
            taxRate: this.TAX_RATE * 100, // Output as 0.75 for UI representation
            basicTaxDue,
            ...penalties
        };
    }
}
