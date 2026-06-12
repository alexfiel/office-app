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
  console.dir({
    notarialDate: tx.notarialDocument.notarialDate,
    t_DateCompute: tx.t_DateCompute,
    t_daysElapsed: tx.t_daysElapsed,
    t_TotalAmountDue: tx.t_TotalAmountDue,
    t_TotalSurcharge: tx.t_TotalSurcharge,
    t_TotalInterest: tx.t_TotalInterest
  }, { depth: null });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
