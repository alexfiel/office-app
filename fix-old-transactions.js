const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tx = await prisma.newTransferTax.findUnique({
    where: { t_controlNumber: 'TT-1781236133679-35' },
    include: { t_transfertaxdetails: true }
  });

  if (!tx) return;

  const totalMV = tx.t_TotalMarketValue;
  const totalCons = tx.t_TotalConsiderationValue;

  for (const dt of tx.t_transfertaxdetails) {
    const mv = Number(dt.nt_marketvalue);
    const apportionedCons = totalCons * (mv / totalMV);
    
    let taxBase = Math.max(mv, apportionedCons);
    let taxDue = Math.max(taxBase * 0.0075, 500);

    await prisma.newTransferTaxDetails.update({
      where: { id: dt.id },
      data: {
        nt_considerationvalue: apportionedCons,
        nt_taxbase: taxBase,
        nt_transfertaxDue: taxDue,
      }
    });
    console.log(`Updated property ${dt.nt_taxdecnumber}: Cons=${apportionedCons}, TaxDue=${taxDue}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
