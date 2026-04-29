import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const apiKey = await prisma.apiKeyModel.findFirst();
  if (apiKey) {
    console.log('API_KEY=' + apiKey.key);
  } else {
    console.log('No API key found');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
