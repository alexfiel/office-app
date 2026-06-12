const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tx = await prisma.newTransferTax.findUnique({
    where: { t_controlNumber: 'TT-1781236133679-35' },
    include: {
      notarialDocument: true,
      t_transfertaxdetails: true
    }
  });

  let totalTaxBase = 0;
  let totalTaxDue = 0;
  
  tx.t_transfertaxdetails.forEach(dt => {
    console.log(`Property: ${dt.nt_taxdecnumber}, Tax Base: ${dt.nt_taxbase}, Tax Due: ${dt.nt_transfertaxDue}`);
    totalTaxBase += Number(dt.nt_taxbase);
    totalTaxDue += Number(dt.nt_transfertaxDue);
  });
  
  console.log('---');
  console.log(`Total Tax Base from details: ${totalTaxBase}`);
  console.log(`Total Tax Due from details: ${totalTaxDue}`);
  console.log(`t_TaxBase in header: ${tx.t_TaxBase}`);
  console.log(`t_TotalAmountDue in header: ${tx.t_TotalAmountDue}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
