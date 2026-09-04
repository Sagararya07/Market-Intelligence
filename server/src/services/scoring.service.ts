import { prisma } from "../lib/prisma.js";

export async function scoreOpportunity(accountId: string, organizationId: string) {
  const [config, account, latestAssessment, requirements, buyerIntents, sellerIntents, growthSignals] = await Promise.all([
    prisma.scoringConfig.findUnique({ where: { organizationId } }),
    prisma.account.findUnique({ where: { id: accountId }, include: { contacts: true, signals: true } }),
    prisma.icpAssessment.findFirst({ where: { accountId }, orderBy: { evaluatedAt: "desc" } }),
    prisma.requirement.findMany({ where: { accountId }, orderBy: { confidence: "desc" }, take: 5 }),
    prisma.buyerIntent.findMany({ where: { accountId }, orderBy: { score: "desc" }, take: 5 }),
    prisma.sellerIntent.findMany({ where: { accountId }, orderBy: { score: "desc" }, take: 5 }),
    prisma.growthSignal.findMany({ where: { accountId }, orderBy: { confidence: "desc" }, take: 5 })
  ]);
  if (!account) throw Object.assign(new Error("Account not found"), { statusCode: 404 });

  const c = config ?? {
    buyerIntentWeight: .25, requirementWeight: .2, fitWeight: .2, readinessWeight: .15,
    economicWeight: .1, growthWeight: .05, evidenceWeight: .05, hotThreshold: 80, warmThreshold: 60, coldThreshold: 40
  };
  const buyer = buyerIntents[0]?.score ?? 0;
  const seller = sellerIntents[0]?.score ?? 0;
  const req = requirements[0]?.confidence ? requirements[0].confidence * 100 : 0;
  const fit = latestAssessment?.overallScore ?? 0;
  const readiness = latestAssessment?.buyingReadinessScore ?? 0;
  const economic = latestAssessment?.economicFitScore ?? 0;
  const growth = growthSignals[0]?.confidence ? growthSignals[0].confidence * 100 : 0;
  const evidence = Math.min(100, account.signals.length * 20);
  const score = buyer*c.buyerIntentWeight + req*c.requirementWeight + fit*c.fitWeight +
    readiness*c.readinessWeight + economic*c.economicWeight + growth*c.growthWeight + evidence*c.evidenceWeight;
  const classification = score >= c.hotThreshold ? "HOT" : score >= c.warmThreshold ? "WARM" : score >= c.coldThreshold ? "COLD" : "NURTURE";
  return { buyer, seller, req, fit, readiness, economic, growth, evidence, score: Math.round(score), classification };
}
