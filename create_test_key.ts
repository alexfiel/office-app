import 'dotenv/config';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password',
      designation: 'Tester',
    },
  });

  const apiKey = await prisma.apiKeyModel.upsert({
    where: { key: 'TEST_API_KEY' },
    update: {},
    create: {
      key: 'TEST_API_KEY',
      name: 'Test Key',
      userId: user.id,
    },
  });

  console.log('Test API Key created/ensured: TEST_API_KEY');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
