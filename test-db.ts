import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("--- Checking Database State ---");
  const users = await prisma.user.findMany();
  console.log("Total Users:", users.length);
  for (const user of users) {
    console.log(`User: ${user.email}, ID: ${user.id}, OrgID: ${user.organizationId}`);
  }
  
  const orgs = await prisma.organization.findMany();
  console.log("Total Organizations:", orgs.length);
  
  const accounts = await prisma.account.count();
  const assessments = await prisma.icpAssessment.count();
  const signals = await prisma.marketSignal.count();
  const opps = await prisma.opportunity.count();
  console.log(`Accounts: ${accounts}, Assessments: ${assessments}, Signals: ${signals}, Opportunities: ${opps}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
