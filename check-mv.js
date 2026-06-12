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

  tx.t_transfertaxdetails.forEach(dt => {
    console.log(`Property: ${dt.nt_taxdecnumber}, MV: ${dt.nt_marketvalue}, Cons: ${dt.nt_considerationvalue}, TaxBase: ${dt.nt_taxbase}, TaxDue: ${dt.nt_transfertaxDue}`);
  });
  console.log(`HEADER: t_TotalMarketValue: ${tx.t_TotalMarketValue}, t_TotalConsiderationValue: ${tx.t_TotalConsiderationValue}, t_TaxBase: ${tx.t_TaxBase}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
