import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { scoreOpportunity } from "../services/scoring.service.js";

export const opportunityRouter = Router();
opportunityRouter.use(requireAuth);

opportunityRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const items = await prisma.opportunity.findMany({ where: { organizationId: req.user!.organizationId }, include: { account: true, contact: true }, orderBy: { opportunityScore: "desc" }, take: 200 });
    res.json({ items });
  } catch (e) { next(e); }
});

opportunityRouter.post("/recalculate/:accountId", async (req: AuthRequest, res, next) => {
  try {
    const s = await scoreOpportunity(String(req.params.accountId), req.user!.organizationId);
    const account = await prisma.account.findUnique({ where: { id: String(req.params.accountId) }, include: { contacts: true } });
    if (!account) return res.status(404).json({ error: "Account not found" });
    const opportunity = await prisma.opportunity.create({
      data: {
        organizationId: req.user!.organizationId, accountId: account.id, contactId: (account as any).contacts.find((c: any)=>c.isDecisionMaker)?.id,
        opportunityType: "BUYING_OPPORTUNITY", title: `${account.companyName} opportunity`, summary: "Generated from stored signals and qualification data.",
        buyerIntentScore: s.buyer, sellerIntentScore: s.seller, requirementScore: s.req, fitScore: s.fit, economicScore: s.economic,
        readinessScore: s.readiness, growthScore: s.growth, confidenceScore: s.evidence, opportunityScore: s.score,
        classification: s.classification as any, urgency: s.buyer >= 80 ? "HIGH" : "MODERATE",
        recommendedAction: s.score >= 80 ? "Contact the strongest decision-maker with an evidence-led discovery message." : "Nurture and gather additional evidence."
      }
    });
    res.status(201).json({ opportunity });
  } catch (e) { next(e); }
});
