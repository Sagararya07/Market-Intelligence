import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.account.deleteMany({});
  console.log(`Deleted ${result.count} accounts and all their cascaded intelligence data.`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
