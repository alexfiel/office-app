// lib/types/property.ts

/**
 * Represents the core property data from your database/CSV
 */

export type DocumentInfo = {
    type: string;
    docNo: string;
    pageNo: string;
    bookNo: string;
    notarizedBy: string;
    date: string;
    document_url: string;
}

export type RealPropertyInfo = {
    id: string;
    taxdecnumber: string;
    pin: string;
    owner: string;
    location: string;
    lotNumber: string;
    area: number;
    marketValue: string | number;
    // Optional data added specifically during EJS transactions
    ejsData?: {
        deceasedOwners: string[];
        parsedOwners: string[];
        shareFraction: number;
    };
};

/**
 * Represents subsequent transfers in an EJS chain 
 * (e.g., Heirs waiving rights or selling to a third party)
 */
export type EjsSubTransfer = {
    id: string;
    title: string;
    type: string;
    transferee: string;
    transferor: string;
    properties: RealPropertyInfo[];
    consideration: number;
    taxBase: number;
    taxDue: number;
    surcharge: number;
    interest: number;
    totalAmountDue: number;
};

/**
 * The structure expected by your /api/transfertax POST route
 */
export type TransferTaxPayload = {
    documentInfo: {
        type: string;
        name: string;
        number: string; // Combined Doc, Page, Book
        date: string;   // ISO String
        notarizedBy: string;
        document_url: string;
    };
    transferTaxInfo: {
        transferee: string;
        transferor: string;
        transactionType: string;
        considerationValue: number;
        totalMarketValue: number;
        taxBase: number;
        taxDue: number;
        surcharge: number;
        interest: number;
        totalAmountDue: number;
        paymentStatus: "Pending" | "Paid";
        transactionDate: string;
        dayselapsed: number;
        validUntil: string;
    };
    transferTaxDetails: Array<{
        id: string;
        taxdecnumber: string;
        lotNumber: string;
        owner: string;
        marketValue: number;
        area: string;
    }>;
};