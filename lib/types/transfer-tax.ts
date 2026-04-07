export interface NotarialDocumentInput {
    userId: string;
    name: string;
    type: string;
    number: string;
    date: string | Date;
    notarizedBy: string;
    documentUrl?: string;
}

export interface TransferTaxInput {
    userId: string;
    transferee: string;
    transferor: string;
    transactionType: string;
    considerationvalue: number;
    totalmarketvalue: number;
    taxbase: number;
    taxdue: number;
    surcharge: number;
    interest: number;
    totalamountdue: number;
    paymentstatus?: string;
    transactiondate: string | Date;
    validuntil: string;
}

export interface TransferTaxDetailInput {
    userId: string;
    taxdecnumber: string;
    lotNumber: string;
    owner: string;
    marketValue: number;
    area: number;
}

// The wrapper for the enture form submission
export interface TransferTaxFormSubmission {
    documentInfo: NotarialDocumentInput;
    transferTaxInfo: TransferTaxInput;
    transferTaxDetails: TransferTaxDetailInput[];
}

