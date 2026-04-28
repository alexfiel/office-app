const { PrismaClient } = require('./lib/generated/prisma');

const prisma = new PrismaClient();

async function main() {
  try {
    const apiKey = await prisma.apiKeyModel.findFirst();
    if (apiKey) {
      console.log('API_KEY=' + apiKey.key);
    } else {
      console.log('No API key found');
    }
  } catch (err) {
    console.error('Error fetching API key:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
