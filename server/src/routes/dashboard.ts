import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const org = req.user!.organizationId;
    const [accounts, unprocessedAccounts, signals, requirements, opportunities, assessments] = await Promise.all([
      prisma.account.count({ where: { organizationId: org } }),
      prisma.account.count({ where: { organizationId: org, intelligence: { is: null } } }),
      prisma.marketSignal.count({ where: { organizationId: org } }),
      prisma.requirement.count({ where: { account: { organizationId: org } } }),
      prisma.opportunity.findMany({ where: { organizationId: org }, select: { classification: true, opportunityScore: true } }),
      prisma.icpAssessment.findMany({ where: { account: { organizationId: org } }, orderBy: { evaluatedAt: "desc" }, distinct: ["accountId"] })
    ]);
    const byClass = opportunities.reduce((a, o) => ((a[o.classification] = (a[o.classification] ?? 0)+1), a), {} as Record<string,number>);
    const avg = assessments.length ? Math.round(assessments.reduce((s,a)=>s+a.overallScore,0)/assessments.length) : 0;
    res.json({ accounts, unprocessedAccounts, signals, requirements, hotOpportunities: byClass.HOT ?? 0, warmOpportunities: byClass.WARM ?? 0, qualifiedAccounts: assessments.filter(a=>a.overallScore>=70).length, opportunities, averageIcp: avg });
  } catch (e) { next(e); }
});
