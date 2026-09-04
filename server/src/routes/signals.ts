import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { classifySignal } from "../services/ai.service.js";

export const signalRouter = Router();
signalRouter.use(requireAuth);

signalRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const items = await prisma.marketSignal.findMany({
      where: { organizationId: req.user!.organizationId },
      include: { account: true, classification: true, buyerIntent: true, sellerIntent: true },
      orderBy: { detectedAt: "desc" },
      take: 200
    });
    res.json({ items });
  } catch (e) { next(e); }
});

signalRouter.post("/", async (req: AuthRequest, res, next) => {
  try {
    const { accountId, title, content = "", sourceName = "Manual", sourceType = "MANUAL", signalType = "OTHER" } = req.body;
    const signal = await prisma.marketSignal.create({ data: { organizationId: req.user!.organizationId, accountId, title, content, summary: content, sourceName, sourceType, signalType, signalStrength: 50, confidence: 0.5 } });
    const ai = await classifySignal({ title, content });
    await prisma.signalClassification.create({ data: { signalId: signal.id, intentType: ai.intent.buyer >= 70 && ai.intent.seller >= 70 ? "BOTH" : ai.intent.buyer >= 70 ? "BUY" : ai.intent.seller >= 70 ? "SELL" : ai.intent.requirement >= 70 ? "REQUIREMENT" : "UNKNOWN", confidence: ai.requirement.confidence, reasoningSummary: "Deterministic development-mode intelligence classification", detectedKeywords: title.toLowerCase().split(/\s+/).slice(0,8), semanticEvidence: ai.requirement.problem } });
    if (accountId && ai.intent.buyer >= 70) {
      await prisma.buyerIntent.create({ data: { accountId, signalId: signal.id, score: ai.intent.buyer, level: ai.intent.buyer >= 80 ? "HOT" : "WARM", requirementSummary: ai.requirement.title, urgency: ai.requirement.urgency, timeline: ai.requirement.timeline, confidence: ai.requirement.confidence, decisionMakerDetected: false } });
      await prisma.requirement.create({ data: { accountId, signalId: signal.id, requirementType: "DETECTED", category: "OTHER", title: ai.requirement.title, description: ai.requirement.problem, problemStatement: ai.requirement.problem, desiredSolution: ai.requirement.desiredSolution, urgency: ai.requirement.urgency, timeline: ai.requirement.timeline, status: "POTENTIAL", confidence: ai.requirement.confidence } });
    }
    res.status(201).json({ signal, ai });
  } catch (e) { next(e); }
});
