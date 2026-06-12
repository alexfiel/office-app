const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tx = await prisma.newTransferTax.findUnique({
    where: { t_controlNumber: 'TT-1781236133679-35' },
    include: {
      t_transfertaxdetails: true
    }
  });
  console.dir(tx, { depth: null });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
