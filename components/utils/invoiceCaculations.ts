export const calculateEJSTotals = (chain: any[] = [], baseComputation: any = null) => {
    // If we have a chain, we sum it up. 
    // If the chain is empty, we fall back to baseComputation.
    // To strictly "solve" the total basic tax for all steps, we sum the chain.
    
    const initial = { taxBase: 0, taxDue: 0, surcharge: 0, interest: 0, total: 0 };

    if (chain.length > 0) {
        return chain.reduce(
            (acc, item) => {
                acc.taxBase += Number(item.taxBase || 0);
                acc.taxDue += Number(item.basicTaxDue || 0);
                acc.surcharge += Number(item.surcharge || 0);
                acc.interest += Number(item.interest || 0);
                acc.total += Number(item.totalAmountDue || item.basicTaxDue || 0);
                return acc;
            },
            initial
        );
    }

    // Fallback to baseComputation if no chain
    if (baseComputation) {
        return {
            taxBase: Number(baseComputation.taxBase || 0),
            taxDue: Number(baseComputation.basicTaxDue || 0),
            surcharge: Number(baseComputation.surcharge || 0),
            interest: Number(baseComputation.interest || 0),
            total: Number(baseComputation.totalAmountDue || 0)
        };
    }

    return initial;
};

export const computeGrandTotal = (invoice: any, isEJS: boolean, ejsTotals: any) => {
    return isEJS ? ejsTotals.total : Number(invoice.computation?.totalAmountDue || 0);

}