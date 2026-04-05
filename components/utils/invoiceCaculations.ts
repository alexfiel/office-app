export const calculateEJSTotals = (chain: any[] = []) => {
    return chain.reduce(
        (acc, item) => {
            acc.taxDue += Number(item.basicTaxDue || 0);
            acc.surcharge += Number(item.surcharge || 0);
            acc.interest += Number(item.interest || 0);
            acc.total += Number(item.totalAmountDue || 0);
            return acc;
        },
        { taxDue: 0, surcharge: 0, interest: 0, total: 0 }
    )
};

export const computeGrandTotal = (invoice: any, isEJS: boolean, ejsTotals: any) => {
    return isEJS ? ejsTotals.total : Number(invoice.computation?.totalAmountDue || 0);

}