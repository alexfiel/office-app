export const calculateEJSTotals = (chain: any[] = [], baseComputation: any = null) => {
    const initial = baseComputation ? {
        taxDue: Number(baseComputation.basicTaxDue || 0),
        surcharge: Number(baseComputation.surcharge || 0),
        interest: Number(baseComputation.interest || 0),
        total: Number(baseComputation.totalAmountDue || 0)
    } : { taxDue: 0, surcharge: 0, interest: 0, total: 0 };

    return chain.reduce(
        (acc, item) => {
            acc.taxDue += Number(item.basicTaxDue || 0);
            acc.surcharge += Number(item.surcharge || 0);
            acc.interest += Number(item.interest || 0);
            acc.total += Number(item.totalAmountDue || item.basicTaxDue || 0); // Handle both
            return acc;
        },
        initial
    )
};

export const computeGrandTotal = (invoice: any, isEJS: boolean, ejsTotals: any) => {
    return isEJS ? ejsTotals.total : Number(invoice.computation?.totalAmountDue || 0);

}