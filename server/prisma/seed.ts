import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany(); await prisma.opportunityMatch.deleteMany(); await prisma.opportunitySignal.deleteMany();
  await prisma.evidence.deleteMany(); await prisma.opportunity.deleteMany(); await prisma.accountEvent.deleteMany();
  await prisma.diagnosisDimension.deleteMany(); await prisma.diagnosis.deleteMany(); await prisma.strategicIntent.deleteMany();
  await prisma.icpAssessment.deleteMany(); await prisma.icpRule.deleteMany(); await prisma.icpProfile.deleteMany();
  await prisma.productServiceProfile.deleteMany(); await prisma.accountIntelligence.deleteMany();
  await prisma.growthSignal.deleteMany(); await prisma.painPoint.deleteMany(); await prisma.requirement.deleteMany();
  await prisma.buyerIntent.deleteMany(); await prisma.sellerIntent.deleteMany(); await prisma.signalClassification.deleteMany();
  await prisma.marketSignal.deleteMany(); await prisma.accountTechnology.deleteMany(); await prisma.technology.deleteMany();
  await prisma.contact.deleteMany(); await prisma.accountDataSource.deleteMany(); await prisma.account.deleteMany();
  await prisma.scoringConfig.deleteMany(); await prisma.importJob.deleteMany(); await prisma.user.deleteMany(); await prisma.organization.deleteMany();

  const org = await prisma.organization.create({ data: { name: "Demo Organization", slug: "demo-organization", website: "https://example.com", country: "US" }});
  const hash = await bcrypt.hash("Admin123!", 12);
  await prisma.user.create({ data: { organizationId: org.id, firstName: "Admin", lastName: "User", email: "admin@example.com", passwordHash: hash, role: "ADMIN" }});
  await prisma.scoringConfig.create({ data: { organizationId: org.id }});

  const icp = await prisma.icpProfile.create({ data: { organizationId: org.id, name: "Default Target Profile", description: "Configurable demonstration ICP." }});
  await prisma.icpRule.createMany({ data: [
    { icpProfileId: icp.id, dimension: "COMPANY_SIZE", ruleType: "numeric", fieldName: "employeeCount", operator: "between", value: [50,500], weight: 20 },
    { icpProfileId: icp.id, dimension: "REVENUE", ruleType: "numeric", fieldName: "annualRevenue", operator: "greaterThan", value: 5000000, weight: 20 },
    { icpProfileId: icp.id, dimension: "GEOGRAPHY", ruleType: "categorical", fieldName: "country", operator: "in", value: ["US","UK","IN"], weight: 10 }
  ]});

  console.log("Seed complete");
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>prisma.$disconnect());
